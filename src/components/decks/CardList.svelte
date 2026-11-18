<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { displayFront, displayBack } from "#components/model/display";
    import { UI } from "#messages/locale.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import Chip from "#components/shared/ui/Chip.svelte";
    import MoonIcon from "#components/icons/MoonIcon.svelte";
    import ArrowRightIcon from "#components/icons/ArrowRightIcon.svelte";
    import CardImages from "#components/shared/ui/CardImages.svelte";
    import RichText from "#components/shared/ui/RichText.svelte";
    import type { CardImage, DeckType } from "#lib/core/deck/document";
    import type { FlashCard } from "#components/model/deckView";

    // `class` arrives via rest and is merged into the class expression; other
    // attributes fall through to the <ul> via {...rest}.
    let {
        variant = "straight",
        cards,
        pureMode,
        deckType,
        onToggleMoon,
        ...rest
    }: {
        variant?: "straight" | "inverse";
        cards: FlashCard[];
        pureMode: boolean;
        deckType: DeckType;
        /** Moon button per row: toggles the card's trailing `*`. */
        onToggleMoon?: (card: FlashCard) => void;
    } & HTMLAttributes<HTMLUListElement> = $props();

    // The card's image (trailing `![alt](url)` field) renders once per row.
    const imagesOf = (card: FlashCard): CardImage[] => (card.image ? [card.image] : []);
</script>

<ul {...rest} class={["card-list", rest.class]}>
    {#each cards as card (card.id)}
        <li class={[variant, card.hidden ? "hidden" : "", onToggleMoon ? "with-moon" : ""]}>
            <span class="front"><RichText text={displayFront(card, pureMode, deckType)} /></span>
            <span class="sep"><ArrowRightIcon size={14} /></span>
            <span class="back"><RichText text={displayBack(card, pureMode)} /></span>
            {#if onToggleMoon}
                <span class="row-end">
                    <Button
                        variant="moon"
                        class={card.hidden ? "mooned" : ""}
                        onclick={() => onToggleMoon(card)}
                        aria-label={card.hidden ? UI.wake : UI.moonButton}
                        title={card.hidden ? UI.wake : UI.moonButton}
                    >
                        <MoonIcon size={13} />
                    </Button>
                </span>
            {/if}
            {#if card.image}
                <span class="media"><CardImages images={imagesOf(card)} variant="thumb" /></span>
            {/if}
            {#if card.context}
                <span class="context">:: <RichText text={card.context} /></span>
            {/if}
            {#if card.tags.length > 0}
                <span class="tags">
                    {#each card.tags as tag (tag)}
                        <Chip tone="folder" size="sm">#{tag}</Chip>
                    {/each}
                </span>
            {/if}
        </li>
    {/each}
</ul>

<style lang="postcss">
    .card-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        margin: 1rem 0;
        padding: 0;
        list-style: none;

        & .sep {
            flex: 0 0 auto;
            color: var(--text-muted);
            font-size: var(--fs-4);
        }
    }

    /* Grid rows: front | arrow | back | moon (4 columns with a moon
       toggle, 2 without — the arrow hides); image, context and tags
       span a full-width sub-row below the main row. */
    .card-list li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.35rem 0.65rem;

        min-width: 0;
        padding: 0.8rem 0.9rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);

        transition: border-color var(--transition-fast);

        cursor: default;
    }

    .card-list li:not(.with-moon) {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    .card-list li:not(.with-moon) .sep {
        display: none;
    }

    .card-list li.straight {
        background: var(--surface);
        border-color: var(--border);
    }

    .card-list li.inverse {
        background: var(--bg);
        border-color: var(--border);
    }

    .card-list li:hover {
        border-color: var(--border-strong);
    }

    /* H7: the words being learned take the serif. */
    .card-list .front {
        font: var(--font-display);
        overflow-wrap: anywhere;
        /* Multi-line card sides render with their line breaks. */
        white-space: pre-wrap;
    }

    .card-list .back {
        min-width: 0;
        color: var(--text-muted);
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    /* Full-width sub-rows below the main front/arrow/back row. */
    .card-list .media,
    .card-list .context,
    .card-list .tags {
        grid-column: 1 / -1;
    }

    .card-list .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    .card-list .context {
        color: var(--text-muted);
        font-size: var(--fs-3);
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    .card-list li.hidden {
        opacity: 0.65;
    }

    /* Moon toggle sits at the row's right edge. */
    .card-list .row-end {
        display: inline-flex;
        align-items: center;
        justify-self: end;
    }

    /* Phones: the row collapses to a stack — front over the (rotated)
       arrow over back, moon toggle on its own full-width row. */
    @media (max-width: 540px) {
        .card-list li {
            grid-template-columns: minmax(0, 1fr);
            padding: 0.75rem;
        }

        .card-list .sep {
            justify-self: center;
            transform: rotate(90deg);
        }

        .card-list .row-end {
            grid-column: 1 / -1;
        }
    }
</style>
