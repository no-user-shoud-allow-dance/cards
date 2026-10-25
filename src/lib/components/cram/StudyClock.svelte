<script lang="ts">
    import { TIMER_PRESETS, type StudyTimer } from "#lib/composables/useStudyTimer.svelte";
    import { formatCountdown } from "#lib/utils/time";

    let {
        timer,
        intro = false,
        breakMode = false,
    }: { timer: StudyTimer; intro?: boolean; breakMode?: boolean } = $props();

    // Elapsed fraction of the countdown, 0..1; null when no timer is set.
    const elapsedRatio = $derived.by(() => {
        if (timer.remainingMs === null || timer.durationMs === null) return null;
        return Math.min(1, Math.max(0, 1 - timer.remainingMs / timer.durationMs));
    });

    // In break mode the arc shows the remaining cooldown fraction,
    // depleting from full to empty (counterclockwise countdown).
    const breakRatio = $derived(1 - timer.okProgress);

    // Minutes-hand angle in degrees, 0 = pointing up. With a countdown
    // set, the hand sweeps clockwise over the elapsed fraction, riding
    // the leading edge of the arc; without one it shows the actual time.
    // In break mode the hand sweeps counterclockwise over the remaining
    // cooldown.
    const angle = $derived.by(() => {
        if (breakMode) return breakRatio * 360;
        if (elapsedRatio !== null) return elapsedRatio * 360;
        return 0;
    });
</script>

