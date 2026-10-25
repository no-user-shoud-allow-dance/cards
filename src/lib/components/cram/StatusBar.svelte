<script lang="ts">
    import { countCards } from "#lib/utils/pure";
    import ProgressBar from "../shared/ProgressBar.svelte";

    const BOX_LABELS = ["I", "II", "III", "IV", "V", "Gelernt"];

    let {
        boxCounts,
        currentBox,
        learnedCount,
        totalCards,
        progressRatio,
    }: {
        boxCounts: number[];
        currentBox: number;
        learnedCount: number;
        totalCards: number;
        progressRatio: number;
    } = $props();
</script>

<div class="status">
    <div class="box-overview" role="list" aria-label="Karten pro Box">
        {#each boxCounts as count, i (i)}
            {@const box = i + 1}
            <div
                class="box-segment"
                class:current={box === currentBox}
                role="listitem"
                aria-label="Box {BOX_LABELS[i]}: {countCards(count)}"
            >
                <span class="box-label">{BOX_LABELS[i]}</span>
                <span class="box-count">{count}</span>
            </div>
        {/each}
    </div>

    <div class="status-footer">
        <span class="status-learned">{learnedCount} / {totalCards} gelernt</span>
        <span class="status-bar-wrap">
            <ProgressBar ratio={progressRatio} />
        </span>
    </div>
</div>

<style>
    .status {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .box-overview {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.35rem;
    }

    .box-segment {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.1rem;

        min-width: 0;
        min-height: 3rem;
        padding: 0.4rem 0.3rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .box-segment.current {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .box-label {
        color: var(--text-muted);
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        line-height: 1.2;
    }

    .box-segment.current .box-label {
        color: var(--text);
    }

    .box-count {
        font-size: 1rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1.2;
    }

    .box-segment.current .box-count {
        color: var(--primary);
    }

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

    @media (max-width: 540px) {
        .box-segment {
            min-height: 2.6rem;
            padding: 0.3rem 0.2rem;
        }

        .box-label {
            font-size: 0.6rem;
        }

        .box-count {
            font-size: 0.9rem;
        }
    }
</style>
