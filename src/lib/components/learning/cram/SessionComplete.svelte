<script lang="ts">
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import { formatStudyTime } from "#lib/utils/time";
    import Button from "#lib/components/shared/Button.svelte";
    import ResetProgress from "#lib/components/shared/ResetProgress.svelte";

    let {
        slug,
        cardIds,
    }: {
        slug: string;
        cardIds: string[];
    } = $props();

    studyTimeStore.init();

    const studyTimeMs = $derived(studyTimeStore.get(slug));
</script>

<div class="done" in:fade={{ duration: 250 }}>
    <h2>Fertig!</h2>
    <p>
        Alle Karten sind gelernt oder aktuell nicht verfügbar.
    </p>

    {#if studyTimeMs > 0}
        <p class="done-time">Lernzeit gesamt: {formatStudyTime(studyTimeMs)}</p>
    {/if}

    <div class="done-actions">
        <Button variant="secondary" href={resolve("/(deck)/deck/[slug]", { slug })}>
            Zurück zum Stapel
        </Button>
        <ResetProgress {cardIds} slug={slug} />
    </div>
</div>

<style>
    .done {
        padding: clamp(2rem, 7dvw, 4rem) 1.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;
    }

    .done h2 {
        margin: 0 0 0.6rem;

        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .done p {
        max-width: 32rem;
        margin: 0 auto 1.5rem;

        color: var(--text-muted);
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .done .done-time {
        margin-top: -0.9rem;

        color: var(--text);
        font-weight: 600;
    }

    .done-actions {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }

    @media (max-width: 540px) {
        .done-actions {
            flex-direction: column;
        }

        .done-actions :global(.btn),
        .done-actions :global(.reset-button) {
            width: 100%;
        }
    }
</style>
