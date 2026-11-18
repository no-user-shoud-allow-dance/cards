<script lang="ts">
    import { toastStore } from "#lib/state/toasts.svelte";
    import Toast from "#components/shared/ui/Toast.svelte";
</script>

<div class="toast-stack">
    {#each toastStore.list as toast (toast.id)}
        <Toast
            message={toast.text}
            type={toast.kind}
            title={toast.title}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onDismiss={() => toastStore.dismiss(toast.id)}
        />
    {/each}
</div>

<style lang="postcss">
    .toast-stack {
        position: fixed;
        right: max(1rem, calc((100dvw - var(--content-width)) / 2 + 1.5rem));
        left: max(1rem, calc((100dvw - var(--content-width)) / 2 + 1.5rem));
        top: calc(var(--header-h) + 1rem);
        z-index: 60;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.6rem;
    }
</style>
