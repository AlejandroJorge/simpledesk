import { db } from "$lib/server/db";
import { notes } from "$lib/server/db/schema";
import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const {
    movedNoteId,
    positionMovedTo,
    positionMovedFrom
  }: {
    movedNoteId: string;
    positionMovedTo: number;
    positionMovedFrom: number;
  } = await request.json();

  if (
    typeof movedNoteId !== "string" ||
    typeof positionMovedTo !== "number" ||
    typeof positionMovedFrom !== "number"
  )
    return new Response(null, { status: 400 });

  if (positionMovedTo === positionMovedFrom)
    return new Response(null, { status: 204 });

  const [originalNote] = await db.select().from(notes).where(eq(notes.id, movedNoteId));
  if (!originalNote)
    return new Response(null, { status: 404 });

  const categoryId = originalNote.categoryId;

  if (positionMovedTo > positionMovedFrom) {
    // Moving down/right: shift the intervening notes up one slot.
    await db
      .update(notes)
      .set({ position: sql`${notes.position} - 1` })
      .where(
        and(
          eq(notes.categoryId, categoryId),
          gt(notes.position, positionMovedFrom),
          lte(notes.position, positionMovedTo)
        )
      );
  } else {
    // Moving up/left: shift the intervening notes down one slot.
    await db
      .update(notes)
      .set({ position: sql`${notes.position} + 1` })
      .where(
        and(
          eq(notes.categoryId, categoryId),
          gte(notes.position, positionMovedTo),
          lt(notes.position, positionMovedFrom)
        )
      );
  }

  await db.update(notes).set({ position: positionMovedTo }).where(eq(notes.id, movedNoteId));

  return new Response(null, { status: 204 });
};
