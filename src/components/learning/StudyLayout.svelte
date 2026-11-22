<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        fullHeight = false,
        top,
        center,
        bottom,
    }: {
        /** Fill the full viewport (no global header/footer chrome). */
        fullHeight?: boolean;
        top?: Snippet;
        center: Snippet;
        bottom?: Snippet;
    } = $props();
</script>

<div class="study-page" class:full-height={fullHeight}>
    {#if top}
        <div class="study-top">
            {@render top()}
        </div>
    {/if}
    <div class="study-center">
        {@render center()}
    </div>
    {#if bottom}
        <div class="study-bottom">
            {@render bottom()}
        </div>
    {/if}
</div>

<style lang="postcss">
    .study-page {
        display: flex;
        flex-direction: column;

        width: min(100%, var(--content-width));

        min-height: calc(100dvh - var(--header-h) - var(--footer-h));

        margin-inline: auto;
        padding: 1.5rem 2rem 4rem 2rem;

        &.full-height {
            min-height: 100dvh;
        }
    }

    /* Mobile chrome keeps the global header in the flow, so full-height
       subtracts its height — this mirrors the layout's mobile media query
       and lets the rule stay scoped to the element that owns it. */
    @media (max-width: 700px), (pointer: coarse) {
        .study-page.full-height {
            min-height: calc(100dvh - var(--header-h));
        }
    }

    .study-top {
        flex: 0 0 auto;
    }

    .study-center {
        position: relative;

        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        justify-content: center;
        min-height: 0;
    }

    .study-bottom {
        flex: 0 0 auto;
        margin-top: 1rem;
    }

    @media (max-width: 700px) {
        .study-page {
            padding: 0.75rem 1rem 1rem;
        }
    }
</style>
