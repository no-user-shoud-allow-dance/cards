<script lang="ts">
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";

    let {
        learnedCount,
        totalCards,
        progressRatio,
    }: {
        learnedCount: number;
        totalCards: number;
        progressRatio: number;
    } = $props();
</script>

<div class="status-footer">
    <span class="status-learned">{learnedCount} / {totalCards} gelernt</span>
    <span class="status-bar-wrap">
        <ProgressBar ratio={progressRatio} />
    </span>
</div>

<style>
    .status-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status-learned {
        flex: 0 0 auto;

        color: var(--text-muted);
        font-size: 0.8rem;
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
