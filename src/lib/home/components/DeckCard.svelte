<script lang="ts">
    import { resolve } from "$app/paths";
    import { countCards } from "#lib/utils/pure";

    let {
        slug,
        name,
        count,
    }: {
        slug: string;
        name: string;
        count: number;
    } = $props();
</script>

<a href={resolve("/(deck)/deck/[slug]", { slug })} class="deck-card">
    <span class="deck-name">{name}</span>
    <span class="deck-meta">{countCards(count)}</span>
    <span class="deck-arrow" aria-hidden="true">→</span>
</a>

<style>
    .deck-card {
        position: relative;

        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.3rem;

        min-width: 0;
        min-height: 5.5rem;
        padding: 1rem 1.1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
        text-decoration: none;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    .deck-card:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        box-shadow: var(--shadow-card);
    }

    .deck-name {
        overflow-wrap: anywhere;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.4;
    }

    .deck-meta {
        display: inline-flex;
        align-self: flex-start;

        padding: 0.15rem 0.55rem;

        border-radius: var(--radius-sm);
        background: var(--surface-soft);
        color: var(--text-muted);

        font-size: 0.78rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .deck-arrow {
        position: absolute;
        right: 0.9rem;
        bottom: 0.8rem;

        color: var(--text-muted);
        font-size: 0.95rem;

        transition: color var(--transition-fast);
    }

    .deck-card:hover .deck-arrow {
        color: var(--text);
    }
</style>
