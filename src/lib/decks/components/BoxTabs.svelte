<script lang="ts">
    import { BOX_LABELS, type Card } from "#lib/utils/types";

    export interface BoxGroup {
        box: number;
        label: string;
        cards: Card[];
    }

    let {
        groups,
        activeBox,
        onSelect,
    }: {
        groups: BoxGroup[];
        activeBox: number;
        onSelect: (box: number) => void;
    } = $props();
</script>

<div class="box-tabs" role="tablist">
    {#each groups as group (group.box)}
        <button
            class="box-tab"
            class:active={activeBox === group.box}
            class:learned={BOX_LABELS.length === group.box}
            role="tab"
            aria-selected={activeBox === group.box}
            onclick={() => onSelect(group.box)}
        >
            {group.label}
            <span class="box-count">{group.cards.length}</span>
        </button>
    {/each}
</div>

<style>
    .box-tabs {
        display: flex;
        gap: 0.4rem;

        margin-bottom: 1rem;
        padding: 0.15rem 0.1rem 0.4rem;
    }

    .box-tab {
        display: inline-flex;
        flex: 1 1 0;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-width: 0;
        min-height: 2.65rem;
        padding: 0.5rem 0.8rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text-muted);

        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .box-tab:not(.active):hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        color: var(--text);
    }

    /* All boxes share one color scheme; only the selected tab is highlighted. */

    .box-tab.active {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--primary);
        font-weight: 600;
    }

    .box-tab.learned .box-count {
        background: var(--success-hover);
        color: var(--success-text);
    }

    .box-tab.learned.active {
        border-color: var(--success-text);
        background: var(--success-hover);
        color: var(--success-text);
        font-weight: 600;
    }

    .box-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-width: 1.35rem;
        height: 1.35rem;
        padding: 0 0.35rem;

        border-radius: var(--radius-sm);
        background: var(--surface-soft);
        color: var(--text-muted);

        font-size: 0.75rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .box-tab.active .box-count {
        background: rgb(127 127 127 / 12%);
        color: inherit;
    }

    @media (max-width: 540px) {
        .box-tabs {
            margin-inline: -0.1rem;
        }

        .box-tab {
            min-height: 2.5rem;
            padding-inline: 0.4rem;
            font-size: 0.78rem;
        }
    }
</style>
