<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";
    import ResetButton from "./ResetButton.svelte";

    let { cardIds, slug }: { cardIds: string[]; slug?: string } = $props();

    function resetProgress(): void {
        if (cardIds.length === 0) return;
        cardStore.resetCards(cardIds);
        // Re-arm the box-2 confetti milestone for this deck.
        if (slug) cardStore.resetBox2Done(slug);
    }
</script>

<ResetButton
    label="Fortschritt zurücksetzen"
    confirmText="Fortschritt für diesen Stapel zurücksetzen?"
    onReset={resetProgress}
/>
