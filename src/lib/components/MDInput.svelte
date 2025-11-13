<script lang="ts">
  import remarkGfm from "remark-gfm";
  import Markdown from "svelte-exmarkdown";
  import type { Plugin } from "svelte-exmarkdown";

  const gfmPlugin = (options: {}): Plugin => ({
    remarkPlugin: [remarkGfm, options],
  });
  const plugins: Plugin[] = [gfmPlugin({})];

  let {
    value = $bindable<string | null>(null),
    isPreview = false,
    ...props
  } = $props();
  let textareaEl: HTMLTextAreaElement | null = null;
  let textValue = $state(value ?? "");

  $effect(() => {
    const next = value ?? "";
    if (next !== textValue) textValue = next;
  });

  function handleInput(event: Event) {
    textValue = (event.currentTarget as HTMLTextAreaElement).value;
    value = textValue;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (
      event.key !== "Tab" ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;

    event.preventDefault();

    if (!textareaEl) return;

    const start = textareaEl.selectionStart ?? 0;
    const end = textareaEl.selectionEnd ?? 0;
    const nextValue = `${textValue.slice(0, start)}\t${textValue.slice(end)}`;

    textValue = nextValue;
    value = nextValue;

    queueMicrotask(() => {
      const nextCursor = start + 1;
      textareaEl?.setSelectionRange(nextCursor, nextCursor);
    });
  }
</script>

<textarea
  hidden={isPreview}
  bind:this={textareaEl}
  value={textValue}
  oninput={handleInput}
  onkeydown={handleKeyDown}
  {...props}
></textarea>
{#if isPreview}
  <div {...props}>
    <Markdown md={textValue} {...props} {plugins}>
      {#snippet h1(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h1 {style} class={className} {...rest}>
          {@render children?.()}
        </h1>
      {/snippet}
      {#snippet h2(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h2 {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </h2>
      {/snippet}
      {#snippet h3(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h3 {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </h3>
      {/snippet}
      {#snippet h4(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h4 {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </h4>
      {/snippet}
      {#snippet h5(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h5 {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </h5>
      {/snippet}
      {#snippet h6(props)}
        {@const { children, style, class: className, ...rest } = props}
        <h6 {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </h6>
      {/snippet}
      {#snippet p(props)}
        {@const { children, style, class: className, ...rest } = props}
        <p {style} class="{className} heading" {...rest}>
          {@render children?.()}
        </p>
      {/snippet}
      {#snippet ul(props)}
        {@const { children, style, class: className, ...rest } = props}
        <ul {style} class={className} {...rest}>
          {@render children?.()}
        </ul>
      {/snippet}
      {#snippet ol(props)}
        {@const { children, style, class: className, ...rest } = props}
        <ol {style} class={className} {...rest}>
          {@render children?.()}
        </ol>
      {/snippet}
      {#snippet hr(props)}
        {@const { style, class: className, ...rest } = props}
        <hr {style} class={className} {...rest} />
      {/snippet}
    </Markdown>
  </div>
{/if}

<style>
  textarea {
    resize: none;
  }
  h1 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
    margin-top: 0;
    margin-bottom: 1rem;
    padding-bottom: 0.3rem;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.25rem;
  }
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }
  h4 {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  h5 {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.5;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  h6 {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.5;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  p {
    font-size: 1rem;
    line-height: 1.6;
    margin-top: 0;
    margin-bottom: 1rem;
  }
  ul {
    list-style-type: disc;
    margin-top: 0;
    margin-bottom: 1rem;
    padding-left: 2rem;
  }
  ol {
    list-style-type: decimal;
    margin-top: 0;
    margin-bottom: 1rem;
    padding-left: 2rem;
  }
  hr {
    border: 0;
    border-top: 1px solid #e5e7eb;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }
  * {
    font-size: 1rem;
    line-height: 1.6;
    margin-top: 0;
    margin-bottom: 1rem;
  }
</style>
