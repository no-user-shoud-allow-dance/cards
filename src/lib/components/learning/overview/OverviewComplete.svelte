<script lang="ts">
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import Button from "#lib/components/shared/Button.svelte";

    let { slug, totalCards }: { slug: string; totalCards: number } = $props();
</script>

<div class="overview-done" in:fade={{ duration: 250 }}>
    <h2>Übersicht abgeschlossen</h2>
    <p>
        Alle {totalCards} Karten wurden angesehen. Starte jetzt den Lernmodus,
        um Antworten zu bewerten.
    </p>
    <div class="overview-done-actions">
        <Button variant="secondary" href={resolve("/(deck)/deck/[slug]", { slug })}>
            Zurück zum Stapel
        </Button>
        <Button variant="primary" href={resolve("/(deck)/cram/[slug]", { slug })}>
            Lernmodus starten
            <span aria-hidden="true">→</span>
        </Button>
    </div>
</div>

<style>
    .overview-done {
        padding: clamp(2rem, 7dvw, 4rem) 1.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;
    }

    .overview-done h2 {
        margin: 0 0 0.6rem;

        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .overview-done p {
        max-width: 32rem;
        margin: 0 auto 1.5rem;

        color: var(--text-muted);
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .overview-done-actions {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }

    @media (max-width: 540px) {
        .overview-done-actions {
            flex-direction: column;
        }

        .overview-done-actions :global(.btn) {
            width: 100%;
        }
    }
</style>
