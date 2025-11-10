<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import MDInput from "$lib/components/MDInput.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const { notes } = $derived(data);
  type Note = (typeof data.notes)[number];

  const noteAccentPalette = ["bg-slate-900", "bg-slate-900"] as const;
  const notePreviewToggleId = "note-preview-toggle";

  let noteModalState: {
    isOpen: boolean;
    mode: "create" | "update";
    isPreview: boolean;
    fields: {
      id: string;
      name: string;
      content: string | null;
    };
  } = $state({
    isOpen: false,
    mode: "create",
    isPreview: false,
    fields: {
      id: "",
      name: "",
      content: "",
    },
  });

  async function deleteNote(id: string) {
    await fetch("/api/delete-note", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    invalidateAll();

    noteModalState.isOpen = false;
  }

  const noteActions = {
    create: "?/createNote",
    update: "?/updateNote",
  } as const;

  function openCreateNoteModal() {
    noteModalState.mode = "create";
    noteModalState.isPreview = false;
    noteModalState.fields.id = "";
    noteModalState.fields.name = "";
    noteModalState.fields.content = "";
    noteModalState.isOpen = true;
  }

  function openUpdateNoteModal(note: Note) {
    noteModalState.mode = "update";
    noteModalState.isPreview = true;
    noteModalState.fields.id = note.id;
    noteModalState.fields.name = note.name;
    noteModalState.fields.content = note.content;
    noteModalState.isOpen = true;
  }
</script>

<section class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 class="text-lg font-semibold text-white">Notes</h2>
      <p class="text-sm text-slate-500">Capture supporting details.</p>
    </div>
    <button
      onclick={openCreateNoteModal}
      type="button"
      class="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
    >
      Add Note
    </button>
  </div>

  {#if notes.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-800/80 px-4 py-6 text-center text-sm text-slate-500">
      No notes yet. Add context to your work.
    </div>
  {:else}
    <div class="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
      {#each notes as note, index}
        <button
          type="button"
          class={`w-full min-h-24 break-inside-avoid rounded-2xl border border-slate-800/70 ${noteAccentPalette[index % noteAccentPalette.length]} p-4 text-left shadow-[0_10px_30px_rgba(2,6,23,0.5)] transition hover:-translate-y-1 hover:border-slate-600`}
          onclick={() => openUpdateNoteModal(note)}
        >
          <span class="text-xs uppercase tracking-[0.35em] text-slate-500">Note</span>
          <h3 class="mb-3 mt-2 line-clamp-1 text-base font-semibold text-white">{note.name}</h3>
          <p class="text-sm text-slate-300" class:line-clamp-6={note.content?.length && note.content.length > 280}>
            {note.content}
          </p>
        </button>
      {/each}
    </div>
  {/if}
</section>

<Modal bind:isOpen={noteModalState.isOpen}>
  <form
    method="POST"
    action={noteActions[noteModalState.mode]}
    class="flex w-full max-w-2xl flex-col gap-5"
  >
    <input hidden type="text" name="id" value={noteModalState.fields.id} />
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">{noteModalState.mode} note</p>
      <h3 class="mt-2 text-2xl font-semibold text-white">
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
        class="rounded-2xl border border-slate-800/70 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
      />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <label
          for="content"
          class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
          >Content</label
        >
        <label
          for={notePreviewToggleId}
          class="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Preview
          <span class="relative inline-flex items-center">
            <input
              id={notePreviewToggleId}
              type="checkbox"
              bind:checked={noteModalState.isPreview}
              class="peer sr-only"
            />
            <span class="block h-5 w-9 rounded-full border border-slate-700 bg-slate-800 transition peer-checked:border-slate-200 peer-checked:bg-slate-200"></span>
            <span class="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></span>
          </span>
        </label>
      </div>
      <MDInput
        isPreview={noteModalState.isPreview}
        bind:value={noteModalState.fields.content}
        name="content"
        placeholder="Collect highlights, meeting notes, or brainstorms..."
        class="min-h-[30vh] h-[50vh] max-h-[70vh] rounded-2xl border border-slate-800/70 bg-slate-950 p-4 text-sm text-white placeholder:text-slate-600 focus:border-slate-500 focus:outline-none {noteModalState.isPreview ? 'overflow-y-scroll' : '' }"
      ></MDInput>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if noteModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300 hover:text-rose-100"
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
          class="rounded-2xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
        >
          {noteModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>
