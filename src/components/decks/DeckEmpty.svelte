<script lang="ts">
    import EmptyState from "#components/shared/ui/EmptyState.svelte";
    import BoxIcon from "#components/icons/BoxIcon.svelte";
    import { UI } from "#messages/locale.svelte";

    let { text = UI.emptyDeck }: { text?: string } = $props();
</script>

<EmptyState message={text}>
    {#snippet icon()}
        <BoxIcon size={40} />
    {/snippet}
</EmptyState>
