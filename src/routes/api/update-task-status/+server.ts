import { db } from "$lib/server/db";
import { tasks } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { computeNextOccurrence, normalizeRecurrence } from "$lib/tasks/recurrence";
import { getRuntimeEnv } from "$lib/server/config";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId)
      return json({ message: "Unauthorized" }, { status: 401 });

    const { id, value }: { id?: string; value?: boolean } = await request.json();
    if (!id || typeof value !== "boolean")
      return json({ message: "Invalid payload" }, { status: 400 });

    const [taskRecord] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!taskRecord)
      return json({ message: "Task not found" }, { status: 404 });

    const recurrence = normalizeRecurrence(taskRecord.recurrence);

    if (value && recurrence) {
      const nextDue = computeNextOccurrence(taskRecord.due ?? null, recurrence, getRuntimeEnv().workspaceTimezone);
      await db
        .update(tasks)
        .set({ status: false, due: nextDue })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    } else {
      await db
        .update(tasks)
        .set({ status: value })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api] update-task-status", error);
    return json({ message: "Unable to update task" }, { status: 500 });
  }
};
