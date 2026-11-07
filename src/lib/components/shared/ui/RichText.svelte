<script lang="ts">
    import { parseRichText, type RichNode } from "#lib/utils/inlineFormat";

    /**
     * Renders card text with the allowlisted inline markdown (code, sup,
     * sub, b, i, u, s, mark) as real elements. Never uses {@html}: the node tree from
     * parseRichText only contains allowlisted tags, and every other
     * markup stays escaped text. Used wherever cards are read (cram,
     * overview, card list) — the editor shows the raw source instead.
     */
    let {
        text = "",
        nodes = undefined,
    }: {
        text?: string;
        /** Pre-parsed nodes (used for recursion into element children). */
        nodes?: RichNode[];
    } = $props();

    const resolved = $derived(nodes ?? parseRichText(text));
</script>

{#each resolved as node, i (i)}
    {#if node.type === "text"}
        {node.text}
    {:else}
        <svelte:element this={node.tag} class="rich-tag rich-{node.tag}">
            <svelte:self nodes={node.children} />
        </svelte:element>
    {/if}
{/each}

<style>
    /* code reads as inline code inside the serif card text; mark gets a
       soft highlight. b/i/u/s/sup/sub use the browser's
       default rendering of the real elements. */
    .rich-code {
        padding: 0.06em 0.35em;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: var(--surface-soft);

        font-family:
            ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82em;
    }

    .rich-mark {
        padding: 0 0.15em;

        border-radius: var(--radius-sm);

        background: var(--warning-bg);
    }
</style>
