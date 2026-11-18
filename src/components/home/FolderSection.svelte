<script lang="ts">
    import { fade } from "svelte/transition";
    import type { DeckType } from "#lib/core/deck/document";
    import SectionLabel from "#components/shared/ui/SectionLabel.svelte";
    import DeckCard from "#components/home/DeckCard.svelte";

    interface DeckInfo {
        slug: string;
        name: string;
        count: number;
        deckType: DeckType;
        pinned: boolean;
        excluded: boolean;
        draft: boolean;
    }

    let {
        folder,
        decks,
        onTogglePin,
        opened = false,
        onToggle,
    }: {
        folder: string;
        decks: DeckInfo[];
        onTogglePin: (slug: string) => void;
        /** Expansion state — persisted by the caller (kk-folders). */
        opened?: boolean;
        onToggle: () => void;
    } = $props();
</script>

<section class="folder">
    <SectionLabel>
        <button
            type="button"
            class="folder-toggle"
            aria-expanded={opened}
            aria-controls="folder-{folder}"
            onclick={onToggle}
        >
            <span class="folder-title">{folder} · {decks.length} Stapel</span>
            <span class="folder-chevron" class:closed={!opened} aria-hidden="true">▾</span>
        </button>
    </SectionLabel>
    {#if opened}
        <div
            class="deck-grid"
            id="folder-{folder}"
            in:fade={{ duration: 150 }}
            out:fade={{ duration: 150 }}
        >
            {#each decks as deck (deck.slug)}
                <DeckCard
                    slug={deck.slug}
                    name={deck.name}
                    count={deck.count}
                    deckType={deck.deckType}
                    pinned={deck.pinned}
                    excluded={deck.excluded}
                    draft={deck.draft}
                    onTogglePin={() => onTogglePin(deck.slug)}
                />
            {/each}
        </div>
    {/if}
</section>

<style lang="postcss">
    .folder {
        margin-top: 1.75rem;
    }

    .folder-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;

        width: 100%;
        padding: 0;
        border: 0;

        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;

        cursor: pointer;

        &:hover .folder-title {
            color: var(--text);
        }

        &:hover .folder-chevron {
            color: var(--primary);
        }
    }

    .folder-title {
        min-width: 0;
        hyphens: auto;
        overflow-wrap: break-word;
    }

    .folder-chevron {
        flex: 0 0 auto;

        color: var(--text-muted);
        font-size: var(--fs-2);

        transition:
            transform var(--transition-fast),
            color var(--transition-fast);

        &.closed {
            transform: rotate(-90deg);
        }
    }

    /* Gallery instead of a grid: CSS columns place the cards in three
       masonry columns; each card keeps its natural (possibly different)
       height and rows never align across columns. Cards are child
       component roots, hence the anchored :global. */
    .deck-grid {
        columns: 3;
        column-gap: 0.8rem;

        & :global(.deck-card) {
            break-inside: avoid;
            margin-bottom: 0.8rem;
        }
    }

    @media (max-width: 900px) {
        .deck-grid {
            columns: 2;
        }
    }

    @media (max-width: 540px) {
        .deck-grid {
            columns: 1;
        }
    }
</style>
