<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll, goto } from "$app/navigation";
  import MDInput from "$lib/components/MDInput.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { fetchWithErrorToast, createErrorToastEnhancer } from "$lib/utils/toast-errors";
  import type { PageProps } from "./$types";
  import { page } from "$app/state";

  let { data }: PageProps = $props();
  const { notes } = $derived(data);
  type Note = (typeof data.notes)[number];
  const filters = $state({
    searchQuery: data.filters?.q ?? "",
  });

  let orderedNotes = $state<Note[]>([]);
  let dragState = $state<{ id: string | null; fromIndex: number }>({ id: null, fromIndex: -1 });
  let isDragging = $state(false);
  let lastPersistedOrder: string[] = [];
  let noteInitialContent = $state("");
  let noteDiscardModalOpen = $state(false);

  $effect(() => {
    orderedNotes = [...notes];
    lastPersistedOrder = notes.map((note) => note.id);
    filters.searchQuery = data.filters?.q ?? "";
  });

  function applyFiltersToUrl(url: URL) {
    if (filters.searchQuery)
      url.searchParams.set("q", filters.searchQuery);
    else
      url.searchParams.delete("q");
  }

  async function reloadData() {
    const url = new URL(page.url);
    applyFiltersToUrl(url);
    await goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  const noteAccentPalette = ["bg-[#101425]", "bg-[#0d1320]"] as const;
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
    const response = await fetchWithErrorToast(
      "/api/delete-note",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      },
      "Unable to delete note"
    );

    if (!response)
      return;

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
    noteInitialContent = "";
  }

  function openUpdateNoteModal(note: Note) {
    noteModalState.mode = "update";
    noteModalState.isPreview = true;
    noteModalState.fields.id = note.id;
    noteModalState.fields.name = note.name;
    noteModalState.fields.content = note.content;
    noteModalState.isOpen = true;
    noteInitialContent = note.content ?? "";
  }

  function handleDragStart(noteId: string) {
    dragState.id = noteId;
    dragState.fromIndex = orderedNotes.findIndex((note) => note.id === noteId);
    isDragging = true;
  }

  function handleDragOver(event: DragEvent, targetId: string) {
    event.preventDefault();
    if (!dragState.id || dragState.id === targetId) return;
    const nextOrder = reorderWithinList(dragState.id, targetId);
    if (nextOrder)
      orderedNotes = nextOrder;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
  }

  function handleDragEnd() {
    if (!dragState.id) {
      resetDragState();
      return;
    }

    const movedNoteId = dragState.id;
    const positionMovedTo = orderedNotes.findIndex((note) => note.id === movedNoteId);
    const positionMovedFrom = lastPersistedOrder.indexOf(movedNoteId);

    resetDragState();

    if (positionMovedFrom === -1 || positionMovedTo === -1 || positionMovedFrom === positionMovedTo)
      return;

    void persistMove(movedNoteId, positionMovedFrom, positionMovedTo);
  }

  function resetDragState() {
    dragState = { id: null, fromIndex: -1 };
    isDragging = false;
  }

  async function persistMove(movedNoteId: string, positionMovedFrom: number, positionMovedTo: number) {
    const response = await fetchWithErrorToast(
      "/api/reorder-notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movedNoteId, positionMovedFrom, positionMovedTo }),
      },
      "Unable to reorder notes"
    );

    if (!response) {
      orderedNotes = [...notes];
      return;
    }

    lastPersistedOrder = applyMove(lastPersistedOrder, positionMovedFrom, positionMovedTo);
    invalidateAll();
  }

  function applyMove(order: string[], fromIndex: number, newIndex: number) {
    const updated = [...order];
    if (fromIndex < 0 || fromIndex >= updated.length) return updated;
    const [movedId] = updated.splice(fromIndex, 1);
    updated.splice(newIndex, 0, movedId);
    return updated;
  }

  function reorderWithinList(sourceId: string, targetId: string) {
    const updated = [...orderedNotes];
    const fromIndex = updated.findIndex((note) => note.id === sourceId);
    const toIndex = updated.findIndex((note) => note.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return null;
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  }

  function handleNoteClick(note: Note) {
    if (isDragging) return;
    openUpdateNoteModal(note);
  }

  function hasNoteContentChanges() {
    return (noteModalState.fields.content ?? "") !== noteInitialContent;
  }

  function handleNoteModalCloseRequest() {
    if (hasNoteContentChanges()) {
      noteDiscardModalOpen = true;
      return false;
    }
    return true;
  }

  function onNoteCancel() {
    if (handleNoteModalCloseRequest())
      noteModalState.isOpen = false;
  }

  function keepEditingNote() {
    noteDiscardModalOpen = false;
  }

  function discardNoteChanges() {
    noteDiscardModalOpen = false;
    noteModalState.isOpen = false;
    noteModalState.fields.content = noteInitialContent;
  }

  const handleNoteFormResult = createErrorToastEnhancer({
    onSuccess: () => {
      noteModalState.isOpen = false;
      noteDiscardModalOpen = false;
    }
  });
</script>

<section class="flex min-h-0 flex-col space-y-6">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3 text-sm text-slate-500">
      <h2 class="text-xl font-semibold text-white tracking-tight">Notes</h2>
      <span class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em]">
        {notes.length}
      </span>
    </div>
    <button
      onclick={openCreateNoteModal}
      type="button"
      class="rounded-xl bg-[var(--brand,#f1b24a)] px-4 py-2 text-sm font-semibold text-[#05060c] transition hover:brightness-110 cursor-pointer"
    >
      New Note
    </button>
  </header>

  <form
    method="GET"
    class="rounded-2xl border border-white/5 bg-[#080b14] p-4"
  >
    <label class="flex flex-col gap-2">
      <span class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Search
      </span>
      <input
        type="search"
        name="q"
        bind:value={filters.searchQuery}
        oninput={reloadData}
        placeholder="Find notes by title"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
      />
    </label>
  </form>

  {#if notes.length === 0}
    <div class="rounded-2xl border border-dashed border-white/10 bg-[#080b14]/60 px-4 py-6 text-center text-sm text-slate-500">
      No notes yet. Add context to your work.
    </div>
  {:else}
    <div class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div class="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
        {#each orderedNotes as note, index (note.id)}
          <button
            type="button"
            class={`w-full min-h-24 break-inside-avoid cursor-pointer rounded-2xl border border-white/5 ${noteAccentPalette[index % noteAccentPalette.length]} p-4 text-left shadow-[0_25px_60px_rgba(3,4,12,0.55)] transition hover:-translate-y-1 hover:border-white/20 ${
              dragState.id === note.id ? "opacity-60" : ""
            }`}
            draggable="true"
            aria-grabbed={dragState.id === note.id}
            ondragstart={() => handleDragStart(note.id)}
            ondragover={(event) => handleDragOver(event, note.id)}
            ondrop={handleDrop}
            ondragend={handleDragEnd}
            onclick={() => handleNoteClick(note)}
          >
            <span class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Note</span>
            <h3 class="mb-2 mt-2 line-clamp-1 text-base font-semibold text-white">{note.name}</h3>
            <p class="text-sm text-slate-300" class:line-clamp-6={note.content?.length && note.content.length > 280}>
              {note.content}
            </p>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</section>

<Modal bind:isOpen={noteModalState.isOpen} onCloseRequest={handleNoteModalCloseRequest}>
  <form
    method="POST"
    action={noteActions[noteModalState.mode]}
    class="flex w-full max-w-2xl flex-col gap-5"
    use:enhance={handleNoteFormResult}
  >
    <input hidden type="text" name="id" value={noteModalState.fields.id} />
    <div>
      <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">{noteModalState.mode} note</p>
      <h3 class="mt-2 text-2xl font-semibold text-white">
        {noteModalState.mode === "create" ? "New note" : "Update note"}
      </h3>
    </div>
    <div class="flex flex-col gap-2">
      <label for="name" class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Title</label>
      <input
        bind:value={noteModalState.fields.name}
        name="name"
        type="text"
        required
        placeholder="Retro talking points"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
      />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <label
          for="content"
          class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
          >Content</label
        >
        <label
          for={notePreviewToggleId}
          class="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0f1c] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Preview
          <span class="relative inline-flex items-center">
            <input
              id={notePreviewToggleId}
              type="checkbox"
              bind:checked={noteModalState.isPreview}
              class="peer sr-only"
            />
            <span class="block h-5 w-9 rounded-full border border-white/10 bg-white/10 transition peer-checked:border-white/60 peer-checked:bg-white/80"></span>
            <span class="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4 peer-checked:bg-[#05060c]"></span>
          </span>
        </label>
      </div>
      <MDInput
        isPreview={noteModalState.isPreview}
        bind:value={noteModalState.fields.content}
        name="content"
        placeholder="Collect highlights, meeting notes, or brainstorms..."
        class="min-h-[30vh] h-[50vh] max-h-[70vh] rounded-2xl border border-white/10 bg-[#05070f] p-4 text-sm text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none {noteModalState.isPreview ? 'overflow-y-scroll' : '' }"
      ></MDInput>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      {#if noteModalState.mode == "update"}
        <button
          type="button"
          class="text-sm font-semibold text-rose-300/80 hover:text-rose-100 cursor-pointer"
          onclick={() => deleteNote(noteModalState.fields.id)}
        >
          Delete note
        </button>
      {/if}
      <div class="ml-auto flex gap-3">
        <button
          onclick={onNoteCancel}
          type="button"
          class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-2xl bg-[var(--brand,#f1b24a)] px-5 py-2 text-sm font-semibold text-[#05060c] transition hover:brightness-110 cursor-pointer"
        >
          {noteModalState.mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </form>
</Modal>

<Modal bind:isOpen={noteDiscardModalOpen}>
  <div class="flex flex-col gap-4">
    <div>
      <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Discard changes</p>
      <h3 class="mt-2 text-2xl font-semibold text-white">Leave without saving?</h3>
      <p class="mt-1 text-sm text-slate-400">You have unsaved note content. Discarding will remove those edits.</p>
    </div>
    <div class="ml-auto flex gap-3">
      <button
        type="button"
        class="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 cursor-pointer"
        onclick={keepEditingNote}
      >
        Keep editing
      </button>
      <button
        type="button"
        class="rounded-2xl bg-rose-400/80 px-5 py-2 text-sm font-semibold text-[#05060c] transition hover:brightness-110 cursor-pointer"
        onclick={discardNoteChanges}
      >
        Discard changes
      </button>
    </div>
  </div>
</Modal>
