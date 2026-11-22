<script lang="ts">
    import { resolve } from "$app/paths";
    import type { DeckType } from "#lib/core/deck/document";
    import Card from "#components/shared/ui/Card.svelte";
    import Chip from "#components/shared/ui/Chip.svelte";
    import LanguageIcon from "#components/icons/LanguageIcon.svelte";
    import PinIcon from "#components/icons/PinIcon.svelte";
    import EyeOffIcon from "#components/icons/EyeOffIcon.svelte";
    import { UI } from "#messages/locale.svelte";

    let {
        slug,
        name,
        count,
        deckType,
        pinned = false,
        excluded = false,
        draft = false,
        onTogglePin,
    }: {
        slug: string;
        name: string;
        count: number;
        deckType: DeckType;
        pinned?: boolean;
        excluded?: boolean;
        /** Drafts preview on /(deck)/draft/[slug] and cannot be pinned. */
        draft?: boolean;
        onTogglePin?: () => void;
    } = $props();

    function togglePin(event: MouseEvent): void {
        // The card root is a link — pinning must not navigate.
        event.preventDefault();
        event.stopPropagation();
        onTogglePin?.();
    }
</script>

<Card
    href={resolve(draft ? "/(deck)/draft/[slug]" : "/(deck)/deck/[slug]", { slug })}
    hover
    padding="md"
    class="deck-card"
>
    <div class="deck-body">
        <span class="deck-name">{name}</span>
        <span class="deck-meta">
            <LanguageIcon type={deckType} />
            {UI.deckTypeLabel(deckType)}
            {#if excluded}
                <Chip tone="moon" size="sm">
                    <EyeOffIcon filled={true} size={15} />
                </Chip>
            {/if}
        </span>
        <span class="deck-count" class:empty={count === 0}>{UI.countCards(count)}</span>
        {#if !draft && onTogglePin}
            <button
                type="button"
                class="pin-button"
                class:pinned
                title={pinned ? UI.unpin : UI.pin}
                aria-label="{pinned ? UI.unpin : UI.pin}: {name}"
                aria-pressed={pinned}
                onclick={togglePin}
            >
                <PinIcon filled={pinned} />
            </button>
        {/if}
    </div>
</Card>

<style lang="postcss">
    /* Card provides border, radius, bg, shadow, hover, padding. Snippet
       content is scoped to this component; the :globals are anchored
       under this component's own .deck-* classes. */

    /* Grid layout on the ContinueCard example (minus the box strip): the
       title spans the full first row, the language icon + type label
       line sits below it, and the 1fr bottom row pairs the card count
       (left) with the pin button (right) on the card floor. */
    .deck-body {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas:
            "name name"
            "meta meta"
            "count pin";
        grid-template-rows: auto auto 1fr;
        align-items: center;

        column-gap: 0.6rem;
        row-gap: 0.3rem;
    }

    /* H7: deck names take the serif — the folder list reads like a
       study book's table of contents. `hyphens: auto` wraps with real
       language hyphenation (browser dictionaries follow the <html lang>
       set by the locale); break-word only catches single tokens too
       long for any dictionary. */
    .deck-name {
        grid-area: name;
        hyphens: auto;
        overflow-wrap: break-word;
        font: var(--font-display);
        font-size: 1.08rem;
        line-height: 1.4;
    }

    .deck-meta {
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

    .deck-count {
        grid-area: count;
        align-self: end;

        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    /* A deck without cards is invalid editor state — mark it like a
       spelling error. Mirrors DeckMeta's .meta-item dd.empty. */
    .deck-count.empty {
        color: var(--danger);
        text-decoration: underline wavy;
        text-decoration-color: var(--danger);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
    }

    /* Bottom-right corner: the pin action rides the card floor next to
       the count, aligned to the same base line. */
    .pin-button {
        grid-area: pin;
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
