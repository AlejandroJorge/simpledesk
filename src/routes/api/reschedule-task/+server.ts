import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { tasks } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { computeTodayOrNextWorkday, normalizeRecurrence } from "$lib/tasks/recurrence";
import { getRuntimeEnv } from "$lib/server/config";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId)
      return json({ message: "Unauthorized" }, { status: 401 });

    const { id }: { id?: string } = await request.json();
    if (!id)
      return json({ message: "Task id is required" }, { status: 400 });

    const [taskRecord] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!taskRecord)
      return json({ message: "Task not found" }, { status: 404 });

    const recurrence = normalizeRecurrence(taskRecord.recurrence);
    if (!recurrence)
      return json({ message: "Task is not recurring" }, { status: 400 });

    const nextDue = computeTodayOrNextWorkday(taskRecord.due ?? null, recurrence, getRuntimeEnv().workspaceTimezone);
    await db
      .update(tasks)
      .set({ due: nextDue, status: false })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api] reschedule-task", error);
    return json({ message: "Unable to reschedule task" }, { status: 500 });
  }
};