<div class="clock-zone" class:intro-mode={intro} class:break-mode={breakMode}>
    {#if timer.menuOpen && !intro && !breakMode}
        <button
            type="button"
            class="menu-backdrop"
            aria-label="Timer-Menü schließen"
            onclick={() => (timer.menuOpen = false)}
        ></button>
        <div class="menu" role="group" aria-label="Timer stellen">
            <span class="menu-title">Timer stellen</span>
            {#each TIMER_PRESETS as preset (preset.ms)}
                <button
                    type="button"
                    class="preset"
                    class:active={timer.running && timer.durationMs === preset.ms}
                    onclick={() => timer.setPreset(preset.ms)}
                >
                    {preset.label}
                </button>
            {/each}
            {#if timer.running}
                <div class="menu-status">
                    Verbleibend: {formatCountdown(timer.remainingMs ?? 0)}
                </div>
                <button type="button" class="stop" onclick={timer.stop}>
                    Timer stoppen
                </button>
            {/if}
        </div>
    {/if}

    <button
        type="button"
        class="clock"
        class:paused={timer.paused}
        class:done={timer.finishedAt !== null}
        onclick={() => { if (!intro && !breakMode) timer.menuOpen = !timer.menuOpen; }}
        aria-label="Timer stellen"
        aria-expanded={timer.menuOpen}
        title="Timer stellen"
        tabindex={intro || breakMode ? -1 : 0}
    >
        <svg viewBox="0 0 100 100" aria-hidden="true">
            {#if breakMode}
                <circle
                    class="arc"
                    cx="50"
                    cy="50"
                    r="44"
                    pathLength="100"
                    stroke-dasharray="{breakRatio * 100} 100"
                    transform="rotate(-90 50 50)"
                />
            {:else if elapsedRatio !== null}
                <circle
                    class="arc"
                    cx="50"
                    cy="50"
                    r="44"
                    pathLength="100"
                    stroke-dasharray="{elapsedRatio * 100} 100"
                    transform="rotate(-90 50 50)"
                />
            {/if}
            <line
                class="hand"
                x1="50"
                y1="55"
                x2="50"
                y2="15"
                transform="rotate({angle} 50 50)"
            />
            <circle class="pin" cx="50" cy="50" r="5" />
        </svg>
    </button>
</div>

<style>
    /* No base transform: a transformed ancestor becomes the containing
       block for fixed-position descendants, which would break the
       viewport-relative placement of the menu and backdrop. Intro/break
       modes set their own transform; "none" interpolates like the
       identity, so the fly-to-center animation still works. */
    .clock-zone {
        position: fixed;
        left: 1.1rem;
        top: calc(50dvh - 64px);
        z-index: 40;

        transition:
            left 0.7s cubic-bezier(0.34, 1.3, 0.64, 1),
            top 0.7s cubic-bezier(0.34, 1.3, 0.64, 1),
            transform 0.7s cubic-bezier(0.34, 1.3, 0.64, 1);
    }

    .clock-zone.intro-mode {
        left: 50%;
        top: 25%;
        transform: translate(-50%, -50%);
    }

    .clock-zone.break-mode {
        left: 50%;
        top: 45%;
        transform: translate(-50%, -50%);
    }

    .clock {
        display: block;

        width: var(--clock-size);
        height: var(--clock-size);
        padding: 7px;

        border: 1px solid var(--border);
        border-radius: 50%;

        background: var(--surface);
        box-shadow: var(--shadow-card);

        transition:
            width 0.7s cubic-bezier(0.34, 1.3, 0.64, 1),
            height 0.7s cubic-bezier(0.34, 1.3, 0.64, 1),
            padding 0.7s cubic-bezier(0.34, 1.3, 0.64, 1),
            border-color var(--transition-fast),
            background var(--transition-fast),
            opacity var(--transition-fast);
    }

    .intro-mode .clock,
    .break-mode .clock {
        width: 180px;
        height: 180px;
        padding: 20px;
    }

    .clock:hover {
        border-color: var(--border-strong);
    }

    .clock svg {
        display: block;
        width: 100%;
        height: 100%;
    }

    .arc {
        fill: none;
        stroke: var(--primary);
        stroke-width: 5;
        stroke-linecap: round;
        opacity: 0.3;
        transition:
            1s stroke-dasharray linear,
            stroke var(--transition-fast);
    }

    .hand {
        stroke: var(--text);
        stroke-width: 5;
        stroke-linecap: round;
        transition:
            1s transform linear,
            stroke var(--transition-fast);
    }

    .pin {
        fill: var(--text-muted);
        transition: fill var(--transition-fast);
    }

    /* Frozen: the countdown is paused (inactivity, window blur or the
       settings menu) — an icy blue tint instead of the running look. */
    .clock.paused {
        border-color: var(--info-text);
        background: var(--info-bg);
    }

    .clock.paused:hover {
        border-color: var(--info-text);
        background: var(--info-hover);
    }

    .clock.paused .hand {
        stroke: var(--info-text);
    }

    .clock.paused .pin {
        fill: var(--info-text);
    }

    .clock.paused .arc {
        stroke: var(--info-text);
    }

    .clock.done .arc {
        stroke: var(--success-text);
        opacity: 0.35;
    }

    .clock.done .hand {
        stroke: var(--success-text);
    }

    /* Break mode: the clock stays red and the arc counts the cooldown
       counterclockwise (full → empty). */
    .break-mode .arc {
        stroke: var(--success-text);
        opacity: 0.35;
    }

    .break-mode .hand {
        stroke: var(--success-text);
    }

    .break-mode .pin {
        fill: var(--success-text);
    }

    .menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 45;

        border: 0;
        background: transparent;
    }

    .menu {
        position: absolute;
        top: 50%;
        left: calc(100% + 0.5rem);
        transform: translateY(-50%);
        z-index: 50;

        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        min-width: 11rem;
        padding: 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .menu-title {
        padding: 0.2rem 0.5rem 0.35rem;

        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .preset {
        padding: 0.5rem 0.65rem;
        border: 0;
        border-radius: var(--radius-md);

        background: transparent;

        font-size: 0.875rem;
        font-weight: 500;
        text-align: left;

        transition: background var(--transition-fast);
    }

    .preset:hover {
        background: var(--surface-hover);
    }

    .preset.active {
        background: var(--primary-soft);
        color: var(--primary);
        font-weight: 600;
    }

    .menu-status {
        margin-top: 0.3rem;
        padding: 0.5rem 0.5rem 0.15rem;

        border-top: 1px solid var(--border);

        color: var(--text-muted);
        font-size: 0.8rem;
        font-variant-numeric: tabular-nums;
    }

    .stop {
        margin-top: 0.15rem;
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--success-border);
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--success-text);

        font-size: 0.875rem;
        font-weight: 600;

        transition: background var(--transition-fast);
    }

    .stop:hover {
        background: var(--success-bg);
    }

    /* Mobile: the clock floats in the top-right corner, just below the
       header, over the progress bar row. The timer menu pops up centered
       in the viewport, unbound from the clock's position. */
    @media (max-width: 700px) {
        .clock-zone:not(.intro-mode):not(.break-mode) {
            left: auto;
            right: 0.75rem;
            top: calc(var(--header-h) + 0.6rem);
        }

        .menu {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);

            width: min(20rem, calc(100vw - 2rem));
        }
    }

    @media (max-width: 540px) {
        .clock-zone.intro-mode,
        .clock-zone.break-mode {
            left: 50%;
            /* top: 50%; */
        }

        /* Size comes from --clock-size (see app.css). */
        .clock {
            padding: 6px;
        }

        .intro-mode .clock,
        .break-mode .clock {
            width: 140px;
            height: 140px;
            padding: 16px;
        }
    }
</style>
