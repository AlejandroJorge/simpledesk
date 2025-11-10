import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, notes } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

const resolveCategory = async (categoryName: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const loadNotes = async (categoryId: string) => db.select().from(notes).where(eq(notes.categoryId, categoryId));

export const load: PageServerLoad = async ({ params }) => {
  const { id } = await resolveCategory(params.category);
  const queryNotes = await loadNotes(id);

  return {
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

    await db.insert(notes).values({ name, content, categoryId });

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
