<script lang="ts">
    import { fade } from "svelte/transition";
    import { fadeOutInPlace } from "#lib/utils/transitions";
    import { UI } from "#messages/locale.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import Chip from "#components/shared/ui/Chip.svelte";
    import MoonIcon from "#components/icons/MoonIcon.svelte";
    import CardImages from "#components/shared/ui/CardImages.svelte";
    import RichText from "#components/shared/ui/RichText.svelte";
    import type { CardImage } from "#lib/core/deck/document";

    /**
     * The one study card, in two modes:
     *
     * - Flip mode (`onFlip` + `flipped`): the cram flashcard — click
     *   flips between front and back face.
     * - Overview mode (`onclick`, no `onFlip`): both sides are shown at
     *   once, clicking advances to the next card.
     *
     * The props union makes the modes compile-time exclusive: exactly
     * one of `onFlip` or `onclick` must be defined. The moon button
     * only renders when `onMoon` is defined.
     */

    interface CommonProps {
        frontText: string;
        backText: string;
        /** Context line (`::` field) shown under the answer. */
        contextText?: string;
        /** `#tag` markers of the card line. */
        tags?: string[];
        /** The card's image (trailing `![alt](url)` field) — shown on both sides. */
        image?: CardImage;
        /** Moon button overlaid at the card's top-right corner; hidden when undefined. */
        onMoon?: () => void;
        mooned?: boolean;
        /** Compact variant for the home hero (H2). */
        compact?: boolean;
        /** Grading flash on the card edge (H16): "right" | "wrong" | null. */
        flash?: "right" | "wrong" | null;
    }

    type FlipProps = CommonProps & {
        onFlip: () => void;
        flipped: boolean;
        onclick?: undefined;
    };

    type OverviewProps = CommonProps & {
        onFlip?: undefined;
        flipped?: boolean;
        /** Clicking the card advances to the next one (overview mode). */
        onclick: () => void;
    };

    let {
        frontText,
        backText,
        contextText = "",
        tags = [],
        image,
        onFlip,
        flipped = false,
        onclick,
        onMoon,
        mooned = false,
        compact = false,
        flash = null,
    }: FlipProps | OverviewProps = $props();

    const images = $derived(image ? [image] : []);
</script>

