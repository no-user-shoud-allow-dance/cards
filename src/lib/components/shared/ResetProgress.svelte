<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import ResetButton from "./ResetButton.svelte";

    // Extra attributes are forwarded to the inner ResetButton.
    let {
        cardIds,
        slug,
        ...rest
    }: { cardIds: string[]; slug: string } & HTMLAttributes<HTMLElement> = $props();

    function resetProgress(): void {
        if (cardIds.length === 0) return;
        cardStore.resetCards(cardIds, slug);
    }
</script>

<ResetButton
    label="Fortschritt zurücksetzen"
    confirmText="Fortschritt für diesen Stapel zurücksetzen?"
    onReset={resetProgress}
    {...rest}
/>
