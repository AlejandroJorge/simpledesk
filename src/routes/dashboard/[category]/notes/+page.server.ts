import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, notes } from "$lib/server/db/schema";
import { asc, desc, eq } from "drizzle-orm";

const resolveCategory = async (categoryName: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const loadNotes = async (categoryId: string) =>
  db
    .select()
    .from(notes)
    .where(eq(notes.categoryId, categoryId))
    .orderBy(asc(notes.position), asc(notes.name));

export const load: PageServerLoad = async ({ params }) => {
  const category = await resolveCategory(params.category);
  const queryNotes = await loadNotes(category.id);

  return {
    category,
    notes: queryNotes
  };
};

export const actions = {
  createNote: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true });

    const content = data.get("content") as string;
    if (!content) return fail(400, { content, missing: true });

    const { id: categoryId } = await resolveCategory(params.category);

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

    return { success: true };
  },
  updateNote: async ({ request }) => {
    const data = await request.formData();

    const id = data.get("id") as string;
    if (!id) return fail(400, { id, missing: true });

    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true });

    const content = data.get("content") as string;

    await db.update(notes).set({ name, content }).where(eq(notes.id, id));

    return { success: true };
  }
} satisfies Actions;
