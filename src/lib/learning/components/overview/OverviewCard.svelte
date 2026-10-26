<script lang="ts">
    import { fade } from "svelte/transition";
    import { fadeOutInPlace } from "#lib/utils/transitions";

    let {
        frontText,
        backText,
        onclick,
    }: {
        frontText: string;
        backText: string;
        onclick?: () => void;
    } = $props();
</script>

<div
    class="overview-card-wrap"
    in:fade={{ duration: 200 }}
    out:fadeOutInPlace
>
    <button
        type="button"
        class="overview-card"
        {onclick}
        aria-label="Nächste Karte"
    >
        <span class="overview-card-front">{frontText}</span>
        <span class="overview-card-divider" aria-hidden="true"></span>
        <span class="overview-card-back">{backText}</span>
    </button>
</div>

<style>
    .overview-card-wrap {
        width: 100%;
        margin: 1rem 0 1.25rem;
    }

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

        transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-normal);
    }

    .overview-card:hover {
        border-color: var(--border-strong);
    }

    .overview-card:active {
        box-shadow: var(--shadow-sm);
    }

    .overview-card:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    .overview-card-front {
        max-width: 100%;

        font-family: var(--font-serif);
        font-size: clamp(1.3rem, 3dvw, 1.8rem);
        font-weight: 600;
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

    @media (max-width: 400px) {
        .overview-card {
            min-height: 260px;
        }
    }
</style>
