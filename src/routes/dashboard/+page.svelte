<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import TaskList from "$lib/components/TaskList.svelte";
  import type { PageProps } from "./$types";
  import dayjs from "$lib/dayjs";

  let { data }: PageProps = $props();

  type Task = (typeof data.tasks)[number];
  const tasks = $derived(data.tasks);
  const categories = $derived(data.categories);
  const pagination = $derived(data.pagination);
  const categoryLookup = $derived(Object.fromEntries(categories.map((category) => [category.id, category.name])));
  const filters = $state({
    searchQuery: data.filters?.q ?? "",
    showOnlyTodo: data.filters?.onlyTodo ?? false,
    intervalValue: data.filters?.interval ? String(data.filters.interval) : "",
  });

  let previewTask = $state<Task | null>(null);
  let isTaskPreviewOpen = $state(false);
  const previewCategoryName = $derived(
    previewTask ? categoryLookup[previewTask.categoryId] ?? "Unknown" : ""
  );
  const previewDue = $derived(
    previewTask?.due ? dayjs.utc(previewTask.due).format("dddd D MMM YYYY") : null
  );

  const intervalOptions = [
    { label: "Today", value: "1" },
    { label: "Next 3 days", value: "3" },
    { label: "Next week", value: "7" },
    { label: "Next 2 weeks", value: "14" },
    { label: "Next month", value: "30" },
  ] as const;

  function applyFiltersToUrl(url: URL) {
    if (filters.searchQuery) url.searchParams.set("q", filters.searchQuery);
    else url.searchParams.delete("q");

    if (filters.showOnlyTodo) url.searchParams.set("onlyTodo", "true");
    else url.searchParams.delete("onlyTodo");

    if (filters.intervalValue) url.searchParams.set("interval", filters.intervalValue);
    else url.searchParams.delete("interval");
  }

  async function reloadData() {
    const url = new URL(page.url);
    applyFiltersToUrl(url);
    url.searchParams.delete("page");
    await goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  async function changePage(nextPage: number) {
    if (!pagination)
      return;
    const clamped = Math.min(Math.max(1, nextPage), pagination.totalPages);
    if (clamped === pagination.page)
      return;
    const url = new URL(page.url);
    applyFiltersToUrl(url);
    url.searchParams.set("page", String(clamped));
    await goto(url.toString(), { keepFocus: true, noScroll: true });
  }

</script>

<section class="flex min-h-0 flex-col space-y-6">
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Global view</p>
      <h1 class="text-2xl font-semibold text-white flex items-center gap-3">
        All tasks
        <span class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {tasks.length}
        </span>
      </h1>
    </div>
    <p class="text-xs text-slate-500 uppercase tracking-[0.3em]">Read only · open any category to edit</p>
  </header>

  <form
    method="GET"
    class="grid gap-3 rounded-2xl border border-white/5 bg-[#080b14] p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]"
  >
    <label class="flex flex-col gap-2">
      <span class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Search</span>
      <input
        type="search"
        name="q"
        bind:value={filters.searchQuery}
        oninput={reloadData}
        placeholder="Find tasks"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
      />
    </label>

    <label class="flex flex-col gap-2">
      <span class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Status</span>
      <span class="flex items-center justify-between rounded-2xl border border-white/10 bg-[#05070f] px-4 py-2 text-sm font-semibold text-slate-200">
        Only open tasks
        <span class="relative inline-flex items-center">
          <input
            type="checkbox"
            name="onlyTodo"
            bind:checked={filters.showOnlyTodo}
            onchange={reloadData}
            class="peer sr-only"
          />
          <span class="block h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-white/80"></span>
          <span class="absolute left-1 top-1 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-[#05060c]"></span>
        </span>
      </span>
    </label>

    <label class="flex flex-col gap-2">
      <span class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Due within</span>
      <select
        name="interval"
        bind:value={filters.intervalValue}
        onchange={reloadData}
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-2.5 text-sm text-slate-100 focus:border-white/30 focus:outline-none"
      >
        <option value="">Any time</option>
        {#each intervalOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto pr-1">
      <TaskList
        tasks={tasks}
        readOnly
        showCategoryBadge
        categoryLookup={categoryLookup}
        emptyMessage="No tasks match these filters."
        onSelect={(task) => {
          previewTask = task;
          isTaskPreviewOpen = true;
        }}
      />
    </div>
    {#if pagination && pagination.totalPages > 1}
      <nav class="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#080b14] px-4 py-3 text-sm text-slate-300">
        <button
          type="button"
          class="inline-flex items-center rounded-xl border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition hover:border-white/30 disabled:opacity-50 disabled:hover:border-white/10"
          onclick={() => changePage(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Previous
        </button>
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">
          Page {pagination.page} of {pagination.totalPages} · {pagination.total} tasks
        </p>
        <button
          type="button"
          class="inline-flex items-center rounded-xl border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition hover:border-white/30 disabled:opacity-50 disabled:hover-border-white/10"
          onclick={() => changePage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
        </button>
      </nav>
    {/if}
  </div>

  <Modal bind:isOpen={isTaskPreviewOpen} onCloseRequest={() => {
    previewTask = null;
    isTaskPreviewOpen = false;
    return true;
  }}>
    {#if previewTask}
      <div class="flex flex-col gap-6">
        <div class="space-y-2">
          <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Task preview</p>
          <h3 class="text-2xl font-semibold text-white">{previewTask.name}</h3>
          <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span class="rounded-full border border-white/10 px-3 py-1">{previewCategoryName}</span>
            <span class="rounded-full border border-white/10 px-3 py-1">
              {previewTask.status ? "Completed" : "Open"}
            </span>
            {#if previewDue}
              <span class="rounded-full border border-white/10 px-3 py-1">{previewDue}</span>
            {/if}
          </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-[#05070f] p-4 text-sm text-slate-200 min-h-[8rem] whitespace-pre-wrap">
          {previewTask.content ?? "No details captured yet."}
        </div>
        <div class="flex justify-end gap-3">
          <a
            class="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/90 hover:border-white/40"
            href={`/dashboard/${previewTask.categoryId}/tasks`}
          >
            Open in category
          </a>
          <button
            type="button"
            class="rounded-xl bg-[var(--brand,#f1b24a)] px-5 py-2 text-sm font-semibold text-[#05060c]"
            onclick={() => {
              isTaskPreviewOpen = false;
              previewTask = null;
            }}
          >
            Close
          </button>
        </div>
      </div>
    {/if}
  </Modal>
</section>
