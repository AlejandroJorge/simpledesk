<script lang="ts">
  import { enhance } from "$app/forms";
  import Modal from "$lib/components/Modal.svelte";
  import { toast } from "$lib/components/toast-store";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { LayoutProps } from "./$types";

  let { children, data, params }: LayoutProps = $props();
  const { categories } = $derived(data);
  let activeCategory = $derived(params.category);
  const hasSelectedCategory = $derived(Boolean(params.category));
  let isMobileSidebarOpen = $state(false);

  let isDeleteCategoryModalOpen = $state(false);
  let deleteCategoryId = $state("");
  let deleteCategoryName = $state("");

  const handleFormResult: SubmitFunction = () => {
    return async ({ result, update }) => {
      if (result.type === "success") {
        const message =
          (result.data as { message?: string } | null)?.message ??
          "Action completed";
        toast.success(message);
        isDeleteCategoryModalOpen = false
      } else if (result.type === "failure") {
        const message =
          (result.data as { message?: string } | null)?.message ??
          "Something went wrong";
        toast.error(message);
      } else if (result.type === "error") {
        toast.error("Unexpected error. Please try again.");
      }

      await update();
    };
  };
</script>

<div class="min-h-screen bg-[#0b1220] text-slate-100">
  <div class="flex min-h-screen">
    <div
      class={`fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
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
      class={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800/70 bg-slate-900 p-6 transition-transform duration-300 ease-out lg:static lg:flex lg:translate-x-0 lg:transform-none ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Category navigation"
    >
      <button
        class="mb-4 flex h-10 w-10 items-center justify-center self-end rounded-xl border border-slate-800/60 text-lg text-slate-300 transition hover:border-slate-600 hover:text-white lg:hidden"
        type="button"
        aria-label="Close sidebar"
        onclick={() => {
          isMobileSidebarOpen = false;
        }}
      >
        ×
      </button>
      <div class="mb-8">
        <p
          class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Spaces
        </p>
        <h1 class="text-2xl font-semibold text-white">Organize</h1>
        <p class="text-sm text-slate-400">
          Switch between categories to manage tasks and notes.
        </p>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto pr-2">
        {#if categories.length === 0}
          <p
            class="rounded-lg border border-dashed border-slate-800 px-4 py-3 text-sm text-slate-400"
          >
            Create your first category to get started.
          </p>
        {:else}
          {#each categories as category}
            <div
              class={`group flex items-center justify-between rounded-xl text-sm font-medium transition hover:bg-slate-800/60 ${
                activeCategory === category.name
                  ? "bg-slate-800/70 text-white"
                  : "text-slate-300"
              }`}
            >
              <a
                class="flex-1 px-4 py-3 "
                href={`/dashboard/${category.name}`}
                onclick={() => {
                  isMobileSidebarOpen = false;
                }}
              >
                <span class="truncate">{category.name}</span>
              </a>
              <button
                class="mr-2 hidden rounded-full border border-slate-700/60 px-2 text-xs text-slate-300 transition group-hover:block hover:border-slate-500"
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
        class="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900 p-4"
        action="/dashboard?/createCategory"
        method="POST"
        use:enhance={handleFormResult}
      >
        <label
          for="categoryName"
          class="text-xs uppercase tracking-[0.2em] text-slate-400"
          >New Category</label
        >
        <div class="flex gap-3">
          <input
            class="w-full rounded-xl border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            id="categoryName"
            name="name"
            type="text"
            placeholder="e.g. Product Launch"
            required
          />
          <button
            class="rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
            type="submit"
          >
            +
          </button>
        </div>
      </form>
    </aside>

    <main class="flex-1">
      <div class="flex flex-col gap-6 p-6 lg:p-10">
        <button
          class="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white lg:hidden"
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
          Open sidebar
        </button>
        {#if hasSelectedCategory}
          <div
            class="rounded-3xl border border-slate-800/60 bg-slate-900 p-6 shadow-[0_10px_40px_rgba(2,6,23,0.6)]"
          >
            {@render children()}
          </div>
        {/if}
      </div>
    </main>
  </div>
</div>

<Modal bind:isOpen={isDeleteCategoryModalOpen}>
  <form
    action="/dashboard?/deleteCategory"
    method="POST"
    class="flex flex-col gap-6"
    use:enhance={handleFormResult}
  >
    <input hidden type="text" name="id" value={deleteCategoryId} />
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-slate-500">
        Delete category
      </p>
      <p class="mt-2 text-lg font-semibold text-white">
        {deleteCategoryName
          ? `Remove "${deleteCategoryName}"?`
          : "Remove this category?"}
      </p>
      <p class="text-sm text-slate-400">
        Only empty categories can be removed. This action cannot be undone.
      </p>
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
        class="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
        type="submit"
      >
        Delete
      </button>
    </div>
  </form>
</Modal>
