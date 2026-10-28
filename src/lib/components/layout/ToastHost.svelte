<script lang="ts">
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import Toast from "#lib/components/shared/ui/Toast.svelte";
</script>

<div class="toast-stack">
    {#each toastStore.toasts as toast (toast.id)}
        <Toast
            message={toast.message}
            type={toast.type}
            title={toast.title}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onDismiss={() => toastStore.dismiss(toast.id)}
        />
    {/each}
</div>

<style>
    .toast-stack {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 60;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.6rem;
        max-width: min(22rem, calc(100dvw - 2rem));
    }

    @media (max-width: 540px) {
        .toast-stack {
            right: 0.75rem;
            bottom: 0.75rem;
        }
    }
</style>
