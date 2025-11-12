import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks, notes } from "$lib/server/db/schema";
import { and, asc, eq, or, isNull, like, lt, sql, count } from "drizzle-orm";

const TASKS_PER_PAGE = 10;

type TaskFilters = { q?: string; onlyTodo?: boolean; interval?: number };

const buildTaskWhereClause = ({ q, onlyTodo, interval }: TaskFilters) =>
  and(
    q ? like(tasks.name, `%${q}%`) : undefined,
    onlyTodo ? eq(tasks.status, false) : undefined,
    interval ? or(lt(tasks.due, new Date(Date.now() + interval * 24 * 60 * 60 * 1000)), isNull(tasks.due)) : undefined
  );

const loadTasks = async (
  filters: TaskFilters,
  { limit, offset }: { limit: number; offset: number }
) => {
  const whereClause = buildTaskWhereClause(filters);

  return db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due))
    .limit(limit)
    .offset(offset);
};

const countTasks = async (filters: TaskFilters) => {
  const whereClause = buildTaskWhereClause(filters);
  const [{ value }] = await db.select({ value: count() }).from(tasks).where(whereClause);
  return value ?? 0;
};

export const load: PageServerLoad = async ({ url }) => {
  const q = url.searchParams.get("q") ?? "";
  const onlyTodo = url.searchParams.get("onlyTodo") === "true";
  const rawInterval = url.searchParams.get("interval");
  const parsedInterval = rawInterval ? Number(rawInterval) : undefined;
  const interval =
    typeof parsedInterval === "number" && Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : undefined;
  const rawPage = url.searchParams.get("page");
  const parsedPage = rawPage ? Number(rawPage) : NaN;
  let page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const filters = { q, onlyTodo, interval };
  const [totalTasks, queryCategories] = await Promise.all([
    countTasks(filters),
    db.select().from(categories).orderBy(asc(categories.name))
  ]);

  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE));
  if (page > totalPages)
    page = totalPages;
  const offset = (page - 1) * TASKS_PER_PAGE;

  const queryTasks = await loadTasks(filters, { limit: TASKS_PER_PAGE, offset });

  return {
    tasks: queryTasks,
    categories: queryCategories,
    filters,
    pagination: {
      page,
      pageSize: TASKS_PER_PAGE,
      total: totalTasks,
      totalPages,
    }
  };
};

export const actions = {
  createCategory: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name)
      return fail(400, { name, missing: true, message: "Category name is required" });

    await db.insert(categories).values({ name });

    return { success: true, message: "Category created" };
  },
  deleteCategory: async ({ request }) => {
    const data = await request.formData();
    const id = data.get("id") as string;
    if (!id)
      return fail(400, { id, missing: true, message: "Category id is required" });

    const tasksQuery = await db.select().from(tasks).limit(1).where(eq(tasks.categoryId, id));
    if (tasksQuery.length > 0)
      return fail(400, { id, message: "Remove tasks from this category before deleting it" });

    const notesQuery = await db.select().from(notes).limit(1).where(eq(notes.categoryId, id));
    if (notesQuery.length > 0)
      return fail(400, { id, message: "Remove notes from this category before deleting it" });

    await db.delete(categories).where(eq(categories.id, id));

    return { success: true, message: "Category deleted" };
  }
} satisfies Actions;
