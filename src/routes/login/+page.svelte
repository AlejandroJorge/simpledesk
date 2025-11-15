<script lang="ts">
  import logo from "$lib/assets/logo.png";

  import { enhance } from "$app/forms";
  import { createErrorToastEnhancer } from "$lib/utils/toast-errors";
  import type { PageData } from "./$types";

  let { form }: PageData & { form?: { message?: string } } = $props();
  const handleLoginSubmission = createErrorToastEnhancer();
</script>

<section
  class="min-h-screen bg-[#05060c] text-slate-100 flex items-center justify-center p-6"
>
  <form
    method="POST"
    use:enhance={handleLoginSubmission}
    class="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#090b15] p-8 shadow-[0_35px_120px_rgba(4,6,19,0.8)]"
  >
    <header class="space-y-2">
      <img src={logo} alt="SimpleDesk Logo" class="my-[-2rem]" />
      <p class="text-[11px] uppercase tracking-[0.4em] text-slate-500">
        Welcome back
      </p>
      <h1 class="text-2xl font-semibold text-white">Sign in</h1>
      <p class="text-sm text-slate-400">
        Use your workspace credentials to continue.
      </p>
    </header>
    <label class="flex flex-col gap-2 text-sm font-medium">
      <span class="text-[11px] uppercase tracking-[0.3em] text-slate-500"
        >Username</span
      >
      <input
        type="text"
        name="username"
        required
        autocomplete="username"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
        placeholder="Enter username"
      />
    </label>
    <label class="flex flex-col gap-2 text-sm font-medium">
      <span class="text-[11px] uppercase tracking-[0.3em] text-slate-500"
        >Password</span
      >
      <input
        type="password"
        name="password"
        required
        autocomplete="current-password"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
        placeholder="Enter password"
      />
    </label>
    {#if form?.message}
      <p class="text-sm font-medium text-rose-300">{form.message}</p>
    {/if}
    <div class="space-y-3">
      <button
        type="submit"
        class="w-full rounded-2xl bg-[var(--brand,#f1b24a)] px-4 py-3 text-sm font-semibold text-[#05060c] transition hover:brightness-110"
      >
        Sign in
      </button>
      <p class="text-center text-xs text-slate-500">
        Need an account?
        <a
          href="/register"
          class="text-slate-200 underline-offset-2 hover:underline">Register</a
        >
      </p>
    </div>
  </form>
</section>
