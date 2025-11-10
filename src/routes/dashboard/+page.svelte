<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const categories = data?.categories ?? [];
</script>

<section class="space-y-10">
  <header class="space-y-4">
    <p class="text-sm uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
    <h1 class="text-4xl font-semibold text-white">Your command center, now in dark mode</h1>
    <p class="max-w-2xl text-base text-slate-400">
      Create focused categories on the left, then arrange tasks and notes with clarity. Everything updates in real time so you
      can stay in the flow.
    </p>
  </header>

  <div class="grid gap-6 md:grid-cols-2">
    <div class="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6">
      <h2 class="text-lg font-semibold text-white">1. Create a category</h2>
      <p class="mt-2 text-sm text-slate-400">Use the panel on the left to add a category for each initiative.</p>
    </div>
    <div class="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6">
      <h2 class="text-lg font-semibold text-white">2. Fill it with work</h2>
      <p class="mt-2 text-sm text-slate-400">Track tasks, deadlines, and free-form notes inside every category.</p>
    </div>
  </div>

  <div class="rounded-3xl border border-slate-800/60 bg-slate-950/40 p-8 text-center">
    {#if categories.length === 0}
      <p class="text-base text-slate-400">
        You have no categories yet. Create one to unlock the workspace.
      </p>
    {:else}
      <p class="text-base text-slate-400">
        Select a category from the sidebar to start planning.
      </p>
    {/if}
  </div>
</section>
