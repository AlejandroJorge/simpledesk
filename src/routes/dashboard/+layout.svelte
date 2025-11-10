<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import type { LayoutProps } from "./$types";

  let { children, data, params }: LayoutProps = $props();
  const { categories } = data;

  const activeCategory = params.category;

  let isDeleteCategoryModalOpen = $state(false);
  let deleteCategoryId = $state("");
  let deleteCategoryName = $state("");
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <div class="flex min-h-screen">
    <aside
      class="hidden w-72 flex-col border-r border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/40 p-6 lg:flex"
    >
      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Spaces</p>
        <h1 class="text-2xl font-semibold text-white">Organize</h1>
        <p class="text-sm text-slate-400">Switch between categories to manage tasks and notes.</p>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto pr-2">
        {#if categories.length === 0}
          <p class="rounded-lg border border-dashed border-slate-800 px-4 py-3 text-sm text-slate-400">
            Create your first category to get started.
          </p>
        {:else}
          {#each categories as category}
            <div
              class={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-slate-800/60 ${
                activeCategory === category.name ? "bg-slate-800/70 text-white" : "text-slate-300"
              }`}
            >
              <a class="flex-1" href={`/dashboard/${category.name}`}>
                <span class="truncate">{category.name}</span>
              </a>
              <button
                class="ml-2 hidden rounded-full border border-slate-700/60 px-2 text-xs text-slate-400 transition group-hover:block hover:border-rose-500 hover:text-rose-300"
                type="button"
                onclick={() => {
                  deleteCategoryId = category.id;
                  deleteCategoryName = category.name;
                  isDeleteCategoryModalOpen = true;
                }}
                aria-label={`Delete ${category.name}`}
              >
                ×
              </button>
            </div>
          {/each}
        {/if}
      </nav>

      <form
        class="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4"
        action="/dashboard?/createCategory"
        method="POST"
      >
        <label for="categoryName" class="text-xs uppercase tracking-[0.2em] text-slate-500">New Category</label>
        <div class="flex gap-3">
          <input
            class="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            id="categoryName"
            name="name"
            type="text"
            placeholder="e.g. Product Launch"
            required
          />
          <button
            class="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:opacity-90"
            type="submit"
          >
            +
          </button>
        </div>
      </form>
    </aside>

    <main class="flex-1">
      <div class="flex flex-col gap-6 p-6 lg:p-10">
        <div class="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
          {@render children()}
        </div>
      </div>
    </main>
  </div>
</div>

<Modal bind:isOpen={isDeleteCategoryModalOpen}>
  <form
    action="/dashboard?/deleteCategory"
    method="POST"
    class="flex flex-col gap-6"
  >
    <input hidden type="text" name="id" value={deleteCategoryId} />
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-slate-500">Delete category</p>
      <p class="mt-2 text-lg font-semibold text-white">
        {deleteCategoryName ? `Remove "${deleteCategoryName}"?` : "Remove this category?"}
      </p>
      <p class="text-sm text-slate-400">Only empty categories can be removed. This action cannot be undone.</p>
    </div>
    <div class="flex w-full justify-end gap-3">
      <button
        class="rounded-xl border border-slate-700/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
        type="button"
        onclick={() => {
          isDeleteCategoryModalOpen = false;
          deleteCategoryId = "";
          deleteCategoryName = "";
        }}
      >
        Cancel
      </button>
      <button
        class="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:opacity-90"
        type="submit"
      >
        Delete
      </button>
    </div>
  </form>
</Modal>
