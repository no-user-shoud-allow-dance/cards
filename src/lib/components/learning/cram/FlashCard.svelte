<script lang="ts">
    import { fade } from "svelte/transition";
    import { fadeOutInPlace } from "#lib/utils/transitions";

    let {
        frontText,
        backText,
        flipped,
        onFlip,
    }: {
        frontText: string;
        backText: string;
        flipped: boolean;
        onFlip: () => void;
    } = $props();
</script>

<div
    class="card-wrap"
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
                <span class="card-text">{frontText}</span>
            </div>
            <div class="card-face card-back-face">
                <span class="hint">{frontText}</span>
                <span class="card-answer">{backText}</span>
            </div>
        </div>
    </button>
</div>

<style>
    .card-wrap {
        position: relative;

        margin: 1rem 0 1.25rem;
        perspective: 1400px;
    }

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
    }

    .card:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: clamp(280px, 45dvh, 440px);

        transform-style: preserve-3d;
        transition: transform var(--transition-flip);
    }

    .card.flipped .card-inner {
        transform: rotateX(180deg);
    }

    .card-face {
        position: absolute;
        inset: 0;

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

    .card:hover .card-face {
        border-color: var(--border-strong);
    }

    .card:active .card-face {
        box-shadow: var(--shadow-sm);
    }

    .card-back-face {
        transform: rotateX(180deg);

        background: var(--surface-soft);
    }

    .card-text {
        max-width: 100%;

        font-family: var(--font-serif);
        font-size: clamp(1.5rem, 3.5dvw, 2.1rem);
        font-weight: 600;
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
        font-size: 0.9rem;
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.5;
    }

    /* The answer is the focal point of the flipped card. */

    .card-answer {
        max-width: 100%;
        margin-top: 0.35rem;
        padding-top: 1rem;

        border-top: 1px solid var(--border);

        font-family: var(--font-serif);
        font-size: clamp(1.2rem, 2.8dvw, 1.6rem);
        font-weight: 600;
        line-height: 1.5;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
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
        .card-inner {
            min-height: 260px;
        }

        .card-face {
            border-radius: var(--radius-lg);
        }
    }
</style>
