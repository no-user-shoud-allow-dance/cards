<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";

    let { cardIds, slug }: { cardIds: string[]; slug?: string } = $props();

    function resetProgress(): void {
        if (cardIds.length === 0) return;
        if (!confirm("Fortschritt für diesen Stapel zurücksetzen?")) return;
        cardStore.resetCards(cardIds);
        // Re-arm the box-2 confetti milestone for this deck.
        if (slug) cardStore.resetBox2Done(slug);
    }
</script>

<button type="button" class="reset-progress" onclick={resetProgress}>
    Fortschritt zurücksetzen
</button>

<style>
    .reset-progress {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.65rem;
        margin-top: 1.25rem;
        padding: 0.6rem 0.85rem;

        border: 1px solid var(--danger-border);
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--danger-text);

        font-size: 0.875rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .reset-progress:hover {
        background: var(--danger-bg);
    }
</style>
