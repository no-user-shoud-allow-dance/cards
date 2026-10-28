<script lang="ts">
    import { resolve } from "$app/paths";
    import { countCards } from "#lib/utils/pure";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";

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

<Card
    href={resolve("/(deck)/deck/[slug]", { slug })}
    hover
    padding="md"
    class="deck-card"
>
    <span class="deck-name">{name}</span>
    <Badge>{countCards(count)}</Badge>
    <span class="deck-arrow" aria-hidden="true">→</span>
</Card>

<style>
    /* Card provides border, radius, bg, shadow, hover, padding. */
    .deck-card {
        position: relative;
        min-height: 5.5rem;
    }

    .deck-card :global(.card-body) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.3rem;
    }

    .deck-name {
        overflow-wrap: anywhere;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.4;
    }

    .deck-card :global(.badge) {
        align-self: flex-start;
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

    :global(.deck-card:hover) .deck-arrow {
        color: var(--text);
    }
</style>
