import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks, notes } from "$lib/server/db/schema";
import { and, asc, eq, or, isNull, like, lt, sql, count } from "drizzle-orm";
import { getRuntimeEnv } from "$lib/server/config";
import dayjs from "$lib/dayjs";

const TASKS_PER_PAGE = 10;

type TaskFilters = { q?: string; onlyTodo?: boolean; interval?: number };

const workspaceTimezone = getRuntimeEnv().workspaceTimezone;

const buildTaskWhereClause = (userId: string, { q, onlyTodo, interval }: TaskFilters) =>
  and(
    eq(tasks.userId, userId),
    q ? like(tasks.name, `%${q}%`) : undefined,
    onlyTodo ? eq(tasks.status, false) : undefined,
    interval
      ? or(lt(tasks.due, dayjs().tz(workspaceTimezone).add(interval, "day").toDate()), isNull(tasks.due))
      : undefined
  );

const loadTasks = async (
  userId: string,
  filters: TaskFilters,
  { limit, offset }: { limit: number; offset: number }
) => {
  const whereClause = buildTaskWhereClause(userId, filters);

  return db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due))
    .limit(limit)
    .offset(offset);
};

const countTasks = async (userId: string, filters: TaskFilters) => {
  const whereClause = buildTaskWhereClause(userId, filters);
  const [{ value }] = await db.select({ value: count() }).from(tasks).where(whereClause);
  return value ?? 0;
};

export const load: PageServerLoad = async ({ url, locals }) => {
  const userId = locals.user?.id;
  if (!userId)
    throw error(401, "Unauthorized");

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
    countTasks(userId, filters),
    db.select().from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.name))
  ]);

  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE));
  if (page > totalPages)
    page = totalPages;
  const offset = (page - 1) * TASKS_PER_PAGE;

  const queryTasks = await loadTasks(userId, filters, { limit: TASKS_PER_PAGE, offset });

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
  createCategory: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId)
      return fail(401, { message: "Unauthorized" });

    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name)
      return fail(400, { name, missing: true, message: "Category name is required" });

    try {
      await db.insert(categories).values({ name, userId });
    } catch (err) {
      console.error("[categories] createCategory", err);
      return fail(500, { message: "Unable to create category" });
    }

    return { success: true, message: "Category created" };
  },
  deleteCategory: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId)
      return fail(401, { message: "Unauthorized" });

    const data = await request.formData();
    const id = data.get("id") as string;
    if (!id)
      return fail(400, { id, missing: true, message: "Category id is required" });

    try {
      const [categoryRecord] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .limit(1);
      if (!categoryRecord)
        return fail(404, { message: "Category not found" });

      const tasksQuery = await db
        .select()
        .from(tasks)
        .limit(1)
        .where(and(eq(tasks.categoryId, id), eq(tasks.userId, userId)));
      if (tasksQuery.length > 0)
        return fail(400, { id, message: "Remove tasks from this category before deleting it" });

      const notesQuery = await db
        .select()
        .from(notes)
        .limit(1)
        .where(and(eq(notes.categoryId, id), eq(notes.userId, userId)));
      if (notesQuery.length > 0)
        return fail(400, { id, message: "Remove notes from this category before deleting it" });

      await db.delete(categories).where(eq(categories.id, categoryRecord.id));
    } catch (err) {
      console.error("[categories] deleteCategory", err);
      return fail(500, { message: "Unable to delete category" });
    }

    return { success: true, message: "Category deleted" };
  }
} satisfies Actions;
