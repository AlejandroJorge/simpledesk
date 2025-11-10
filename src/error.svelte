<script lang="ts">
  let { error, status } = $props();
  const message = error?.message ?? "Something went wrong";
</script>

<main class="flex min-h-screen items-center justify-center bg-[#0b1220] px-6 text-slate-100">
  <div class="max-w-md space-y-4 text-center">
    <p class="text-xs uppercase tracking-[0.4em] text-slate-500">Error</p>
    <h1 class="text-4xl font-semibold text-white">{status}</h1>
    <p class="text-sm text-slate-400">{message}</p>
    <a
      class="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
      href="/"
    >
      Go home
    </a>
  </div>
</main>
