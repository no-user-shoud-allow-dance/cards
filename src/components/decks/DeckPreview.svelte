<script lang="ts">
    import type { Card as CoreCard, CardSide, DeckDocument } from "#lib/core/deck/document";
    import { serializeInlineSide } from "#lib/core/deck/inline";
    import type { FlashCard } from "#components/model/deckView";
    import CardList from "#components/decks/CardList.svelte";
    import DeckMeta from "#components/decks/DeckMeta.svelte";

    /**
     * Live preview of the deck being edited, rendered like the deck page
     * (routes/(deck)/deck/[slug]): the parsed DeckDocument is mapped to
     * FlashCards and shown through the same CardList inside a soft Card
     * panel. The editor route is the one surface that parses raw
     * markdown; everything here works on the DeckDocument model.
     */
    let { doc, pureMode = false }: { doc: DeckDocument | null; pureMode?: boolean } = $props();

    /** One card side back as raw markup (hint brackets + style delimiters). */
    function sideMarkup(card: CoreCard, side: CardSide): string {
        const hints = card.hints.filter((h) => h.side === side);
        return serializeInlineSide(card[side], hints);
    }

    const flashCards = $derived<FlashCard[]>(
        doc
            ? doc.cards.map((card, index) => ({
                  id: `${index}`,
                  cardId: card.id,
                  front: sideMarkup(card, "front"),
                  back: sideMarkup(card, "back"),
                  context: card.context ? serializeInlineSide(card.context) : undefined,
                  tags: [...card.tags],
                  hidden: card.hidden,
                  image: card.image,
                  // The preview shows unsaved content — no learning state.
                  state: null,
              }))
            : []
    );
</script>

<div class="deck-preview">
    {#if doc === null}
        <p class="preview-note">Die Vorschau erscheint, sobald der Stapel fehlerfrei ist.</p>
    {:else}
        <header class="preview-head">
            <h3 class="preview-title">{doc.title}</h3>
            <DeckMeta deckType={doc.type} cardCount={doc.cards.length} meta={doc.meta} />
        </header>
        {#if doc.cards.length === 0}
            <p class="preview-note">Dieser Stapel enthält keine Karten.</p>
        {:else}
            <!-- Same panel + list as the deck page's box overview. -->
            <!-- <Card class="preview-panel" padding="sm" bg="soft"> -->
            <CardList
                class="preview-list"
                variant="inverse"
                cards={flashCards}
                {pureMode}
                deckType={doc.type}
            />
            <!-- </Card> -->
        {/if}
    {/if}
</div>

<style lang="postcss">
    .deck-preview {
        flex: 1;
        min-height: 0;

        padding: 0.9rem 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: auto;

        scrollbar-width: thin;
    }

    .preview-head {
        margin-bottom: 0.75rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid var(--border);
    }

    .preview-title {
        margin: 0;

        font: var(--font-display);
        font-size: 1.15rem;
        line-height: 1.3;
        overflow-wrap: anywhere;
    }

    .preview-note {
        margin: 0;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    /* Card provides border, radius, bg-soft, padding — the rows inside
       keep their own surface background, like on the deck page. */
    :global(.preview-panel) {
        min-width: 0;
    }

    :global(.preview-list) {
        margin: 0;
    }
</style>
