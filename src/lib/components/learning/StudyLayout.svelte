<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        blurred = false,
        fullHeight = false,
        onBlurredInteract,
        top,
        center,
        bottom,
        overlays,
    }: {
        /** Blur the study interface (timer pause / break dialog). */
        blurred?: boolean;
        /** Fill the full viewport (no global header/footer chrome). */
        fullHeight?: boolean;
        /** Called when the blurred content is clicked; the click itself
            is swallowed so it cannot trigger any action. */
        onBlurredInteract?: () => void;
        top?: Snippet;
        center: Snippet;
        bottom?: Snippet;
        overlays?: Snippet;
    } = $props();

    // While the interface is blurred, a click on the content only lifts
    // the blur: the click is swallowed in the capture phase so it cannot
    // flip, answer or navigate — the action runs on the next click, once
    // the interface is interactive again. Overlays (timer menu, break
    // dialog, clock) sit outside these containers and stay clickable.
    function handleBlurredClick(event: MouseEvent): void {
        if (!blurred || onBlurredInteract === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        onBlurredInteract();
    }
</script>

<div
    class="study-page"
    class:interface-blurred={blurred}
    class:full-height={fullHeight}
>
    {#if top}
        <div class="study-top" onclickcapture={handleBlurredClick}>
            {@render top()}
        </div>
    {/if}
    <div class="study-center" onclickcapture={handleBlurredClick}>
        {@render center()}
    </div>
    {#if bottom}
        <div class="study-bottom" onclickcapture={handleBlurredClick}>
            {@render bottom()}
        </div>
    {/if}
    {@render overlays?.()}
</div>

<style>
    .study-page {
        display: flex;
        flex-direction: column;

        width: min(100%, var(--content-width));

        min-height: calc(100dvh - var(--header-h) - var(--footer-h));

        margin-inline: auto;
        padding: 1.5rem 2rem 4rem 2rem;
    }

    .study-page.full-height {
        min-height: 100dvh;
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

    /* Mobile layout: tighter padding, and the top strip reserves the
       clock's height so the floating clock never overlaps the card —
       its content is centered against the clock. */
    @media (max-width: 700px) {
        .study-page {
            padding: 0.75rem 1rem 1rem;
        }

        .study-top {
            display: flex;
            flex-direction: column;
            justify-content: center;

            min-height: var(--clock-size);
        }
    }
</style>
