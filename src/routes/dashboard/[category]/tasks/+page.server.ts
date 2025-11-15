import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { categories, tasks } from "$lib/server/db/schema";
import { and, asc, eq, sql, like, lt, or, isNull, count } from "drizzle-orm";
import dayjs from "$lib/dayjs";
import { normalizeRecurrence } from "$lib/tasks/recurrence";
import { getRuntimeEnv } from "$lib/server/config";

const resolveCategory = async (userId: string, categoryId: string) => {
  const [record] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!record) error(404, "Category not found");
  return record;
};

const TASKS_PER_PAGE = 25;

type TaskFilters = { q?: string; onlyTodo?: boolean; interval?: number };

const workspaceTimezone = getRuntimeEnv().workspaceTimezone;

const buildTaskWhereClause = (userId: string, categoryId: string, { q, onlyTodo, interval }: TaskFilters) =>
  and(
    eq(tasks.userId, userId),
    eq(tasks.categoryId, categoryId),
    q ? like(tasks.name, `%${q}%`) : undefined,
    onlyTodo ? eq(tasks.status, false) : undefined,
    interval
      ? or(lt(tasks.due, dayjs().tz(workspaceTimezone).add(interval, "day").toDate()), isNull(tasks.due))
      : undefined,
  );

const loadTasks = async (
  userId: string,
  categoryId: string,
  filters: TaskFilters,
  { limit, offset }: { limit: number; offset: number }
) => {
  const whereClause = buildTaskWhereClause(userId, categoryId, filters);

  return db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.status), sql`CASE WHEN ${tasks.due} IS NULL THEN 1 ELSE 0 END`, asc(tasks.due))
    .limit(limit)
    .offset(offset);
};

const countTasks = async (userId: string, categoryId: string, filters: TaskFilters) => {
  const whereClause = buildTaskWhereClause(userId, categoryId, filters);
  const [{ value }] = await db.select({ value: count() }).from(tasks).where(whereClause);
  return value ?? 0;
};

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const userId = locals.user?.id;
  if (!userId)
    throw error(401, "Unauthorized");

  const { id } = await resolveCategory(userId, params.category);
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
  const totalTasks = await countTasks(userId, id, qParams)
  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE))
  if (page > totalPages)
    page = totalPages

  const offset = (page - 1) * TASKS_PER_PAGE
  const queryTasks = await loadTasks(userId, id, qParams, { limit: TASKS_PER_PAGE, offset });

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
  createTask: async ({ request, params, locals }) => {
    const userId = locals.user?.id;
    if (!userId)
      return fail(401, { message: "Unauthorized" });
    const data = await request.formData();
    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true, message: "Task name is required" });

    const dueInput = ((data.get("due") as string) ?? "").trim();
    const due = dueInput ? dayjs.utc(dueInput).toDate() : null;
    const content = (data.get("content") as string) ?? null;
    const status = data.get("status") ? true : false;
    const recurrenceInput = (data.get("recurrence") as string | null)?.trim() ?? null;
    const recurrence = normalizeRecurrence(recurrenceInput);
    if (recurrence && !due)
      return fail(400, { message: "Recurring tasks require a due date" });

    const { id: categoryId } = await resolveCategory(userId, params.category);

    try {
      await db.insert(tasks).values({ name, due, content, categoryId, status, recurrence, userId });
    } catch (err) {
      console.error("[tasks] createTask", err);
      return fail(500, { message: "Unable to create task" });
    }

    return { success: true };
  },
  updateTask: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId)
      return fail(401, { message: "Unauthorized" });
    const data = await request.formData();

    const id = data.get("id") as string;
    if (!id) return fail(400, { id, missing: true, message: "Task id is required" });

    const name = data.get("name") as string;
    if (!name) return fail(400, { name, missing: true, message: "Task name is required" });

    const dueInput = ((data.get("due") as string) ?? "").trim();
    const due = dueInput ? dayjs.utc(dueInput).toDate() : null;
    const content = (data.get("content") as string) ?? null;
    const status = data.get("status") ? true : false;
    const recurrenceInput = (data.get("recurrence") as string | null)?.trim() ?? null;
    const recurrence = normalizeRecurrence(recurrenceInput);
    if (recurrence && !due)
      return fail(400, { message: "Recurring tasks require a due date" });

    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!existingTask)
      return fail(404, { message: "Task not found" });

    try {
      await db
        .update(tasks)
        .set({ name, due, content, status, recurrence })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    } catch (err) {
      console.error("[tasks] updateTask", err);
      return fail(500, { message: "Unable to update task" });
    }

    return { success: true };
  }
} satisfies Actions;
