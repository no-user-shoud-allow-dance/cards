<script lang="ts">
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import { BOX_COUNT } from "#lib/core/learning/leitner";
    import type { CardId } from "#lib/core/deck/ids";
    import { decks } from "#components/model/decks.svelte";
    import { UI } from "#messages/locale.svelte";
    import BoxStrip from "#components/learning/BoxStrip.svelte";
    import ClockIcon from "#components/icons/ClockIcon.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import ResetProgress from "#components/shared/ResetProgress.svelte";

    let {
        slug,
        cardIds,
    }: {
        slug: string;
        cardIds: CardId[];
    } = $props();

    const studyTimeMs = $derived(decks.load(slug)?.studyTimeMs ?? 0);

    // H6: the celebration is the deck's own box strip filling up to
    // "Gelernt" — it shows what actually happened during the session.
    const boxCounts = $derived.by(() => {
        const counts = Array.from({ length: BOX_COUNT }, () => 0);
        for (const card of decks.load(slug)?.cards ?? []) {
            if (!cardIds.includes(card.cardId)) continue;
            const box = card.state?.box ?? 1;
            if (box >= 1 && box <= BOX_COUNT) counts[box - 1]!++;
        }
        return counts;
    });
</script>

<div class="done" in:fade={{ duration: 250 }}>
    <h2>Fertig!</h2>
    <p>Alle Karten sind gelernt oder aktuell nicht verfügbar.</p>

    <div class="done-strip">
        <BoxStrip counts={boxCounts} variant="labeled" animate />
    </div>

    {#if studyTimeMs > 0}
        <p class="done-time">
            <ClockIcon size={14} /> Lernzeit gesamt: {UI.studyTime(studyTimeMs)}
        </p>
    {/if}

    <div class="done-actions">
        <Button
            variant="secondary"
            class="done-btn"
            href={resolve("/(deck)/deck/[slug]", { slug })}
        >
            Zurück zum Stapel
        </Button>
        <ResetProgress {cardIds} {slug} class="done-btn" />
    </div>
</div>

<style lang="postcss">
    .done {
        padding: clamp(2rem, 7dvw, 4rem) 1.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;

        & h2 {
            margin: 0 0 0.6rem;

            font-size: 1.6rem;
            font-weight: 600;
            letter-spacing: -0.01em;
        }

        & p {
            max-width: 32rem;
            margin: 0 auto 1.5rem;

            color: var(--text-muted);
            font-size: var(--fs-5);
            line-height: 1.65;
        }

        & .done-time {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;

            margin-top: -0.9rem;

            color: var(--text);
            font-weight: 600;
        }
    }

    .done-strip {
        max-width: 26rem;
        margin: 0 auto 1.5rem;
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

            & :global(.done-btn) {
                width: 100%;
            }
        }
    }
</style>
