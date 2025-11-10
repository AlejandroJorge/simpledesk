<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Modal from "$lib/components/Modal.svelte";
  import type { PageProps } from "./$types";
  import dayjs from "dayjs";

  let { data, params }: PageProps = $props();

  const { category } = $derived(params);
  const { tasks, notes } = $derived(data);

  let taskModalState: {
    isOpen: boolean;
    mode: "create" | "update";
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
    fields: {
      id: "",
      name: "",
      status: false,
      due: null,
      content: "",
    },
  });

  let noteModalState: {
    isOpen: boolean;
    mode: "create" | "update";
    fields: {
      id: string;
      name: string;
      content: string | null;
    };
  } = $state({
    isOpen: false,
    mode: "create",
    fields: {
      id: "",
      name: "",
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

  async function deleteNote(id: string) {
    await fetch("/api/delete-note", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    invalidateAll();

    noteModalState.isOpen = false;
  }

  const taskActions = {
    create: "?/createTask",
    update: "?/updateTask",
  } as const;

  const noteActions = {
    create: "?/createNote",
    update: "?/updateNote",
  } as const;
</script>

<section class="space-y-8">
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">Category</p>
      <h1 class="text-3xl font-semibold text-white">{category}</h1>
    </div>
    <div class="inline-flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/70 px-5 py-3 text-sm text-slate-300">
      <span>{tasks.length} tasks</span>
      <span class="text-slate-600">•</span>
      <span>{notes.length} notes</span>
    </div>
  </header>

  <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
    <section class="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-white">Tasks</h2>
          <p class="text-sm text-slate-500">Track progress and due dates.</p>
        </div>
        <button
          onclick={() => {
            taskModalState.mode = "create";

            taskModalState.fields.id = "";
            taskModalState.fields.name = "";
            taskModalState.fields.due = null;
            taskModalState.fields.status = false;
            taskModalState.fields.content = "";

            taskModalState.isOpen = true;
          }}
          type="button"
          class="rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:opacity-90"
        >
          Add Task
        </button>
      </div>

      <ul class="mt-6 space-y-3">
        {#if tasks.length === 0}
          <li class="rounded-2xl border border-dashed border-slate-800/80 px-4 py-6 text-center text-sm text-slate-500">
            No tasks yet. Add your first one.
          </li>
        {:else}
          {#each tasks as task}
            <li class="flex items-start gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-4">
              <input
                id={task.id}
                onchange={(e) => updateTaskStatus(task.id, e.target?.checked)}
                type="checkbox"
                checked={task.status}
                class="mt-1 size-5 rounded border-slate-700/70 bg-slate-900/80 accent-indigo-500"
              />
              <button
                class="flex-1 text-left"
                onclick={() => {
                  taskModalState.mode = "update";

                  taskModalState.fields.id = task.id;
                  taskModalState.fields.status = task.status;
                  taskModalState.fields.name = task.name;
                  taskModalState.fields.due = task.due;
                  taskModalState.fields.content = task.content;

                  taskModalState.isOpen = true;
                }}
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class={`text-base font-semibold text-white ${task.status ? "line-through text-slate-500" : ""}`}>
                      {task.name}
                    </p>
                    <p class="mt-1 line-clamp-2 text-sm text-slate-400">{task.content}</p>
                  </div>
                  <div class="text-right text-xs text-slate-500">
                    {#if task.due}
                      <p class="font-semibold text-slate-300">{dayjs(task.due).format("MMM D")} · {dayjs(task.due).format("YYYY")}</p>
                    {/if}
                    <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${task.status ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
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

    <section class="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-white">Notes</h2>
          <p class="text-sm text-slate-500">Capture supporting details.</p>
        </div>
        <button
          onclick={() => {
            noteModalState.mode = "create";

            noteModalState.fields.id = "";
            noteModalState.fields.name = "";
            noteModalState.fields.content = "";

            noteModalState.isOpen = true;
          }}
          type="button"
          class="rounded-2xl border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Add Note
        </button>
      </div>

      <ul class="mt-6 grid gap-4">
        {#if notes.length === 0}
          <li class="rounded-2xl border border-dashed border-slate-800/80 px-4 py-6 text-center text-sm text-slate-500">
            No notes yet. Add context to your work.
          </li>
        {:else}
          {#each notes as note}
            <li
              class="cursor-pointer rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 text-left transition hover:border-slate-600"
              onclick={() => {
                noteModalState.mode = "update";

                noteModalState.fields.id = note.id;
                noteModalState.fields.name = note.name;
                noteModalState.fields.content = note.content;

                noteModalState.isOpen = true;
              }}
            >
              <h4 class="mb-2 line-clamp-1 text-base font-semibold text-white">
                {note.name}
              </h4>
              <p class="line-clamp-4 text-sm text-slate-400">{note.content}</p>
            </li>
          {/each}
        {/if}
      </ul>
    </section>
  </div>
</section>

<Modal bind:isOpen={taskModalState.isOpen}>
  <form
    method="POST"
    action={taskActions[taskModalState.mode]}
    class="flex w-full max-w-2xl flex-col gap-5"
  >
    <input hidden type="text" name="id" value={taskModalState.fields.id} />
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">{taskModalState.mode} task</p>
      <h3 class="text-2xl font-semibold text-white mt-2">
        {taskModalState.mode === "create" ? "New task" : "Update task"}
      </h3>
    </div>
    <div class="grid gap-4 md:grid-cols-[auto,1fr]">
      <label class="flex items-center gap-3 rounded-2xl border border-slate-800/70 px-4 py-3 text-sm font-medium text-slate-200">
        <input
          bind:checked={taskModalState.fields.status}
          class="size-5 rounded border-slate-700/70 bg-slate-900 accent-indigo-500"
          name="status"
          type="checkbox"
        />
        Mark as complete
      </label>
      <div class="flex flex-col gap-2">
        <label for="name" class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Task name</label>
        <input
          bind:value={taskModalState.fields.name}
          name="name"
          type="text"
          required
          placeholder="Ship onboarding flow"
          class="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-2">
        <label for="due" class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Due date</label>
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
          class="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
    </div>
    <div class="flex w-full flex-col gap-2">
      <label for="content" class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Details</label>
      <textarea
        bind:value={taskModalState.fields.content}
        name="content"
        placeholder="Add context, links, or checklists..."
        class="min-h-32 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      ></textarea>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if taskModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300 hover:text-rose-200"
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
          class="rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40"
        >
          {taskModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>

<Modal bind:isOpen={noteModalState.isOpen}>
  <form
    method="POST"
    action={noteActions[noteModalState.mode]}
    class="flex w-full max-w-2xl flex-col gap-5"
  >
    <input hidden type="text" name="id" value={noteModalState.fields.id} />
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">{noteModalState.mode} note</p>
      <h3 class="text-2xl font-semibold text-white mt-2">
        {noteModalState.mode === "create" ? "New note" : "Update note"}
      </h3>
    </div>
    <div class="flex flex-col gap-2">
      <label for="name" class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Title</label>
      <input
        bind:value={noteModalState.fields.name}
        name="name"
        type="text"
        required
        placeholder="Retro talking points"
        class="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
    </div>
    <div class="flex w-full flex-col gap-2">
      <label for="content" class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Content</label>
      <textarea
        bind:value={noteModalState.fields.content}
        name="content"
        placeholder="Collect highlights, meeting notes, or brainstorms..."
        class="min-h-40 max-h-[50vh] rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      ></textarea>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if noteModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300 hover:text-rose-200"
          onclick={() => deleteNote(noteModalState.fields.id)}
        >
          Delete note
        </button>
      {/if}
      <div class="ml-auto flex gap-3">
        <button
          onclick={() => (noteModalState.isOpen = false)}
          type="button"
          class="rounded-2xl border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/40"
        >
          {noteModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>
