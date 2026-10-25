<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        blurred = false,
        clockSpace = false,
        fullHeight = false,
        top,
        center,
        bottom,
        overlays,
    }: {
        /** Blur the study interface (timer pause / break dialog). */
        blurred?: boolean;
        /** Reserve bottom padding for the floating study clock. */
        clockSpace?: boolean;
        /** Fill the full viewport (no global header/footer chrome). */
        fullHeight?: boolean;
        top?: Snippet;
        center: Snippet;
        bottom?: Snippet;
        overlays?: Snippet;
    } = $props();
</script>

<div
    class="study-page"
    class:interface-blurred={blurred}
    class:clock-space={clockSpace}
    class:full-height={fullHeight}
>
    {#if top}
        <div class="study-top">{@render top()}</div>
    {/if}
    <div class="study-center">{@render center()}</div>
    {#if bottom}
        <div class="study-bottom">{@render bottom()}</div>
    {/if}
    {@render overlays?.()}
</div>

<style>
    .study-page {
        display: flex;
        flex-direction: column;

        width: min(100%, var(--content-width));

        min-height: calc(100vh - 3.5rem - var(--footer-h));

        margin-inline: auto;
        padding: 1.5rem 2rem 4rem 2rem;
    }

    .study-page.full-height {
        min-height: 100vh;
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

    /* While the timer is paused or the break dialog is shown, the
       interface blurs — the overlays (timer, dialogs) stay sharp. */
    .study-page > .study-top,
    .study-page > .study-center,
    .study-page > .study-bottom {
        transition: filter var(--transition-normal);
    }

    .study-page.interface-blurred > .study-top,
    .study-page.interface-blurred > .study-center,
    .study-page.interface-blurred > .study-bottom {
        filter: blur(5px);
    }

    @media (max-width: 540px) {
        .study-page {
            padding: 1rem 1rem 1.5rem;
        }

        .study-page.clock-space {
            padding-bottom: 4.75rem;
        }
    }
</style>
