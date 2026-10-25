<script lang="ts">
    import { fade } from "svelte/transition";
    import { fadeOutInPlace } from "#lib/utils/transitions";

    let {
        frontText,
        backText,
    }: {
        frontText: string;
        backText: string;
    } = $props();
</script>

<div
    class="overview-card"
    in:fade={{ duration: 200 }}
    out:fadeOutInPlace
>
    <span class="overview-card-front">{frontText}</span>
    <span class="overview-card-divider" aria-hidden="true"></span>
    <span class="overview-card-back">{backText}</span>
</div>

<style>
    .overview-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        width: 100%;
        min-height: clamp(280px, 45vh, 440px);
        margin: 1rem 0 1.25rem;
        padding: clamp(1.5rem, 5vw, 3rem);

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;
    }

    .overview-card-front {
        max-width: 100%;

        font-family: var(--font-serif);
        font-size: clamp(1.3rem, 3vw, 1.8rem);
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
        font-size: clamp(1rem, 2.5vw, 1.3rem);
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
