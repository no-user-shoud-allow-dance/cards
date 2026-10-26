<script lang="ts">
    import EmptyNote from "#lib/app/components/shared/EmptyNote.svelte";

    let { text = "Dieser Stapel enthält keine Karten." }: { text?: string } =
        $props();
</script>

<div class="deck-empty">
    <EmptyNote>{text}</EmptyNote>
</div>

<style>
    .deck-empty {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
    }
</style>
