<script lang="ts">
    import { UI } from "#messages/locale.svelte";

    // One box-strip motif (H5) for every progress display: a compact
    // proportional strip, or the tall labeled variant (the former
    // BoxOverview). Segment colors come from the --box-N tokens (H1).
    let {
        counts,
        currentBox,
        variant = "strip",
        animate = false,
        overviewCount = 0,
    }: {
        /** Card count per box; index 0 = box 1 … index BOX_COUNT-1 = learned. */
        counts: number[];
        /** Box of the card currently being studied (ring highlight). */
        currentBox?: number;
        variant?: "strip" | "labeled";
        /** Fill from 0 on mount over ~1.5s (session-complete, H6). */
        animate?: boolean;
        /**
         * Cards seen in the overview but never answered — a leading
         * `--overview` segment (strip variant). The caller's `counts`
         * must already exclude them from box 1.
         */
        overviewCount?: number;
    } = $props();

    const overview = $derived(variant === "strip" ? overviewCount : 0);
    const total = $derived(counts.reduce((sum, n) => sum + n, 0) + overview);

    // With `animate`, widths start at 0 and grow on mount; the global
    // reduced-motion rule snaps the transition to the final state.
    let mounted = $state(false);

    $effect(() => {
        if (!animate) return;
        const frame = requestAnimationFrame(() => (mounted = true));
        return () => cancelAnimationFrame(frame);
    });

    function widthPct(count: number): string {
        if (animate && !mounted) return "0%";
        return total > 0 ? `${(count / total) * 100}%` : "0%";
    }
</script>

<div
    class="box-strip"
    class:labeled={variant === "labeled"}
    class:animate
    role="list"
    aria-label={UI.boxCountsAria}
>
    {#if overview > 0}
        <div
            class="box-strip-segment overview"
            role="listitem"
            aria-label="{UI.overviewSeen}: {UI.countCards(overview)}"
            style:width={widthPct(overview)}
        ></div>
    {/if}
    {#each counts as count, i (i)}
        {@const box = i + 1}
        <div
            class="box-strip-segment box-{box}"
            class:empty={count === 0}
            class:current={box === currentBox}
            role="listitem"
            aria-label="{UI.box} {UI.boxLabel(box)}: {UI.countCards(count)}"
            style:width={variant === "strip" ? widthPct(count) : undefined}
        >
            {#if variant === "labeled"}
                <span class="seg-label">{UI.boxLabel(box)}</span>
                <span class="seg-count">{count}</span>
            {/if}
        </div>
    {/each}
</div>

<style lang="postcss">
    /* Strip variant: one proportional bar, segments in their box color. */
    .box-strip {
        display: flex;
        gap: 2px;

        height: 6px;
        border-radius: var(--radius-pill);
    }

    .box-strip-segment {
        height: 100%;
        min-width: 0;
        border-radius: var(--radius-pill);

        &.empty {
            background: var(--surface-soft);
        }

        /* Overview-seen, never answered — the leading segment. */
        &.overview {
            background: var(--overview);
        }

        &.box-1:not(.empty) {
            background: var(--box-1);
        }
        &.box-2:not(.empty) {
            background: var(--box-2);
        }
        &.box-3:not(.empty) {
            background: var(--box-3);
        }
        &.box-4:not(.empty) {
            background: var(--box-4);
        }
        &.box-5:not(.empty) {
            background: var(--box-5);
        }
        &.box-6:not(.empty) {
            background: var(--box-6);
        }

        &.current {
            outline: 2px solid var(--focus-ring);
            outline-offset: 1px;
        }
    }

    /* Strip variant: segment widths track the counts. */
    .box-strip:not(.labeled) .box-strip-segment {
        transition: width var(--transition-normal);
    }

    /* Animated fill (session complete, H6): slow 1.5s fill; the global
       reduced-motion rule snaps it to the final state. */
    .box-strip.animate:not(.labeled) .box-strip-segment {
        transition-duration: 1.5s;
    }

    /* Labeled variant: tall segments with numeral + count, tinted per box. */
    .box-strip.labeled {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.35rem;

        height: auto;

        & .box-strip-segment {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.1rem;

            min-height: 3rem;
            padding: 0.4rem 0.3rem;

            border: 1px solid transparent;
            border-radius: var(--radius-md);

            background: var(--surface);
            transition:
                border-color var(--transition-fast),
                background var(--transition-fast);
        }
    }

    .box-strip.labeled .box-strip-segment.box-1 {
        background: var(--box-1-soft);
    }
    .box-strip.labeled .box-strip-segment.box-2 {
        background: var(--box-2-soft);
    }
    .box-strip.labeled .box-strip-segment.box-3 {
        background: var(--box-3-soft);
    }
    .box-strip.labeled .box-strip-segment.box-4 {
        background: var(--box-4-soft);
    }
    .box-strip.labeled .box-strip-segment.box-5 {
        background: var(--box-5-soft);
    }
    .box-strip.labeled .box-strip-segment.box-6 {
        background: var(--box-6-soft);
    }

    .box-strip.labeled .box-strip-segment.current {
        outline: none;
        border-color: var(--box-1);
    }

    .box-strip.labeled .box-strip-segment.current.box-1 {
        border-color: var(--box-1);
    }
    .box-strip.labeled .box-strip-segment.current.box-2 {
        border-color: var(--box-2);
    }
    .box-strip.labeled .box-strip-segment.current.box-3 {
        border-color: var(--box-3);
    }
    .box-strip.labeled .box-strip-segment.current.box-4 {
        border-color: var(--box-4);
    }
    .box-strip.labeled .box-strip-segment.current.box-5 {
        border-color: var(--box-5);
    }
    .box-strip.labeled .box-strip-segment.current.box-6 {
        border-color: var(--box-6);
    }

    .seg-label {
        color: var(--text-muted);
        font-size: var(--fs-1);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        line-height: 1.2;
    }

    .box-strip.labeled .box-strip-segment.box-1 .seg-label {
        color: var(--box-1);
    }
    .box-strip.labeled .box-strip-segment.box-2 .seg-label {
        color: var(--box-2);
    }
    .box-strip.labeled .box-strip-segment.box-3 .seg-label {
        color: var(--box-3);
    }
    .box-strip.labeled .box-strip-segment.box-4 .seg-label {
        color: var(--box-4);
    }
    .box-strip.labeled .box-strip-segment.box-5 .seg-label {
        color: var(--box-5);
    }
    .box-strip.labeled .box-strip-segment.box-6 .seg-label {
        color: var(--box-6);
    }

    .seg-count {
        color: var(--text);
        font-size: var(--fs-5);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1.2;
    }

    @media (max-width: 540px) {
        .box-strip.labeled .box-strip-segment {
            min-height: 2.6rem;
            padding: 0.3rem 0.2rem;
        }

        .seg-label {
            font-size: 0.6rem;
        }

        .seg-count {
            font-size: var(--fs-4);
        }
    }
</style>
