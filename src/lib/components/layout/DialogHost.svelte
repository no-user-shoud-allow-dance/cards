<script lang="ts">
    import { dialogStore } from "#lib/stores/session/dialogStore.svelte";
    import Dialog from "#lib/components/shared/ui/Dialog.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    const active = $derived(dialogStore.dialog);
</script>

{#if active}
    <Dialog
        title={active.title}
        open={true}
        bg={active.bg ?? "surface"}
        onclose={() => dialogStore.cancel()}
    >
        <p>{active.message}</p>

        {#snippet footer()}
            {#if active.cancelLabel}
                <Button
                    variant="secondary"
                    onclick={() => dialogStore.cancel()}
                >
                    {active.cancelLabel}
                </Button>
            {/if}
            {#if active.confirmLabel}
                <Button
                    variant="primary"
                    onclick={() => dialogStore.confirm()}
                >
                    {active.confirmLabel}
                </Button>
            {/if}
        {/snippet}
    </Dialog>
{/if}
