import { db } from "$lib/server/db";
import { tasks } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { computeNextOccurrence, normalizeRecurrence } from "$lib/tasks/recurrence";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, value }: { id?: string; value?: boolean } = await request.json();
    if (!id || typeof value !== "boolean")
      return json({ message: "Invalid payload" }, { status: 400 });

    const [taskRecord] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!taskRecord)
      return json({ message: "Task not found" }, { status: 404 });

    const recurrence = normalizeRecurrence(taskRecord.recurrence);

    if (value && recurrence) {
      const nextDue = computeNextOccurrence(taskRecord.due ?? null, recurrence);
      await db.update(tasks).set({ status: false, due: nextDue }).where(eq(tasks.id, id));
    } else {
      await db.update(tasks).set({ status: value }).where(eq(tasks.id, id));
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api] update-task-status", error);
    return json({ message: "Unable to update task" }, { status: 500 });
  }
};
