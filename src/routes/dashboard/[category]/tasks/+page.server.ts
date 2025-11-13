import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks } from "$lib/server/db/schema";
import { and, asc, eq, sql, like, lt, or, isNull, count } from "drizzle-orm";
import dayjs from "$lib/dayjs";

const resolveCategory = async (categoryId: string) => {
  const [record] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const TASKS_PER_PAGE = 25;

type TaskFilters = { q?: string; onlyTodo?: boolean; interval?: number };

const buildTaskWhereClause = (categoryId: string, { q, onlyTodo, interval }: TaskFilters) =>
  and(
    eq(tasks.categoryId, categoryId),
    q ? like(tasks.name, `%${q}%`) : undefined,
    onlyTodo ? eq(tasks.status, false) : undefined,
    interval ? or(lt(tasks.due, new Date(Date.now() + (interval * 24 * 60 * 60 * 1000))), isNull(tasks.due)) : undefined,
  );

const loadTasks = async (
  categoryId: string,
  filters: TaskFilters,
  { limit, offset }: { limit: number; offset: number }
) => {
  const whereClause = buildTaskWhereClause(categoryId, filters);

  return db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due))
    .limit(limit)
    .offset(offset);
};

const countTasks = async (categoryId: string, filters: TaskFilters) => {
  const whereClause = buildTaskWhereClause(categoryId, filters);
  const [{ value }] = await db.select({ value: count() }).from(tasks).where(whereClause);
  return value ?? 0;
};

export const load: PageServerLoad = async ({ params, url }) => {
  const { id } = await resolveCategory(params.category);
  const q = url.searchParams.get("q") ?? ""
  const onlyTodo = url.searchParams.get("onlyTodo") === "true"
  const rawInterval = url.searchParams.get("interval")
  const parsedInterval = rawInterval ? Number(rawInterval) : undefined
  const interval =
    typeof parsedInterval === "number" && Number.isFinite(parsedInterval) && parsedInterval > 0
      ? parsedInterval
      : undefined
  const rawPage = url.searchParams.get("page")
  const parsedPage = rawPage ? Number(rawPage) : NaN
  let page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1

  const qParams = { q, onlyTodo, interval }
  const totalTasks = await countTasks(id, qParams)
  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE))
  if (page > totalPages)
    page = totalPages

  const offset = (page - 1) * TASKS_PER_PAGE
  const queryTasks = await loadTasks(id, qParams, { limit: TASKS_PER_PAGE, offset });

  return {
    tasks: queryTasks,
    filters: qParams,
    pagination: {
      page,
      pageSize: TASKS_PER_PAGE,
      total: totalTasks,
      totalPages,
    }
  };
};

export const actions = {
  createTask: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true });

    const dueInput = ((data.get("due") as string) ?? "").trim();
    const due = dueInput ? dayjs.utc(dueInput).toDate() : null;
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

    const dueInput = ((data.get("due") as string) ?? "").trim();
    const due = dueInput ? dayjs.utc(dueInput).toDate() : null;
    const content = (data.get("content") as string) ?? null;
    const status = data.get("status") ? true : false;

    await db.update(tasks).set({ name, due, content, status }).where(eq(tasks.id, id));

    return { success: true };
  }
} satisfies Actions;
