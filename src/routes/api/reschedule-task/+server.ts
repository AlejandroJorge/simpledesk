import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { tasks } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { computeTodayOrNextWorkday, normalizeRecurrence } from "$lib/tasks/recurrence";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id }: { id?: string } = await request.json();
    if (!id)
      return json({ message: "Task id is required" }, { status: 400 });

    const [taskRecord] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!taskRecord)
      return json({ message: "Task not found" }, { status: 404 });

    const recurrence = normalizeRecurrence(taskRecord.recurrence);
    if (!recurrence)
      return json({ message: "Task is not recurring" }, { status: 400 });

    const nextDue = computeTodayOrNextWorkday(taskRecord.due ?? null, recurrence);
    await db.update(tasks).set({ due: nextDue, status: false }).where(eq(tasks.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api] reschedule-task", error);
    return json({ message: "Unable to reschedule task" }, { status: 500 });
  }
};
