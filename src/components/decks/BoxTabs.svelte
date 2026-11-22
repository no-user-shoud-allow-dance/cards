<script lang="ts">
    import { BOX_COUNT } from "#lib/core/learning/leitner";
    import type { FlashCard } from "#components/model/deckView";

    export interface BoxGroup {
        box: number;
        label: string;
        cards: FlashCard[];
        /** Moon box: the label is hidden (aria-label only), count shows alone. */
        moon?: boolean;
    }

    let {
        groups,
        activeBox = $bindable(1),
    }: {
        groups: BoxGroup[];
        activeBox?: number;
    } = $props();
</script>

<div class="box-tabs" role="tablist">
    {#each groups as group (group.box)}
        <button
            class="box-tab box-{group.box}"
            class:active={activeBox === group.box}
            class:learned={BOX_COUNT === group.box}
            class:moon={group.moon === true}
            role="tab"
            aria-label={group.label}
            aria-selected={activeBox === group.box}
            onclick={() => {
                if (group.moon !== true) {
                    activeBox = group.box;
                }
            }}
        >
            {#if !group.moon}
                <span class="box-label">{group.label}</span>
            {/if}
            <span class="box-count">{group.cards.length}</span>
        </button>
    {/each}
</div>

<style lang="postcss">
    /* H13: the tab row is the open card box — one container, compartments
       divided by hairlines instead of separate pills. */
    .box-tabs {
        display: flex;
        gap: 0;

        margin-bottom: 1rem;
        padding: 0.3rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface-soft);
    }

    .box-tab {
        position: relative;

        display: inline-flex;
        flex: 1 1 0;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-width: 0;
        min-height: 2.65rem;
        padding: 0.5rem 0.8rem;

        border: 0;
        border-left: 1px solid var(--border);
        border-radius: 0;

        background: transparent;
        color: var(--text-muted);

        font-size: var(--fs-3);
        font-weight: 600;
        white-space: nowrap;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &:first-child {
            border-left: 0;
        }

        &:not(.active):hover {
            background: var(--surface-hover);
            color: var(--text);
        }

        &.active::before {
            content: "";
            position: absolute;
            left: 0.3rem;
            top: 22%;
            bottom: 22%;
            width: 3px;

            border-radius: var(--radius-pill);
            background: var(--tab-color, var(--primary));
        }

        &.moon::before {
            content: "☾";
            color: var(--stone-text);
            font-size: var(--fs-3);
        }

        &.moon:hover {
            background: transparent;
            color: var(--stone-text);
        }

        &.moon .box-count {
            background: var(--stone-border);
            color: var(--stone-text);
        }

        &.active .box-count {
            background: var(--tab-color-soft, var(--surface-soft));
            color: var(--tab-color, inherit);
        }

        &.box-1.active .box-count {
            --tab-color-soft: var(--box-1-soft);
        }
        &.box-2.active .box-count {
            --tab-color-soft: var(--box-2-soft);
        }
        &.box-3.active .box-count {
            --tab-color-soft: var(--box-3-soft);
        }
        &.box-4.active .box-count {
            --tab-color-soft: var(--box-4-soft);
        }
        &.box-5.active .box-count {
            --tab-color-soft: var(--box-5-soft);
        }
        &.box-6.active .box-count {
            --tab-color-soft: var(--box-6-soft);
        }
    }

    /* Per-box tick color (H1 tokens). */
    .box-tab.box-1 {
        --tab-color: var(--box-1);
    }
    .box-tab.box-2 {
        --tab-color: var(--box-2);
    }
    .box-tab.box-3 {
        --tab-color: var(--box-3);
    }
    .box-tab.box-4 {
        --tab-color: var(--box-4);
    }
    .box-tab.box-5 {
        --tab-color: var(--box-5);
    }
    .box-tab.box-6 {
        --tab-color: var(--box-6);
    }

    /* The active compartment is raised out of the box and carries its
       box color as a tick on the left edge. */
    .box-tab.active {
        border-left-color: transparent;
        border-radius: var(--radius-md);

        background: var(--surface);
        box-shadow: var(--shadow-sm);
        color: var(--tab-color, var(--text));
    }

    /* The moon compartment: stone tones, crescent glyph, narrower. */
    .box-tab.moon {
        flex: 0 0 auto;
        padding-inline: 0.55rem;
        cursor: default;
        color: var(--stone-text);
    }

    .box-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-width: 1.35rem;
        height: 1.35rem;
        padding: 0 0.35rem;

        border-radius: var(--radius-sm);
        background: var(--surface);
        color: var(--text-muted);

        font-size: var(--fs-2);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    @media (max-width: 540px) {
        .box-tabs {
            margin-inline: -0.1rem;
        }

        .box-tab {
            min-height: 2.5rem;
            padding-inline: 0.4rem;
            font-size: var(--fs-2);
        }
    }
</style>
