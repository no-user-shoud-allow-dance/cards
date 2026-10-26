<script lang="ts">
    import { BOX_LABELS } from "#lib/utils/types";
    import { countCards } from "#lib/utils/pure";

    let {
        boxCounts,
        currentBox,
    }: {
        boxCounts: number[];
        currentBox: number;
    } = $props();

    const mobileQuery = window.matchMedia("(max-width: 700px)");
    let isMobile = $state(mobileQuery.matches);
</script>

<div class="box-overview" role="list" aria-label="Karten pro Box">
    {#each boxCounts as count, i (i)}
        {@const box = i + 1}
        <div
            class="box-segment"
            class:current={box === currentBox}
            class:learned={box === BOX_LABELS.length}
            role="listitem"
            aria-label="Box {BOX_LABELS[i]}: {countCards(count)}"
        >
            {#if !isMobile}
                <span class="box-label">{BOX_LABELS[i]}</span>
            {/if}
            <span class="box-count">{count}</span>
        </div>
    {/each}
</div>

<style>
    /* Sits above the progress row on desktop and above the controls
       on mobile — the gap works for both placements. */
    .box-overview {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.35rem;

        margin-bottom: 0.6rem;
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

    .box-segment.learned {
        background: var(--success-hover);
        color: var(--success);
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

    @media (max-width: 540px) {
        .box-overview {
            margin-top: 0.6rem;
        }

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