{#if onFlip}
    <div
        class="card-wrap"
        class:compact
        class:flash-right={flash === "right"}
        class:flash-wrong={flash === "wrong"}
        in:fade={{ duration: 200 }}
        out:fadeOutInPlace
    >
        <button
            type="button"
            class="card"
            class:flipped
            onclick={onFlip}
            aria-label={flipped ? "Vorderseite anzeigen" : "Antwort anzeigen"}
        >
            <div class="card-inner">
                <div class="card-face card-front">
                    <CardImages {images} />
                    <span class="card-text"><RichText text={frontText} /></span>
                    {#if tags.length > 0}
                        <span class="tags">
                            {#each tags as tag (tag)}
                                <Chip tone="folder" size="sm">#{tag}</Chip>
                            {/each}
                        </span>
                    {/if}
                    {#if onMoon}
                        <Button
                            variant="moon-overlay"
                            class={mooned ? "mooned" : ""}
                            onclick={onMoon}
                            aria-label={mooned ? UI.wake : UI.moonButton}
                            title={mooned ? UI.wake : UI.moonButton}
                        >
                            <MoonIcon size={15} />
                        </Button>
                    {/if}
                </div>
                <div class="card-face card-back-face">
                    <span class="hint"><RichText text={frontText} /></span>
                    <CardImages {images} />
                    <span class="card-answer"><RichText text={backText} /></span>
                    {#if contextText}
                        <span class="context"><RichText text={contextText} /></span>
                    {/if}
                    {#if onMoon}
                        <Button
                            variant="moon-overlay"
                            class={mooned ? "mooned" : ""}
                            onclick={onMoon}
                            aria-label={mooned ? UI.wake : UI.moonButton}
                            title={mooned ? UI.wake : UI.moonButton}
                        >
                            <MoonIcon size={15} />
                        </Button>
                    {/if}
                </div>
            </div>
        </button>
    </div>
{:else}
    <div class="card-wrap" in:fade={{ duration: 200 }} out:fadeOutInPlace>
        <button
            type="button"
            class="overview-card"
            class:mooned
            {onclick}
            aria-label="Nächste Karte"
        >
            <CardImages {images} />
            <span class="overview-card-front"><RichText text={frontText} /></span>
            {#if tags.length > 0}
                <span class="tags">
                    {#each tags as tag (tag)}
                        <span class="tag">#{tag}</span>
                    {/each}
                </span>
            {/if}
            <span class="overview-card-divider" aria-hidden="true"></span>
            <span class="overview-card-back"><RichText text={backText} /></span>
            {#if contextText}
                <span class="context"><RichText text={contextText} /></span>
            {/if}
            {#if onMoon}
                <Button
                    variant="moon-overlay"
                    class={mooned ? "mooned" : ""}
                    onclick={(event: MouseEvent) => {
                        // The overlay sits above the card button; don't advance.
                        event.stopPropagation();
                        onMoon();
                    }}
                    aria-label={mooned ? UI.wake : UI.moonButton}
                    title={mooned ? UI.wake : UI.moonButton}
                >
                    <MoonIcon size={15} />
                </Button>
            {/if}
        </button>
    </div>
{/if}

<style lang="postcss">
    .card-wrap {
        position: relative;

        margin: 1rem 0 1.25rem;
        perspective: 1400px;

        &.compact .card,
        &.compact .card-inner,
        &.compact .card-front {
            min-height: 190px;
        }

        &.compact .card-text {
            font-size: clamp(1.2rem, 2.5dvw, 1.5rem);
        }

        &.compact .card-answer {
            font-size: clamp(1rem, 2dvw, 1.25rem);
        }
    }

    /* H16: grading flash on the card edge for ~150ms (the caller clears
       the class); box-shadow transition, no keyframes. */
    .card-wrap.flash-right .card-inner {
        box-shadow: 0 0 0 3px var(--success-text);
    }

    .card-wrap.flash-wrong .card-inner {
        box-shadow: 0 0 0 3px var(--danger-text);
    }

    /* Compact variant for the home hero (H2). */
    .card-wrap.compact {
        margin: 0;
    }

    /* The moon button floats at the card's top-right corner via
       Button's moon-overlay variant; it sits outside the flipping
       .card-inner, so it stays in place during the flip. */

    .card {
        position: relative;
        z-index: 1;

        display: block;
        width: 100%;
        min-height: clamp(280px, 45dvh, 440px);
        padding: 0;

        border: none;
        background: transparent;
        color: var(--text);

        font: inherit;
        text-align: center;

        cursor: pointer;

        &:focus-visible {
            outline: 3px solid var(--focus-ring);
            outline-offset: 3px;
        }

        &.flipped .card-inner {
            transform: rotateX(180deg);
        }

        &:hover .card-face {
            border-color: var(--border-strong);
        }

        &:active .card-face {
            box-shadow: var(--shadow-sm);
        }
    }

    .card-inner {
        position: relative;
        width: 100%;
        min-height: clamp(280px, 45dvh, 440px);

        border-radius: var(--radius-lg);

        transform-style: preserve-3d;
        transition:
            transform var(--transition-flip),
            box-shadow var(--transition-fast);
    }

    .card-face {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.85rem;

        padding: clamp(1.5rem, 5dvw, 3rem);

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;

        transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-normal);
    }

    /* The front face is in normal flow, so the card grows with its
       content (e.g. an image) instead of becoming scrollable. */
    .card-front {
        position: relative;
        min-height: clamp(280px, 45dvh, 440px);
    }

    .card-back-face {
        position: absolute;
        inset: 0;

        transform: rotateX(180deg);

        background: var(--surface-soft);

        /* Only the back face can scroll, and only when it holds the image
           and is taller than the front-driven card height. */
        overflow-y: auto;
    }

    .card-text {
        max-width: 100%;

        font: var(--font-display);
        font-size: var(--fs-8);
        letter-spacing: -0.01em;
        line-height: 1.4;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    /* The original prompt remains visible after flipping. */

    .hint {
        display: block;
        max-width: 100%;

        color: var(--text-muted);
        font-size: var(--fs-4);
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.5;
    }

    /* Tags of the card line, shown small under the prompt (flip mode
      uses Chips, overview keeps its plain pill tags). */
    .tags {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.3rem;
    }

    /* The answer is the focal point of the flipped card. */

    .card-answer {
        max-width: 100%;
        margin-top: 0.35rem;
        padding-top: 1rem;

        border-top: 1px solid var(--border);

        font: var(--font-display);
        font-size: clamp(1.2rem, 2.8dvw, 1.6rem);
        line-height: 1.5;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    /* Context line (example/usage) under the answer. */
    .context {
        display: block;
        max-width: 100%;

        color: var(--text-muted);
        font-size: var(--fs-4);
        line-height: 1.5;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    /* ── Overview mode ────────────────────────────────────────────── */

    /* The moon button floats at the card's top-right corner via
       Button's moon-overlay variant (it stays a sibling of the card
       content, so it stops propagation to not advance). */

    .overview-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        width: 100%;
        min-height: clamp(280px, 45dvh, 440px);
        padding: clamp(1.5rem, 5dvw, 3rem);

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        color: var(--text);
        font: inherit;
        text-align: center;

        cursor: pointer;
        user-select: none;

        /* Image cards can be taller than the minimum card height. */
        overflow-y: auto;

        transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-normal);

        &:hover {
            border-color: var(--border-strong);
        }

        &:active {
            box-shadow: var(--shadow-sm);
        }

        &:focus-visible {
            outline: 3px solid var(--focus-ring);
            outline-offset: 3px;
        }
    }

    .overview-card-front {
        max-width: 100%;

        font: var(--font-display);
        font-size: clamp(1.3rem, 3dvw, 1.8rem);
        letter-spacing: -0.01em;
        line-height: 1.4;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    .overview-card-divider {
        width: 3rem;
        height: 1px;
        background: var(--border);
    }

    .overview-card-back {
        max-width: 100%;

        color: var(--text-muted);
        font-size: clamp(1rem, 2.5dvw, 1.3rem);
        font-weight: 500;
        line-height: 1.5;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    .tag {
        padding: 0.1rem 0.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-pill);

        background: var(--surface-soft);
        color: var(--text-muted);

        font-size: var(--fs-2);
        font-weight: 500;
    }

    /* Mooned cards stay in the overview, dimmed and marked. */
    .overview-card.mooned {
        opacity: 0.65;
    }

    /* Mobile: tighter card margins so the study page fits the viewport
       without scrolling. */
    @media (max-width: 700px) {
        .card-wrap {
            margin: 0.5rem 0 0.75rem;
        }
    }

    @media (max-width: 400px) {
        .card,
        .card-inner,
        .card-front,
        .overview-card {
            min-height: 260px;
        }

        .card-face {
            border-radius: var(--radius-lg);
        }
    }
</style>
