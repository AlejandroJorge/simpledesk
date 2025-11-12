<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { form }: PageData & { form?: { message?: string } } = $props();
</script>

<section class="min-h-screen bg-[#05060c] text-slate-100 flex items-center justify-center p-6">
  <form
    method="POST"
    use:enhance
    class="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#090b15] p-8 shadow-[0_35px_120px_rgba(4,6,19,0.8)]"
  >
    <header class="space-y-2">
      <p class="text-[11px] uppercase tracking-[0.4em] text-slate-500">Protected space</p>
      <h1 class="text-2xl font-semibold text-white">Enter access secret</h1>
      <p class="text-sm text-slate-400">This workspace is locked. Ask the owner for today’s secret.</p>
    </header>
    <label class="flex flex-col gap-2 text-sm font-medium">
      <span class="text-[11px] uppercase tracking-[0.3em] text-slate-500">Secret</span>
      <input
        type="password"
        name="secret"
        required
        autocomplete="current-password"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
        placeholder="Enter secret"
      />
    </label>
    {#if form?.message}
      <p class="text-sm font-medium text-rose-300">{form.message}</p>
    {/if}
    <button
      type="submit"
      class="w-full rounded-2xl bg-[var(--brand,#f1b24a)] px-4 py-3 text-sm font-semibold text-[#05060c] transition hover:brightness-110"
    >
      Unlock workspace
    </button>
  </form>
</section>
