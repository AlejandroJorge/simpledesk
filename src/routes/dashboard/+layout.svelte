<script lang="ts">
  import { enhance } from "$app/forms";
  import Modal from "$lib/components/Modal.svelte";
  import { createErrorToastEnhancer } from "$lib/utils/toast-errors";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { LayoutProps } from "./$types";

  let { children, data, params }: LayoutProps = $props();
  const { categories } = $derived(data);
  const activeCategoryId = $derived('category' in params ? params.category : null);
  const auth = $derived(data.auth);
  let isMobileSidebarOpen = $state(false);

  let isCreateCategoryModalOpen = $state(false);
  let isDeleteCategoryModalOpen = $state(false);
  let deleteCategoryId = $state("");
  let deleteCategoryName = $state("");

  const createEnhanceHandler = (onSuccess?: () => void): SubmitFunction =>
    createErrorToastEnhancer({ onSuccess });

</script>

<div class="min-h-screen bg-[#030406] text-slate-100">
  <div class="flex min-h-screen">
    <div
      class={`fixed inset-0 z-30 bg-black/70 backdrop-blur-sm cursor-pointer transition-opacity duration-300 lg:hidden ${
        isMobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isMobileSidebarOpen}
      role="presentation"
      onclick={() => {
        isMobileSidebarOpen = false;
      }}
    ></div>

    <aside
      id="dashboard-sidebar"
      class={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/5 bg-[#07090f] px-5 py-6 transition-transform duration-200 ease-out lg:static lg:flex lg:translate-x-0 lg:transform-none ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Category navigation"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <p class="text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500">
            Spaces
          </p>
          <h1 class="text-lg font-semibold text-white tracking-tight">SimpleDesk</h1>
        </div>
        <button
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-base text-slate-400 transition hover:text-white lg:hidden"
          type="button"
          aria-label="Close sidebar"
          onclick={() => {
            isMobileSidebarOpen = false;
          }}
        >
          ×
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
        <a
          href="/dashboard"
          class={`flex items-center gap-2 rounded-xl px-3 py-2 font-medium transition ${
            activeCategoryId === null
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          onclick={() => {
            isMobileSidebarOpen = false;
          }}
        >
          <span class="flex-1 truncate">All tasks</span>
          <span class="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-400">View</span>
        </a>
        {#if categories.length === 0}
          <p
            class="rounded-lg border border-dashed border-slate-800/80 px-3 py-2 text-xs text-slate-500"
          >
            Create your first category to get started.
          </p>
        {:else}
          {#each categories as category}
            <div
              class={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                activeCategoryId === category.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <a
                class="flex-1 cursor-pointer"
                href={`/dashboard/${category.id}`}
                onclick={() => {
                  isMobileSidebarOpen = false;
                }}
              >
                <span class="truncate">{category.name}</span>
              </a>
              <button
                class="mr-1 hidden cursor-pointer rounded-full border border-white/10 px-2 text-xs text-slate-400 transition group-hover:inline-flex hover:border-white/30"
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

      <button
        class="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand,#f1b24a)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#05060c] transition hover:brightness-110"
        type="button"
        onclick={() => {
          isCreateCategoryModalOpen = true;
        }}
      >
        New Category
      </button>
      {#if auth?.isAuthenticated}
        <form method="POST" action="/logout" class="mt-3">
          <button
            type="submit"
            class="w-full rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/30"
          >
            Logout
          </button>
        </form>
      {/if}
    </aside>

    <main class="flex-1 min-h-0">
      <div class="flex h-full min-h-0 flex-col gap-4 p-4 lg:p-8">
        <button
          class="inline-flex cursor-pointer items-center gap-2 self-start rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:text-white lg:hidden"
          type="button"
          aria-controls="dashboard-sidebar"
          aria-expanded={isMobileSidebarOpen}
          onclick={() => {
            isMobileSidebarOpen = true;
          }}
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
        <div class="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[#05070f] p-5">
          {@render children()}
        </div>
      </div>
    </main>
  </div>
</div>

<Modal bind:isOpen={isCreateCategoryModalOpen}>
  <form
    action="/dashboard?/createCategory"
    method="POST"
    class="flex w-full flex-col gap-4"
    use:enhance={createEnhanceHandler(() => {
      isCreateCategoryModalOpen = false;
    })}
  >
    <div class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.45em] text-slate-500">New category</p>
      <p class="text-lg font-semibold text-white">Create a space</p>
    </div>
    <label class="flex flex-col gap-2 text-sm text-white/90">
      <span class="text-[10px] uppercase tracking-[0.4em] text-slate-500">Name</span>
      <input
        class="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
        name="name"
        type="text"
        placeholder="e.g. Growth Sprint"
        required
      />
    </label>
    <div class="flex w-full justify-end gap-2">
      <button
        class="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200"
        type="button"
        onclick={() => {
          isCreateCategoryModalOpen = false;
        }}
      >
        Cancel
      </button>
      <button
        class="rounded-xl bg-[var(--brand,#f1b24a)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#05060c]"
        type="submit"
      >
        Create
      </button>
    </div>
  </form>
</Modal>

<Modal bind:isOpen={isDeleteCategoryModalOpen}>
  <form
    action="/dashboard?/deleteCategory"
    method="POST"
    class="flex w-full flex-col gap-4"
    use:enhance={createEnhanceHandler(() => {
      isDeleteCategoryModalOpen = false;
      deleteCategoryId = "";
      deleteCategoryName = "";
    })}
  >
    <input hidden type="text" name="id" value={deleteCategoryId} />
    <div class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.45em] text-slate-500">
        Delete category
      </p>
      <p class="text-lg font-semibold text-white">
        {deleteCategoryName ? `Remove "${deleteCategoryName}"?` : "Remove this category?"}
      </p>
      <p class="text-sm text-slate-400">
        Only empty categories can be removed. This action cannot be undone.
      </p>
    </div>
    <div class="flex w-full justify-end gap-3">
      <button
        class="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200"
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
        class="rounded-xl bg-rose-400/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#05060c]"
        type="submit"
      >
        Delete
      </button>
    </div>
  </form>
</Modal>
