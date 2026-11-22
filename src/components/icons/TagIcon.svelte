<script lang="ts">
    import type { Style } from "#lib/core/deck/document";

    /** Small inline SVG icon for one allowlisted style (toolbar buttons). */
    let { style }: { style: Style } = $props();
</script>

<svg class="tag-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    {#if style === "code"}
        <text x="0.5" y="11.5" font-size="11" fill="currentColor">&lt;/&gt;</text>
    {:else if style === "sup"}
        <text x="5" y="11" font-size="10" font-weight="600" fill="currentColor">x</text>
        <text x="11" y="8" font-size="7" font-weight="600" fill="currentColor">2</text>
    {:else if style === "sub"}
        <text x="5" y="11" font-size="10" font-weight="600" fill="currentColor">x</text>
        <text x="11" y="13" font-size="7" font-weight="600" fill="currentColor">2</text>
    {:else if style === "bold"}
        <text x="4.5" y="11.5" font-size="11" font-weight="700" fill="currentColor">B</text>
    {:else if style === "italic"}
        <text x="6" y="11.5" font-size="11" font-style="italic" fill="currentColor">I</text>
    {:else if style === "underline"}
        <text x="4.5" y="11" font-size="11" text-decoration="underline" fill="currentColor">U</text>
    {:else if style === "strike"}
        <text x="5" y="11.5" font-size="11" text-decoration="line-through" fill="currentColor">
            S
        </text>
    {:else if style === "mark"}
        <rect x="1.5" y="3" width="13" height="10" rx="2" fill="currentColor" opacity="0.3" />
        <text x="4.5" y="10.9" font-size="8.5" font-weight="600" fill="currentColor">M</text>
    {/if}
</svg>

<style lang="postcss">
    .tag-icon {
        display: block;

        width: 1rem;
        height: 1rem;
    }
</style>
