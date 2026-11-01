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
    <div class="deck-body">
        <span class="deck-name">{name}</span>
        <Badge class="deck-count">{countCards(count)}</Badge>
        <span class="deck-arrow" aria-hidden="true">→</span>
    </div>
</Card>

<style>
    /* Card provides border, radius, bg, shadow, hover, padding. Its root is
       a child component element, so the passed class is targeted via
       :global — anchored under this component's own .deck-body where
       possible to avoid leaks. */
    :global(.deck-card) {
        position: relative;
        min-height: 5.5rem;
    }

    /* Snippet content is scoped to this component — no :global needed. */
    .deck-body {
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

    .deck-body :global(.deck-count) {
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
