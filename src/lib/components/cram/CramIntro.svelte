<script lang="ts">
    import { fade } from "svelte/transition";
    import { TIMER_PRESETS, type StudyTimer } from "#lib/composables/useStudyTimer.svelte";

    let {
        timer,
        onDone,
    }: {
        timer: StudyTimer;
        onDone: () => void;
    } = $props();

    // Stagger timings (ms): the clock takes ~700ms to reach center,
    // the title fades in shortly after, then each preset pops in.
    const TITLE_DELAY = 550;
    const FIRST_PRESET_DELAY = 850;
    const PRESET_STAGGER = 70;

    function selectPreset(ms: number): void {
        timer.setPreset(ms);
        onDone();
    }

    function skip(): void {
        onDone();
    }

    const skipDelay =
        FIRST_PRESET_DELAY + TIMER_PRESETS.length * PRESET_STAGGER + 80;
</script>

<div class="intro-overlay" in:fade={{ duration: 250 }}>
    <h2
        class="intro-title"
        style="animation-delay: {TITLE_DELAY}ms"
    >
        Wie lange möchtest du heute lernen?
    </h2>

    <!-- Spacer matching the intro clock size so the buttons
         appear below the centered clock. -->
    <div class="clock-spacer" aria-hidden="true"></div>

    <div class="intro-presets">
        {#each TIMER_PRESETS as preset, i (preset.ms)}
            <button
                type="button"
                class="preset-btn"
                style="animation-delay: {FIRST_PRESET_DELAY +
                    i * PRESET_STAGGER}ms"
                onclick={() => selectPreset(preset.ms)}
            >
                {preset.label}
            </button>
        {/each}
    </div>

    <button
        type="button"
        class="skip-btn"
        style="animation-delay: {skipDelay}ms"
        onclick={skip}
    >
        Ohne Timer starten
    </button>
</div>

<style>
    .intro-overlay {
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

    .intro-title {
        margin: 0 0 0.75rem;

        font-size: clamp(1.3rem, 3vw, 1.7rem);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.25;
        text-align: center;

        opacity: 0;
        animation: rise-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* Matches the intro-mode clock dimensions in StudyClock. */
    .clock-spacer {
        width: 180px;
        height: 180px;
        margin: 0.25rem 0 0.75rem;
    }

    .intro-presets {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        width: min(100%, 18rem);
    }

    .preset-btn {
        padding: 0.7rem 1.15rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font-size: 0.95rem;
        font-weight: 600;
        text-align: center;

        box-shadow: var(--shadow-card);

        opacity: 0;
        animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    .preset-btn:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .preset-btn:active {
        box-shadow: var(--shadow-sm);
    }

    .skip-btn {
        margin-top: 1rem;
        padding: 0.4rem 0.75rem;
        border: 0;

        background: transparent;
        color: var(--text-muted);

        font-size: 0.875rem;
        font-weight: 500;

        opacity: 0;
        animation: rise-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;

        transition: color var(--transition-fast);
    }

    .skip-btn:hover {
        color: var(--text);
    }

    @keyframes rise-in {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pop-in {
        from {
            opacity: 0;
            transform: scale(0.85) translateY(8px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @media (max-width: 540px) {
        .clock-spacer {
            width: 140px;
            height: 140px;
        }

        .intro-overlay {
            padding: 1rem;
        }
    }
</style>
