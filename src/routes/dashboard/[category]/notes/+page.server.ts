import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, notes } from "$lib/server/db/schema";
import { and, asc, desc, eq, like } from "drizzle-orm";

const resolveCategory = async (categoryId: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const loadNotes = async (categoryId: string, search?: string) => {
  const whereClause = and(
    eq(notes.categoryId, categoryId),
    search ? like(notes.name, `%${search}%`) : undefined
  );

  return db
    .select()
    .from(notes)
    .where(whereClause)
    .orderBy(asc(notes.position), asc(notes.name));
};

export const load: PageServerLoad = async ({ params, url }) => {
  const category = await resolveCategory(params.category);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const queryNotes = await loadNotes(category.id, q || undefined);

  return {
    category,
    notes: queryNotes,
    filters: { q }
  };
};

export const actions = {
  createNote: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true, message: "Note title is required" });

    const content = data.get("content") as string;
    if (!content) return fail(400, { content, missing: true, message: "Note content is required" });

    const { id: categoryId } = await resolveCategory(params.category);

    try {
      const [lastNote] = await db
        .select({ position: notes.position })
        .from(notes)
        .where(eq(notes.categoryId, categoryId))
        .orderBy(desc(notes.position))
        .limit(1);

      const nextPosition = (lastNote?.position ?? -1) + 1;

      await db.insert(notes).values({ name, content, categoryId, position: nextPosition });
      console.info("[notes] create", {
        categoryId,
        noteName: name,
        assignedPosition: nextPosition,
      });
    } catch (err) {
      console.error("[notes] createNote", err);
      return fail(500, { message: "Unable to create note" });
    }

    return { success: true };
  },
  updateNote: async ({ request }) => {
    const data = await request.formData();

    const id = data.get("id") as string;
    if (!id) return fail(400, { id, missing: true, message: "Note id is required" });

    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true, message: "Note title is required" });

    const content = data.get("content") as string;

    try {
      await db.update(notes).set({ name, content }).where(eq(notes.id, id));
    } catch (err) {
      console.error("[notes] updateNote", err);
      return fail(500, { message: "Unable to update note" });
    }

    return { success: true };
  }
} satisfies Actions;
