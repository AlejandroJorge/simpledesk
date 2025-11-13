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
  };

  let {
    tasks,
    readOnly = false,
    showCategoryBadge = false,
    categoryLookup = {},
    emptyMessage = "No tasks yet.",
    onToggle,
    onSelect,
  }: {
    tasks: Task[];
    readOnly?: boolean;
    showCategoryBadge?: boolean;
    categoryLookup?: Record<string, string>;
    emptyMessage?: string;
    onToggle?: (task: Task, nextValue: boolean) => void | Promise<void>;
    onSelect?: (task: Task) => void | Promise<void>;
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
      <li class="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#0b0f1c] px-4 py-4">
        <div class="mt-1">
          <CheckToggle
            checked={task.status}
            disabled={readOnly || !onToggle}
            label={`Mark ${task.name} as ${task.status ? "pending" : "done"}`}
            onchange={() => handleToggle(task)}
          />
        </div>
        <div class="flex-1 min-w-0">
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
              {#if showCategoryBadge && task.categoryId}
                <a
                  class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:text-white hover:border-white/30"
                  href={`/dashboard/${task.categoryId}/tasks`}
                >
                  {categoryLookup[task.categoryId] ?? "View space"}
                </a>
              {/if}
              {#if formatDue(task.due)}
                <span class="ml-auto text-xs font-semibold text-slate-300 whitespace-nowrap">
                  {formatDue(task.due)}
                </span>
              {/if}
            </div>
            <p class="line-clamp-2 text-sm text-slate-400">
              {task.content ?? "No details captured yet."}
            </p>
          </button>
        </div>
      </li>
    {/each}
  {/if}
</ul>
