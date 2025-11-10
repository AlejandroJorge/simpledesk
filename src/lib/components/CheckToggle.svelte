<script lang="ts">
  let {
    checked = false,
    disabled = false,
    label = "Toggle status",
    onchange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    onchange?: (event: { checked: boolean }) => void;
  } = $props();

  const handleToggle = () => {
    if (disabled) return;
    onchange?.({ checked: !checked });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleToggle();
    }
  };

  const styles = $derived(
    checked
      ? "bg-indigo-500/90 text-white border-indigo-400"
      : "bg-slate-900 text-slate-500 border-slate-700",
  );
</script>

<button
  type="button"
  role="checkbox"
  class={`flex size-7 items-center justify-center rounded-full border text-sm transition ${styles}`}
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={handleToggle}
  onkeydown={handleKeyDown}
>
  {#if checked}
    <svg
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  {/if}
</button>
