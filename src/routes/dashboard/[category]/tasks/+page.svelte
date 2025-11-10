<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Modal from "$lib/components/Modal.svelte";
  import MDInput from "$lib/components/MDInput.svelte";
  import CheckToggle from "$lib/components/CheckToggle.svelte";
  import type { PageProps } from "./$types";
  import dayjs from "dayjs";
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
    taskModalState.fields.due = null;
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
  <div class="flex items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-semibold text-white">Tasks</h2>
      <p class="text-sm text-slate-500">Track progress and due dates.</p>
    </div>
    <button
      onclick={openCreateTaskModal}
      type="button"
      class="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
    >
      Add Task
    </button>
  </div>

  <form
    method="GET"
    class="grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-900 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]"
  >
    <label class="flex flex-col gap-2">
      <span
        class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Search</span
      >
      <input
        type="search"
        name="q"
        bind:value={filters.searchQuery}
        oninput={reloadData}
        placeholder="Find tasks"
        class="rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
      />
    </label>

    <label class="flex flex-col gap-2">
      <span
        class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Status</span
      >
      <span
        class="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200"
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
          <span
            class="block h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-slate-100"
          ></span>
          <span
            class="absolute left-1 top-1 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"
          ></span>
        </span>
      </span>
    </label>

    <label class="flex flex-col gap-2">
      <span
        class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Due within</span
      >
      <select
        name="interval"
        bind:value={filters.intervalValue}
        onchange={reloadData}
        class="rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
      >
        <option value="">Any time</option>
        {#each intervalOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>
  </form>

  <ul class="space-y-3">
    {#if tasks.length === 0}
      <li
        class="rounded-2xl border border-dashed border-slate-800/80 px-4 py-6 text-center text-sm text-slate-500"
      >
        No tasks yet. Add your first one.
      </li>
    {:else}
      {#each tasks as task}
        <li
          class="flex items-start gap-4 rounded-2xl border border-slate-800/70 bg-slate-900 px-4 py-4"
        >
          <div class="mt-1">
            <CheckToggle
              checked={task.status}
              label={`Mark ${task.name} as ${task.status ? "pending" : "done"}`}
              onchange={(event) => updateTaskStatus(task.id, event.checked)}
            />
          </div>
          <button
            class="flex-1 text-left"
            onclick={() => openUpdateTaskModal(task)}
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class={`text-base font-semibold text-slate-100 ${task.status ? "line-through text-slate-500" : ""}`}
                >
                  {task.name}
                </p>
                <p class="mt-1 line-clamp-2 text-sm text-slate-400">
                  {task.content}
                </p>
              </div>
              <div class="text-right text-xs text-slate-500">
                {#if task.due}
                  <p class="font-semibold text-slate-300">
                    {dayjs(task.due).format("MMM D")}
                  </p>
                  <p>{dayjs(task.due).format("YYYY")}</p>
                {/if}
                <span
                  class={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${task.status ? "border-emerald-400/60 text-emerald-300" : "border-slate-700 text-slate-300"}`}
                >
                  {task.status ? "Done" : "Pending"}
                </span>
              </div>
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
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">
        {taskModalState.mode} task
      </p>
      <h3 class="mt-2 text-2xl font-semibold text-white">
        {taskModalState.mode === "create" ? "New task" : "Update task"}
      </h3>
    </div>
    <div class="grid gap-4 md:grid-cols-[auto,1fr]">
      <div class="flex flex-col gap-2">
        <label
          for="name"
          class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
          >Task name</label
        >
        <input
          bind:value={taskModalState.fields.name}
          name="name"
          type="text"
          required
          placeholder="Ship onboarding flow"
          class="rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
        />
      </div>
    </div>
    <div class="flex w-full flex-col gap-2">
      <label
        for="due"
        class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
        >Due date</label
      >
      <input
        bind:value={
          () =>
            taskModalState.fields.due
              ? dayjs(taskModalState.fields.due).format("YYYY-MM-DD")
              : "",
          (v) =>
            (taskModalState.fields.due = v
              ? dayjs(v, "YYYY-MM-DD").toDate()
              : null)
        }
        name="due"
        type="date"
        class="rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-3 text-sm text-white focus:border-slate-500 focus:outline-none"
      />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <label
          for="content"
          class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
          >Details</label
        >
        <label
          for={previewToggleId}
          class="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Preview
          <span class="relative inline-flex items-center">
            <input
              id={previewToggleId}
              type="checkbox"
              bind:checked={taskModalState.isPreview}
              class="peer sr-only"
            />
            <span class="block h-5 w-9 rounded-full border border-slate-700 bg-slate-800 transition peer-checked:border-slate-200 peer-checked:bg-slate-200"></span>
            <span class="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></span>
          </span>
        </label>
      </div>
      <MDInput
        isPreview={taskModalState.isPreview}
        bind:value={taskModalState.fields.content}
        name="content"
        placeholder="Add context, links, or checklists..."
        class="min-h-[30vh] h-[50vh] max-h-[70vh] rounded-2xl border border-slate-800/70 bg-slate-950 p-4 text-sm text-white placeholder:text-slate-600 focus:border-slate-500 focus:outline-none {taskModalState.isPreview ? 'overflow-y-scroll' : ''}"
      ></MDInput>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if taskModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300 hover:text-rose-100"
          onclick={() => deleteTask(taskModalState.fields.id)}
        >
          Delete task
        </button>
      {/if}
      <div class="ml-auto flex gap-3">
        <button
          onclick={() => (taskModalState.isOpen = false)}
          type="button"
          class="rounded-2xl border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-2xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
        >
          {taskModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>
