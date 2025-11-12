<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Modal from "$lib/components/Modal.svelte";
  import MDInput from "$lib/components/MDInput.svelte";
  import CheckToggle from "$lib/components/CheckToggle.svelte";
  import type { PageProps } from "./$types";
  import dayjs from "$lib/dayjs";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let { data }: PageProps = $props();

  const { tasks } = $derived(data);
  type Task = (typeof data.tasks)[number];
  const filters = $derived({
    searchQuery: data.filters?.q ?? "",
    showOnlyTodo: data.filters?.onlyTodo ?? false,
    intervalValue: data.filters?.interval ? String(data.filters.interval) : "",
  });

  const intervalOptions = [
    { label: "Today", value: "1" },
    { label: "Next 3 days", value: "3" },
    { label: "Next week", value: "7" },
    { label: "Next 2 weeks", value: "14" },
    { label: "Next month", value: "30" },
  ] as const;
  const previewToggleId = "task-preview-toggle";

  let taskModalState: {
    isOpen: boolean;
    mode: "create" | "update";
    isPreview: boolean;
    fields: {
      id: string;
      name: string;
      status: boolean;
      due: Date | null;
      content: string | null;
    };
  } = $state({
    isOpen: false,
    mode: "create",
    isPreview: false,
    fields: {
      id: "",
      name: "",
      status: false,
      due: null,
      content: "",
    },
  });

  async function updateTaskStatus(id: string, value: boolean) {
    await fetch("/api/update-task-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value }),
    });

    invalidateAll();
  }

  async function deleteTask(id: string) {
    await fetch("/api/delete-task", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    invalidateAll();

    taskModalState.isOpen = false;
  }

  async function reloadData() {
    const url = new URL(page.url);
    if (filters.searchQuery) url.searchParams.set("q", filters.searchQuery);
    else url.searchParams.delete("q");

    if (filters.showOnlyTodo) url.searchParams.set("onlyTodo", "true");
    else url.searchParams.delete("onlyTodo");

    if (filters.intervalValue)
      url.searchParams.set("interval", filters.intervalValue);
    else url.searchParams.delete("interval");
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  const taskActions = {
    create: "?/createTask",
    update: "?/updateTask",
  } as const;

  function openCreateTaskModal() {
    taskModalState.mode = "create";
    taskModalState.isPreview = false;
    taskModalState.fields.id = "";
    taskModalState.fields.name = "";
    taskModalState.fields.due = new Date();
    taskModalState.fields.status = false;
    taskModalState.fields.content = "";
    taskModalState.isOpen = true;
  }

  function openUpdateTaskModal(task: Task) {
    taskModalState.mode = "update";
    taskModalState.isPreview = true;
    taskModalState.fields.id = task.id;
    taskModalState.fields.status = task.status;
    taskModalState.fields.name = task.name;
    taskModalState.fields.due = task.due;
    taskModalState.fields.content = task.content;
    taskModalState.isOpen = true;
  }
</script>

<section class="space-y-6">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3 text-sm text-slate-500">
      <h2 class="text-xl font-semibold text-white tracking-tight">Tasks</h2>
      <span class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em]">
        {tasks.length}
      </span>
    </div>
    <button
      onclick={openCreateTaskModal}
      type="button"
      class="rounded-xl bg-[var(--brand,#f1b24a)] px-4 py-2 text-sm font-semibold text-[#05060c] transition hover:brightness-110 cursor-pointer"
    >
      New Task
    </button>
  </header>

  <form
    method="GET"
    class="grid gap-3 rounded-2xl border border-white/5 bg-[#080b14] p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]"
  >
    <label class="flex flex-col gap-2">
      <span
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Search</span
      >
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
      <span
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Status</span
      >
      <span
        class="flex items-center justify-between rounded-2xl border border-white/10 bg-[#05070f] px-4 py-2 text-sm font-semibold text-slate-200"
      >
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
      <span
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Due within</span
      >
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

  <ul class="space-y-2.5">
    {#if tasks.length === 0}
      <li
        class="rounded-2xl border border-dashed border-white/10 bg-[#080b14]/60 px-4 py-6 text-center text-sm text-slate-500"
      >
        No tasks yet. Add your first one.
      </li>
    {:else}
      {#each tasks as task}
        <li
          class="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#0b0f1c] px-4 py-4"
        >
          <div class="mt-1">
            <CheckToggle
              checked={task.status}
              label={`Mark ${task.name} as ${task.status ? "pending" : "done"}`}
              onchange={(event) => updateTaskStatus(task.id, event.checked)}
            />
          </div>
          <button
            class="flex-1 cursor-pointer text-left"
            onclick={() => openUpdateTaskModal(task)}
          >
            <div class="flex items-start gap-4">
              <div class="flex-1 min-w-0">
                <p
                  class={`text-base font-semibold text-slate-100 ${task.status ? "line-through text-slate-500" : ""}`}
                >
                  {task.name}
                </p>
                <p class="mt-1 line-clamp-2 text-sm text-slate-500">
                  {task.content}
                </p>
              </div>
              {#if task.due}
                <p class="ml-auto text-right text-xs font-semibold text-slate-300 whitespace-nowrap">
                  {dayjs.utc(task.due).format("dddd D, MMM YYYY")}
                </p>
              {/if}
            </div>
          </button>
        </li>
      {/each}
    {/if}
  </ul>
</section>

<Modal bind:isOpen={taskModalState.isOpen}>
  <form
    method="POST"
    action={taskActions[taskModalState.mode]}
    class="flex w-full max-w-2xl flex-col gap-5"
  >
    <input hidden type="text" name="id" value={taskModalState.fields.id} />
    <div>
      <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">
        {taskModalState.mode} task
      </p>
      <h3 class="mt-2 text-2xl font-semibold text-white">
        {taskModalState.mode === "create" ? "New task" : "Update task"}
      </h3>
    </div>
  <div class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    <div class="flex flex-col gap-2">
      <label
        for="name"
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Task name</label
      >
      <input
        bind:value={taskModalState.fields.name}
        name="name"
        type="text"
        required
        placeholder="Ship onboarding flow"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
      />
    </div>
    <div class="flex flex-col gap-2">
      <label
        for="due"
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Due date</label
      >
      <input
        bind:value={
          () =>
            taskModalState.fields.due
              ? dayjs.utc(taskModalState.fields.due).format("YYYY-MM-DD")
              : "",
          (v) =>
            (taskModalState.fields.due = v
              ? dayjs.utc(v, "YYYY-MM-DD").toDate()
              : null)
        }
        name="due"
        type="date"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
      />
    </div>
  </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <label
          for="content"
          class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
          >Details</label
        >
        <label
          for={previewToggleId}
          class="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0f1c] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Preview
          <span class="relative inline-flex items-center">
            <input
              id={previewToggleId}
              type="checkbox"
              bind:checked={taskModalState.isPreview}
              class="peer sr-only"
            />
            <span class="block h-5 w-9 rounded-full border border-white/10 bg-white/10 transition peer-checked:border-white/60 peer-checked:bg-white/80"></span>
            <span class="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4 peer-checked:bg-[#05060c]"></span>
          </span>
        </label>
      </div>
      <MDInput
        isPreview={taskModalState.isPreview}
        bind:value={taskModalState.fields.content}
        name="content"
        placeholder="Add context, links, or checklists..."
        class="min-h-[30vh] h-[50vh] max-h-[70vh] rounded-2xl border border-white/10 bg-[#05070f] p-4 text-sm text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none {taskModalState.isPreview ? 'overflow-y-scroll' : ''}"
      ></MDInput>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if taskModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300/80 hover:text-rose-100 cursor-pointer"
          onclick={() => deleteTask(taskModalState.fields.id)}
        >
          Delete task
        </button>
      {/if}
      <div class="ml-auto flex gap-3">
        <button
          onclick={() => (taskModalState.isOpen = false)}
          type="button"
          class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-2xl bg-[var(--brand,#f1b24a)] px-5 py-2 text-sm font-semibold text-[#05060c] transition hover:brightness-110 cursor-pointer"
        >
          {taskModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>
