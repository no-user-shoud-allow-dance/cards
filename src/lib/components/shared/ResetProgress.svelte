<script lang="ts">
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import ResetButton from "./ResetButton.svelte";

    let { cardIds }: { cardIds: string[] } = $props();

    function resetProgress(): void {
        if (cardIds.length === 0) return;
        cardStore.resetCards(cardIds);
    }
</script>

<ResetButton
    label="Fortschritt zurücksetzen"
    confirmText="Fortschritt für diesen Stapel zurücksetzen?"
    onReset={resetProgress}
/>
