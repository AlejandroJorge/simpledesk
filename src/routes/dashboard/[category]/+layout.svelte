<script lang="ts">
  import type { LayoutProps } from "./$types";
  import { page } from "$app/state";

  let { children, params }: LayoutProps = $props();
  const category = $derived(params.category);

  const currentSection = $derived(page.route.id?.split("/").at(-1))
</script>

<section class="space-y-8">
  <header
    class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800/60 bg-slate-900/70 px-6 py-5"
  >
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-slate-500">Category</p>
      <h1 class="text-3xl font-semibold text-white">{category}</h1>
    </div>
    <div
      class="inline-flex rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1 text-sm text-slate-300"
    >
      <a
        href={`/dashboard/${category}/tasks`}
        class={`rounded-2xl px-4 py-2 font-medium transition ${
          currentSection == "tasks"
            ? "bg-white/10 text-white shadow-inner shadow-black/30"
            : "text-slate-400 hover:text-white"
        }`}
      >Tasks</a>
      <a
        href={`/dashboard/${category}/notes`}
        class={`rounded-2xl px-4 py-2 font-medium transition ${
          currentSection == "notes"
            ? "bg-white/10 text-white shadow-inner shadow-black/30"
            : "text-slate-400 hover:text-white"
        }`}
      >Notes</a>
    </div>
  </header>

  {@render children()}
</section>
