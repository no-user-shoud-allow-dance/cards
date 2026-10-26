<script lang="ts">
    import { displayFront, displayBack } from "#lib/utils/pure";
    import type { Card } from "#lib/utils/types";

    let {
        cards,
        pureMode,
    }: {
        cards: Card[];
        pureMode: boolean;
    } = $props();
</script>

<ul class="card-list">
    {#each cards as card (card.id)}
        <li>
            <span class="front">{displayFront(card, pureMode)}</span>
            <span class="sep">→</span>
            <span class="back">{displayBack(card, pureMode)}</span>
        </li>
    {/each}
</ul>

<style>
    .card-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        margin: 1rem 0;
        padding: 0;
        list-style: none;
    }

    .card-list li {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.35rem 0.65rem;

        min-width: 0;
        padding: 0.8rem 0.9rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);

        transition: border-color var(--transition-fast);
    }

    .card-list li:hover {
        border-color: var(--border-strong);
    }

    .card-list .front {
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .card-list .sep {
        flex: 0 0 auto;
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .card-list .back {
        min-width: 0;
        color: var(--text-muted);
        overflow-wrap: anywhere;
    }

    @media (max-width: 540px) {
        .card-list li {
            padding: 0.75rem;
        }
    }
</style>
