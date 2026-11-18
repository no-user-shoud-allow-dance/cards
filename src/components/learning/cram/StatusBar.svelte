<script lang="ts">
    import BoxStrip from "#components/learning/BoxStrip.svelte";
    import { UI } from "#messages/locale.svelte";

    let {
        learnedCount,
        totalCards,
        boxCounts,
    }: {
        learnedCount: number;
        totalCards: number;
        /** Card count per Leitner box — the compact box strip (H5). */
        boxCounts: number[];
    } = $props();
</script>

<div class="status-footer">
    <span class="status-learned">{UI.learnedOf(learnedCount, totalCards)}</span>
    <span class="status-bar-wrap">
        <BoxStrip counts={boxCounts} />
    </span>
</div>

<style lang="postcss">
    .status-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status-learned {
        flex: 0 0 auto;

        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .status-bar-wrap {
        display: block;
        flex: 1 1 auto;
    }

    /* Mobile: the clock floats over the right end of this row — keep
       the progress bar clear of it. */
    @media (max-width: 700px) {
        .status-footer {
            padding-right: 5rem;
        }
    }
</style>
