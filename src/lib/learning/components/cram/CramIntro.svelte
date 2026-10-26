<script lang="ts">
    import { fade } from "svelte/transition";
    import { TIMER_PRESETS, type StudyTimer } from "#lib/learning/composables/useStudyTimer.svelte";

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

    <!-- Transparent spacer matching the clock dimensions. StudyClock
         measures this element and centers itself on it, so the clock
         always sits in the gap between title and buttons. -->
    <div class="clock-spacer" aria-hidden="true"></div>

    <div class="intro-bottom">
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
</div>

<style>
    /* space-between pins the title to the top, the spacer to the
       middle, and the buttons to the bottom. The clock (StudyClock)
       measures the spacer and centers itself on it, so it always
       sits in the gap — never covering the title. */
    .intro-overlay {
        position: fixed;
        inset: 0;
        z-index: 30;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;

        overflow: hidden;
        padding: 2rem;

        background: var(--bg);
    }

    .intro-title {
        margin: 0;
        flex-shrink: 0;

        font-size: clamp(1.3rem, 3dvw, 1.7rem);
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
        flex-shrink: 0;
    }

    .intro-bottom {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        flex-shrink: 0;

        width: min(100%, 18rem);
    }

    .intro-presets {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        width: 100%;
    }

    .preset-btn {
        min-height: 2.75rem;
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
        min-height: 2.5rem;
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
        .intro-overlay {
            gap: 1rem;
            padding: 1rem;
        }

        .clock-spacer {
            width: 140px;
            height: 140px;
        }
    }

    /* Short viewports (small laptops, landscape phones): tighten
       spacing so more content fits. */
    @media (max-height: 600px) {
        .intro-overlay {
            gap: 0.75rem;
        }

        .intro-title {
            font-size: clamp(1.1rem, 2.5dvw, 1.4rem);
        }

        .intro-bottom {
            gap: 0.75rem;
        }

        .intro-presets {
            gap: 0.35rem;
        }
    }

    /* Very short viewports (landscape phones): switch the presets
       to a 2-column grid so all six fit. */
    @media (max-height: 460px) {
        .intro-overlay {
            gap: 0.5rem;
        }

        .intro-bottom {
            gap: 0.5rem;
        }

        .intro-presets {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.4rem;

            width: min(100%, 22rem);
        }
    }
</style>
