<script lang="ts">
  import dayjs from "$lib/dayjs";
  import CheckToggle from "$lib/components/CheckToggle.svelte";

  type Task = {
    id: string;
    name: string;
    content: string | null;
    status: boolean;
    due: Date | null;
    categoryId: string;
    recurrence: "daily" | "workday" | null;
  };

  let {
    tasks,
    readOnly = false,
    showCategoryBadge = false,
    categoryLookup = {},
    emptyMessage = "No tasks yet.",
    onToggle,
    onSelect,
    onReschedule,
  }: {
    tasks: Task[];
    readOnly?: boolean;
    showCategoryBadge?: boolean;
    categoryLookup?: Record<string, string>;
    emptyMessage?: string;
    onToggle?: (task: Task, nextValue: boolean) => void | Promise<void>;
    onSelect?: (task: Task) => void | Promise<void>;
    onReschedule?: (task: Task) => void | Promise<void>;
  } = $props();

  function hasDueTime(due: Task["due"]) {
    if (!due)
      return false;
    const parsed = dayjs.utc(due);
    return parsed.hour() !== 0 || parsed.minute() !== 0;
  }

  function formatDue(due: Task["due"]) {
    if (!due)
      return null;
    const parsed = dayjs.utc(due);
    const dateLabel = parsed.format("dddd D, MMM YYYY");
    return hasDueTime(due) ? `${dateLabel} · ${parsed.format("HH:mm")}` : dateLabel;
  }

  function isOverdue(task: Task) {
    if (!task.due || task.status)
      return false;
    return dayjs.utc(task.due).isBefore(dayjs.utc());
  }

  function isRecurring(task: Task) {
    return task.recurrence === "daily" || task.recurrence === "workday";
  }

  function recurrenceLabel(task: Task) {
    if (task.recurrence === "daily") return "Repeats daily";
    if (task.recurrence === "workday") return "Repeats on weekdays";
    return null;
  }

  function handleReschedule(task: Task) {
    if (!onReschedule)
      return;
    onReschedule(task);
  }

  function handleToggle(task: Task) {
    if (readOnly || !onToggle)
      return;
    const nextValue = !task.status;
    void onToggle(task, nextValue);
  }

  function handleSelect(task: Task) {
    if (!onSelect)
      return;
    onSelect(task);
  }
</script>

<ul class="space-y-2.5">
  {#if tasks.length === 0}
    <li
      class="rounded-2xl border border-dashed border-white/10 bg-[#080b14]/60 px-4 py-6 text-center text-sm text-slate-500"
    >
      {emptyMessage}
    </li>
  {:else}
    {#each tasks as task}
      <li
        class={`flex items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${
          isOverdue(task)
            ? "border-rose-500/50 bg-[#1a0c12]"
            : "border-white/5 bg-[#0b0f1c]"
        }`}
      >
        <div class="mt-1">
          <CheckToggle
            checked={task.status}
            disabled={readOnly || !onToggle}
            label={`Mark ${task.name} as ${task.status ? "pending" : "done"}`}
            onchange={() => handleToggle(task)}
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex w-full flex-col gap-2">
            <button
              type="button"
              class="flex w-full cursor-pointer flex-col gap-1 text-left"
              onclick={() => handleSelect(task)}
              disabled={!onSelect}
            >
            <div class="flex flex-wrap items-center gap-2">
              <p class={`text-base font-semibold ${task.status ? "line-through text-slate-500" : "text-slate-100"}`}>
                {task.name}
              </p>
              {#if isRecurring(task)}
                <span class="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-slate-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M10 4v3.5h3" />
                    <path d="M5 5a7 7 0 1 1-2 5" />
                  </svg>
                  <span class="whitespace-nowrap text-[0.65rem] tracking-[0.2em]">
                    {task.recurrence === "daily" ? "Daily" : "Weekdays"}
                  </span>
                </span>
              {/if}
              {#if showCategoryBadge && task.categoryId}
                <a
                  class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:text-white hover:border-white/30"
                  href={`/dashboard/${task.categoryId}/tasks`}
                >
                  {categoryLookup[task.categoryId] ?? "View space"}
                </a>
              {/if}
              <div class="ml-auto flex flex-col items-end gap-1 text-xs font-semibold whitespace-nowrap">
                {#if formatDue(task.due)}
                  <span class="text-slate-300">{formatDue(task.due)}</span>
                {/if}
                {#if isOverdue(task)}
                  <span class="text-rose-300">Past due</span>
                {/if}
              </div>
            </div>
            <p class="line-clamp-2 text-sm text-slate-400">
              {task.content ?? "No details captured yet."}
            </p>
            {#if recurrenceLabel(task) || isOverdue(task)}
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                {#if recurrenceLabel(task)}
                  <span class="text-slate-400">{recurrenceLabel(task)}</span>
                {/if}
                {#if isOverdue(task)}
                  <span class="text-rose-200">Wrap this up—its due date has already passed.</span>
                {/if}
              </div>
            {/if}
            </button>
            {#if onReschedule && isOverdue(task) && isRecurring(task)}
              <button
                type="button"
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/30"
                onclick={() => handleReschedule(task)}
              >
                Reschedule
              </button>
            {/if}
          </div>
        </div>
      </li>
    {/each}
  {/if}
</ul>
