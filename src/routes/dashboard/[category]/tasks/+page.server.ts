import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks } from "$lib/server/db/schema";
import { and, asc, eq, sql, like, lt, or, isNull } from "drizzle-orm";
import dayjs from "dayjs";

const resolveCategory = async (categoryName: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const loadTasks = async (categoryId: string, { q, onlyTodo, interval }: { q?: string, onlyTodo?: boolean, interval?: number }) => {
  const whereClause = and(
    eq(tasks.categoryId, categoryId),
    q ? like(tasks.name, `%${q}%`) : undefined,
    onlyTodo ? eq(tasks.status, false) : undefined,
    interval ? or(lt(tasks.due, new Date(Date.now() + (interval * 24 * 60 * 60 * 1000))),isNull(tasks.due)) : undefined,
  )

  return db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due));
}

export const load: PageServerLoad = async ({ params, url }) => {
  const { id } = await resolveCategory(params.category);
  const q = url.searchParams.get("q") ?? ""
  const onlyTodo = url.searchParams.get("onlyTodo") ? true : false
  const interval = Number(url.searchParams.get("interval"))

  const qParams = { q, onlyTodo, interval }
  const queryTasks = await loadTasks(id, qParams);

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
