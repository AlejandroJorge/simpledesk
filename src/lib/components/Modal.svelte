<script lang="ts">
  let { isOpen = $bindable(), children } = $props();

  function closeModal() {
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") closeModal();
  }
</script>

<svelte:window on:keydown={handleKeydown} />
{#if isOpen}
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 backdrop-blur"
    role="presentation"
    onpointerdown={closeModal}
  >
    <div
      class="relative w-[min(92vw,48rem)] rounded-3xl border border-slate-800/70 bg-slate-950/90 p-8 text-slate-100 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.8)]"
      role="dialog"
      aria-modal="true"
      onpointerdown={(e) => e.stopPropagation()}
    >
      <button
        class="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-2xl border border-slate-800/70 text-lg font-semibold text-slate-400 transition hover:text-white"
        type="button"
        onclick={closeModal}
        aria-label="Close modal"
      >
        ×
      </button>
      {@render children()}
    </div>
  </div>
{/if}
