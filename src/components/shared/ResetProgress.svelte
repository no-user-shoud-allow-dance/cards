<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import type { CardId } from "#lib/core/deck/ids";
    import { decks } from "#components/model/decks.svelte";
    import ResetButton from "#components/shared/ResetButton.svelte";

    // Extra attributes are forwarded to the inner ResetButton.
    let {
        cardIds,
        slug,
        ...rest
    }: { cardIds: CardId[]; slug: string } & HTMLAttributes<HTMLElement> = $props();

    function resetProgress(): void {
        if (cardIds.length === 0) return;
        void decks.resetCards(slug, cardIds);
    }
</script>

<ResetButton
    label="Fortschritt zurücksetzen"
    confirmText="Fortschritt für diesen Stapel zurücksetzen?"
    onReset={resetProgress}
    {...rest}
/>
