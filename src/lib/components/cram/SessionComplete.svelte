<script lang="ts">
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import ResetProgress from "../shared/ResetProgress.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { formatStudyTime } from "#lib/utils/time";

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
        <a class="secondary" href={resolve("/deck/[slug]", { slug })}>Zurück zum Stapel</a>
        <ResetProgress {cardIds} slug={slug} />
    </div>
</div>

<style>
    .done {
        padding: clamp(2rem, 7vw, 4rem) 1.5rem;
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

    .done-actions :global(.reset-progress) {
        margin-top: 0;
    }

    .done .secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.8rem;
        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font-size: 0.875rem;
        font-weight: 600;

        text-decoration: none;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .done .secondary:hover:not(:disabled) {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .done .secondary:disabled {
        opacity: 0.4;
    }

    @media (max-width: 540px) {
        .done-actions {
            flex-direction: column;
        }

        .done-actions :global(.reset-progress),
        .done-actions .secondary {
            width: 100%;
        }
    }
</style>
