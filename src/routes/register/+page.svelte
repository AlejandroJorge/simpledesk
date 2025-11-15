<script lang="ts">
  import logo from "$lib/assets/logo.png"

  import { enhance } from "$app/forms";
  import { createErrorToastEnhancer } from "$lib/utils/toast-errors";
  import type { PageData } from "./$types";

  let { form }: PageData & { form?: { message?: string } } = $props();
  const handleRegisterSubmission = createErrorToastEnhancer();
</script>

<section class="min-h-screen bg-[#05060c] text-slate-100 flex items-center justify-center p-6">
  <form
    method="POST"
    use:enhance={handleRegisterSubmission}
    class="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#090b15] p-8 shadow-[0_35px_120px_rgba(4,6,19,0.8)]"
  >
    <header class="space-y-2">
      <img src={logo} alt="SimpleDesk Logo" class="my-[-2rem]" />
      <p class="text-[11px] uppercase tracking-[0.4em] text-slate-500">Create workspace user</p>
      <h1 class="text-2xl font-semibold text-white">Register</h1>
      <p class="text-sm text-slate-400">Pick a username and password to manage your tasks.</p>
    </header>
    <label class="flex flex-col gap-2 text-sm font-medium">
      <span class="text-[11px] uppercase tracking-[0.3em] text-slate-500">Username</span>
      <input
        type="text"
        name="username"
        required
        minlength="3"
        autocomplete="username"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
        placeholder="Pick a username"
      />
    </label>
    <label class="flex flex-col gap-2 text-sm font-medium">
      <span class="text-[11px] uppercase tracking-[0.3em] text-slate-500">Password</span>
      <input
        type="password"
        name="password"
        required
        minlength="6"
        autocomplete="new-password"
        class="rounded-2xl border border-white/10 bg-[#05070f] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-white/30 focus:outline-none"
        placeholder="Create a password"
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
        Create account
      </button>
      <p class="text-center text-xs text-slate-500">
        Already registered?
        <a href="/login" class="text-slate-200 underline-offset-2 hover:underline">Sign in</a>
      </p>
    </div>
  </form>
</section>
