<script lang="ts">
    import type { DeckMetaInfo } from "#components/model/deckView";
    import { UI } from "#messages/locale.svelte";
    import type { DeckType } from "#lib/core/deck/document";
    import LanguageIcon from "#components/icons/LanguageIcon.svelte";

    // One definition of "Stapel-Metadaten" for the deck page (DeckManager)
    // and the edit preview (DeckPreview).
    let {
        deckType,
        cardCount,
        meta,
    }: {
        deckType: DeckType;
        cardCount: number;
        meta: DeckMetaInfo;
    } = $props();
</script>

<dl class="deck-meta">
    <div class="meta-item">
        <dt>Sprache</dt>
        <dd>
            <span class="meta-language-icon"><LanguageIcon type={deckType} size={18} /></span>
            {UI.deckTypeLabel(deckType)}
        </dd>
    </div>
    <div class="meta-item">
        <dt>Anzahl</dt>
        <dd class:empty={cardCount === 0}>{UI.countCards(cardCount)}</dd>
    </div>
    {#if meta.author}
        <div class="meta-item">
            <dt>Autor</dt>
            <dd>{meta.author}</dd>
        </div>
    {/if}
    {#if meta.source}
        <div class="meta-item">
            <dt>Quelle</dt>
            <dd>{meta.source}</dd>
        </div>
    {/if}
    {#if meta.description}
        <div class="meta-item">
            <dt>Beschreibung</dt>
            <dd>{meta.description}</dd>
        </div>
    {/if}
</dl>

<style lang="postcss">
    .deck-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 1.5rem;

        margin: 0.5rem 0 0;
    }

    .meta-item {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;

        min-width: 0;
        margin: 0;

        & dt {
            color: var(--text-muted);
            font-size: var(--fs-2);
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        & dd {
            margin: 0;

            font-size: var(--fs-4);
            overflow-wrap: anywhere;

            & .meta-language-icon {
                display: inline-block;
                transform: translateY(4px);
            }
        }
    }

    /* A deck without cards is invalid editor state ("no card" is the
       first validation rule) — mark it like a spelling error: danger
       red with a wavy underline. */
    .meta-item dd.empty {
        color: var(--danger);
        text-decoration: underline wavy;
        text-decoration-color: var(--danger);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
    }
</style>
