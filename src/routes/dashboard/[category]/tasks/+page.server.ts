import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks } from "$lib/server/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import dayjs from "dayjs";

const resolveCategory = async (categoryName: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const loadTasks = async (categoryId: string) =>
  db
    .select()
    .from(tasks)
    .where(eq(tasks.categoryId, categoryId))
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due));

export const load: PageServerLoad = async ({ params }) => {
  const { id } = await resolveCategory(params.category);
  const queryTasks = await loadTasks(id);

  return {
    tasks: queryTasks
  };
};

export const actions = {
  createTask: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true });

    const dueInput = (data.get("due") as string) ?? "";
    const due = dueInput ? dayjs(dueInput as string).toDate() : null;
    const content = (data.get("content") as string) ?? null;
    const status = data.get("status") ? true : false;

    const { id: categoryId } = await resolveCategory(params.category);

    await db.insert(tasks).values({ name, due, content, categoryId, status });

    return { success: true };
  },
  updateTask: async ({ request }) => {
    const data = await request.formData();

    const id = data.get("id") as string;
    if (!id) return fail(400, { id, missing: true });

    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true });

    const dueInput = (data.get("due") as string) ?? "";
    const due = dueInput ? dayjs(dueInput as string).toDate() : null;
    const content = (data.get("content") as string) ?? null;
    const status = data.get("status") ? true : false;

    await db.update(tasks).set({ name, due, content, status }).where(eq(tasks.id, id));

    return { success: true };
  }
} satisfies Actions;
