<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { displayFront, displayBack } from "#lib/utils/pure";
    import CardImages from "#lib/components/shared/ui/CardImages.svelte";
    import RichText from "#lib/components/shared/ui/RichText.svelte";
    import type { CardImage, DeckType, FlashCard } from "#lib/types";

    // `class` arrives via rest and is merged into the class expression; other
    // attributes fall through to the <ul> via {...rest}.
    let {
        cards,
        pureMode,
        deckType,
        ...rest
    }: {
        cards: FlashCard[];
        pureMode: boolean;
        deckType: DeckType;
    } & HTMLAttributes<HTMLUListElement> = $props();

    const frontImages = (card: FlashCard): CardImage[] =>
        card.images.filter((image) => image.side === "front");

    const backImages = (card: FlashCard): CardImage[] =>
        card.images.filter((image) => image.side === "back");
</script>

<ul {...rest} class={["card-list", rest.class]}>
    {#each cards as card (card.id)}
        <li>
            <CardImages images={frontImages(card)} variant="thumb" />
            <span class="front"
                ><RichText text={displayFront(card, pureMode, deckType)} /></span
            >
            <span class="sep">→</span>
            <span class="back"
                ><RichText text={displayBack(card, pureMode)} /></span
            >
            <CardImages images={backImages(card)} variant="thumb" />
        </li>
    {/each}
</ul>

<style>
    .card-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        margin: 1rem 0;
        padding: 0;
        list-style: none;
    }

    .card-list li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem 0.65rem;

        min-width: 0;
        padding: 0.8rem 0.9rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);

        transition: border-color var(--transition-fast);
    }

    .card-list li:hover {
        border-color: var(--border-strong);
    }

    .card-list .front {
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .card-list .sep {
        flex: 0 0 auto;
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .card-list .back {
        min-width: 0;
        color: var(--text-muted);
        overflow-wrap: anywhere;
    }

    @media (max-width: 540px) {
        .card-list li {
            padding: 0.75rem;
        }
    }
</style>
