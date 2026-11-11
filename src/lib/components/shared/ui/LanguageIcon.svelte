<script lang="ts">
    import type { DeckType } from "#lib/types";
    import { DECK_TYPES } from "#lib/utils/deckTypes";

    /**
     * Alphabet icon for a deck type on a plain rounded rect: sigma (greek),
     * Q for SPQR (latin), A (english). Background and glyph colors come from
     * the per-language --lang-* custom properties in app.css, selected via
     * the type class on the svg.
     */
    let { type }: { type: DeckType } = $props();

    const LETTERS: Record<DeckType, string> = {
        greek: "Σ",
        latin: "Q",
        english: "A",
    };
</script>

<svg
    class="lang-icon {type}"
    viewBox="0 0 32 32"
    role="img"
    aria-label={DECK_TYPES[type].label}
    focusable="false"
>
    <rect class="lang-icon-bg" x="1" y="1" width="30" height="30" rx="8" />
    <text
        class="lang-icon-glyph"
        x="16"
        y="22.3"
        text-anchor="middle"
        font-size="18"
        font-weight="700">{LETTERS[type]}</text
    >
</svg>

<style>
    .lang-icon {
        display: block;
        width: 2.1rem;
        height: 2.1rem;
    }

    /* Per-language chip colors from app.css. */
    .lang-icon.greek {
        --icon-bg: var(--lang-greek-bg);
        --icon-fill: var(--lang-greek-fg);
    }

    .lang-icon.latin {
        --icon-bg: var(--lang-latin-bg);
        --icon-fill: var(--lang-latin-fg);
    }

    .lang-icon.english {
        --icon-bg: var(--lang-english-bg);
        --icon-fill: var(--lang-english-fg);
    }

    .lang-icon-bg {
        fill: var(--icon-bg);
    }

    /* Serif letter, like the classical scripts the deck types stand for. */
    .lang-icon-glyph {
        fill: var(--icon-fill);
        font-family: var(--font-serif);
    }
</style>
