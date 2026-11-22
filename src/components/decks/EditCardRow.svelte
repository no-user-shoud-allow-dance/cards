<script lang="ts">
    import { extractImages } from "#lib/core/deck/inline";
    import { UI } from "#messages/locale.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import MoonIcon from "#components/icons/MoonIcon.svelte";
    import CheckBox from "#components/shared/ui/CheckBox.svelte";
    import CardImages from "#components/shared/ui/CardImages.svelte";
    import SourceField from "#components/shared/ui/SourceField.svelte";
    import type { EditCard } from "#components/decks/DeckEditor.svelte";

    // One card of the DeckEditor table: the main row (checkbox, front,
    // back, actions) plus the meta row (context, tags, image token).
    // The card is bindable so the field bindings write straight back
    // into the editor's cards array.
    let {
        card = $bindable(),
        selected = false,
        onToggleSelect,
        onDelete,
    }: {
        card: EditCard;
        selected?: boolean;
        onToggleSelect: (id: number) => void;
        onDelete: (id: number) => void;
    } = $props();

    /** Thumbnails of a raw image token; invalid while typing → no thumb. */
    function imageThumbs(raw: string): { alt: string; url: string }[] {
        try {
            return extractImages(raw);
        } catch {
            return [];
        }
    }
</script>

<div class="cards-row" role="row">
    <span class="col-check" role="cell">
        <CheckBox
            checked={selected}
            onchange={() => onToggleSelect(card.id)}
            ariaLabel="Karte auswählen"
        />
    </span>
    <span class="col-front" role="cell">
        <SourceField bind:value={card.front} placeholder="Vorderseite" ariaLabel="Vorderseite" />
        <!-- Thumbnail preview: a broken image link is
             visible while writing. -->
        <CardImages images={imageThumbs(card.image)} variant="thumb" />
    </span>
    <span class="col-back" role="cell">
        <SourceField bind:value={card.back} placeholder="Rückseite" ariaLabel="Rückseite" />
    </span>
    <span class="col-actions" role="cell">
        <Button
            variant="moon"
            class={card.hidden ? "mooned" : ""}
            onclick={() => (card.hidden = !card.hidden)}
            aria-label={card.hidden ? UI.wake : UI.moonButton}
            title={card.hidden ? UI.wake : UI.moonButton}
        >
            <MoonIcon size={14} />
        </Button>
        <button
            type="button"
            class="row-delete"
            onclick={() => onDelete(card.id)}
            aria-label="Karte löschen"
            title="Karte löschen"
        >
            ×
        </button>
    </span>
</div>
<div class="cards-row meta-row" role="row">
    <span class="meta-cell" role="cell">
        <input
            class="meta-input"
            type="text"
            bind:value={card.context}
            placeholder="{UI.context} (::) – z. B. Beispielsatz"
            aria-label="{UI.context} der Karte"
        />
        <input
            class="meta-input tags-input"
            type="text"
            bind:value={card.tags}
            placeholder="{UI.tags} (#tag1 #tag2)"
            aria-label="{UI.tags} der Karte"
        />
        <input
            class="meta-input tags-input"
            type="text"
            bind:value={card.image}
            placeholder="Bild am Zeilenende: ![alt](https://…)"
            aria-label="Bild der Karte"
        />
    </span>
</div>

<style lang="postcss">
    .cards-row {
        display: grid;
        grid-template-columns: 2.2rem 1fr 1fr 2.2rem;
        align-items: center;
        gap: 0.5rem;

        padding: 0.4rem 0.75rem;

        /* Every card row (main + meta) carries its own top border, so
           the first row also separates from the table head. */
        border-top: 1px solid var(--border);
    }

    .col-check {
        display: flex;
        justify-content: center;
    }

    /* The cell holds the text input plus thumbnails of the side's images. */
    .col-front,
    .col-back {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
    }

    /* The source fields style themselves (see SourceField). */
    .col-front :global(.source-field),
    .col-back :global(.source-field) {
        width: 100%;
    }

    /* Actions cell: moon toggle above the delete button. */
    .col-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    /* Per-card meta row: context (flex) + tags input, aligned under the
       front column. */
    .meta-row {
        grid-template-columns: 1fr;
        padding-top: 0;
    }

    .meta-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        padding-left: 2.7rem;
    }

    .meta-input {
        flex: 1;
        min-width: 10rem;

        font: inherit;
        font-size: var(--fs-3);

        padding: 0.35rem 0.55rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface-soft);
        color: var(--text);

        &:focus {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
            background: var(--surface);
        }
    }

    .tags-input {
        flex: 0 1 12rem;
    }

    .row-delete {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 1.8rem;
        height: 1.8rem;
        margin: 0 auto;

        border: 0;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text-muted);

        font-size: 1.1rem;
        line-height: 1;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &:hover {
            background: var(--danger-bg);
            color: var(--danger-text);
        }
    }

    @media (max-width: 700px) {
        .cards-row {
            grid-template-columns: 2rem 1fr 2rem;
            grid-template-areas:
                "check front actions"
                "check back actions";
            row-gap: 0.3rem;
        }

        .col-check {
            grid-area: check;
        }

        .col-front {
            grid-area: front;
        }

        .col-back {
            grid-area: back;
        }

        .col-actions {
            grid-area: actions;
        }

        .meta-cell {
            padding-left: 0;
        }
    }
</style>
