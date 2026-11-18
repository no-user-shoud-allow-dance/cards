<script lang="ts">
    import { resolve } from "$app/paths";
    import type { DeckType } from "#lib/core/deck/document";
    import { UI } from "#messages/locale.svelte";
    import Card from "#components/shared/ui/Card.svelte";
    import BoxStrip from "#components/learning/BoxStrip.svelte";
    import LanguageIcon from "#components/icons/LanguageIcon.svelte";
    import EyeOffIcon from "#components/icons/EyeOffIcon.svelte";
    import PinIcon from "#components/icons/PinIcon.svelte";

    let {
        slug,
        name,
        folder,
        deckType,
        learned,
        total,
        boxCounts,
        overviewCount = 0,
        pinned = false,
        onTogglePin,
        onHide,
    }: {
        slug: string;
        name: string;
        folder: string;
        deckType: DeckType;
        learned: number;
        total: number;
        /** Card count per Leitner box — rendered as the box strip (H5). */
        boxCounts: number[];
        /** Cards seen in the overview but never answered; boxCounts excludes them. */
        overviewCount?: number;
        /** Pinned decks keep their place in »Weiter lernen« and show the pin button. */
        pinned?: boolean;
        /** Unpins the deck; replaces the hide button when pinned. */
        onTogglePin?: () => void;
        /** Hides the deck from »Weiterlernen«; rendered only when present. */
        onHide?: () => void;
    } = $props();

    function hideFromContinue(event: MouseEvent): void {
        // The card root is a link — hiding must not navigate.
        event.preventDefault();
        event.stopPropagation();
        onHide?.();
    }

    function togglePin(event: MouseEvent): void {
        // The card root is a link — unpinning must not navigate.
        event.preventDefault();
        event.stopPropagation();
        onTogglePin?.();
    }
</script>

<Card href={resolve("/(deck)/cram/[slug]", { slug })} hover padding="md" class="continue-card">
    <div class="continue-body">
        <span class="continue-name">
            <span class="continue-folder">{folder}</span>
            {name}
        </span>
        <span class="continue-meta">
            <LanguageIcon type={deckType} />
            {UI.deckTypeLabel(deckType)}
        </span>
        <div class="continue-strip">
            <BoxStrip counts={boxCounts} {overviewCount} />
        </div>
        <span class="continue-count">{UI.learnedOf(learned, total)}</span>
        {#if pinned}
            <button
                type="button"
                class="action-button pinned"
                title={UI.unpin}
                aria-label="{UI.unpin}: {name}"
                aria-pressed="true"
                onclick={togglePin}
            >
                <PinIcon filled />
            </button>
        {:else if onHide}
            <button
                type="button"
                class="action-button"
                title={UI.hideFromContinue}
                aria-label="{UI.hideFromContinue}: {name}"
                onclick={hideFromContinue}
            >
                <EyeOffIcon />
            </button>
        {/if}
    </div>
</Card>

<style lang="postcss">
    /* Card provides border, radius, bg, shadow, hover, padding. Snippet
       content is scoped to this component; the only :global is the
       lang-icon size, anchored under this component's own .continue-meta. */

    /* Grid layout: the title spans the full first row, the language icon +
       type label line sits below it, then the box strip. The bottom row
       pairs the learned count (left) with the corner action (right):
       unpinned decks carry the hide button, pinned ones the pin button
       (hide would contradict the pin, so it is gone).
       5.3rem = the continue-card rhythm (7.5rem) minus Card's md
       padding (2 × 1.1rem); the 1fr bottom row pins both to the card
       floor. */
    .continue-body {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas:
            "name   name"
            "meta   meta"
            "strip  strip"
            "count  action";
        grid-template-rows: auto auto auto 1fr;
        align-items: center;

        column-gap: 0.6rem;
        row-gap: 0.55rem;

        min-height: 5.3rem;
    }

    /* H7: deck names take the serif — the Ordner list reads like a
       study book's table of contents. `hyphens: auto` wraps with real
       language hyphenation (browser dictionaries follow the <html lang>
       set by the locale); break-word only catches single tokens too
       long for any dictionary. */
    .continue-name {
        grid-area: name;
        hyphens: auto;
        overflow-wrap: break-word;
        font: var(--font-display);
        font-size: 1.08rem;
        line-height: 1.4;
    }

    .continue-folder {
        color: var(--text-muted);
        font-weight: 500;
    }

    .continue-meta {
        grid-area: meta;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;

        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 500;

        & :global(.lang-icon) {
            width: 1.15rem;
            height: 1.15rem;
        }
    }

    .continue-strip {
        grid-area: strip;
    }

    .continue-count {
        grid-area: count;
        align-self: end;

        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    /* Bottom-right corner: the action rides the card floor next to the
       count, aligned to the same base line. */
    .action-button {
        grid-area: action;
        align-self: end;
        justify-self: end;

        display: grid;
        place-items: center;

        width: 1.9rem;
        height: 1.9rem;
        padding: 0;
        margin-bottom: -0.25rem;

        border: 1px solid transparent;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text-muted);

        cursor: pointer;

        transition:
            color var(--transition-fast),
            background-color var(--transition-fast),
            transform var(--transition-spring);

        &:hover {
            color: var(--primary);
            background: var(--surface-hover);
        }

        &:active {
            transform: scale(1.18);
        }

        &.pinned {
            color: var(--primary);
        }
    }
</style>
