<script lang="ts">
    import { fade } from "svelte/transition";
    import type { StudyTimer } from "#lib/composables/useStudyTimer.svelte";
    import { formatCountdown } from "#lib/utils/time";

    let { timer }: { timer: StudyTimer } = $props();

    // Move focus onto the OK button when the overlay appears, so keyboard
    // users land on the primary action (autofocus is an a11y warning).
    function focusOnMount(node: HTMLElement): void {
        node.focus();
    }
</script>

<div class="break-overlay" in:fade={{ duration: 250 }}>
    <h2 class="break-title">Zeit für eine Pause!</h2>

    <!-- Spacer matching the intro clock size so the content
         appears below the centered clock. -->
    <div class="clock-spacer" aria-hidden="true"></div>

    <!-- Red countdown: time remaining until the OK button is available. -->
    <div class="countdown">
        {formatCountdown(timer.okRemainingMs)}
    </div>

    <button
        type="button"
        class="ok-btn"
        use:focusOnMount
        class:override={timer.overrideOffered}
        aria-disabled={!timer.okEnabled && !timer.overrideOffered}
        onclick={timer.acknowledge}
        ondblclick={timer.offerOverride}
    >
        {#if timer.overrideOffered}
            Weitermachen (Überschreiben?)
        {:else}
            Weitermachen
        {/if}
    </button>
</div>

<style>
    .break-overlay {
        position: fixed;
        inset: 0;
        z-index: 30;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        padding: 1.5rem;

        background: var(--bg);
    }

    .break-title {
        margin: 0 0 0.75rem;

        font-size: clamp(1.3rem, 3vw, 1.7rem);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.25;
        text-align: center;
    }

    /* Matches the intro-mode clock dimensions in StudyClock. */
    .clock-spacer {
        width: 180px;
        height: 180px;
        margin: 0.25rem 0 0.75rem;
    }

    .countdown {
        margin-bottom: 1.5rem;

        color: var(--success-text);
        font-size: 1.25rem;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
        line-height: 1;
    }

    .ok-btn {
        width: min(100%, 18rem);
        min-height: 2.8rem;
        padding: 0.7rem 1.15rem;
        border: 3px transparent solid;
        border-radius: var(--radius-md);

        background: var(--success-text);
        color: var(--success-bg);

        font-size: 0.95rem;
        font-weight: 600;

        transition: background var(--transition-fast);
    }

    .ok-btn:hover:not([aria-disabled="true"]) {
        background: var(--success-hover);
        color: var(--success-text);
        border: 3px var(--success-border) solid;
    }

    .ok-btn[aria-disabled="true"] {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .ok-btn.override {
        background: var(--danger-text);
        color: var(--danger-bg);
    }

    .ok-btn.override:hover:not([aria-disabled="true"]) {
        background: var(--danger-hover);
        color: var(--danger-text);
        border: 3px var(--danger-border) solid;
    }

    @media (max-width: 540px) {
        .clock-spacer {
            width: 140px;
            height: 140px;
        }

        .break-overlay {
            padding: 1rem;
        }

        .countdown {
            font-size: 1.1rem;
        }
    }
</style>
