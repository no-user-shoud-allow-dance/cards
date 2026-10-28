<script lang="ts">
    import { fly } from "svelte/transition";
    import type { ToastType } from "#lib/types";

    let {
        message,
        type = "info",
        title,
        actionLabel,
        onAction,
        onDismiss,
    }: {
        message: string;
        type?: ToastType;
        title?: string;
        actionLabel?: string;
        onAction?: () => void;
        onDismiss: () => void;
    } = $props();
</script>

<aside
    class="toast {type}"
    role="alert"
    aria-label={title ?? message}
    transition:fly={{ y: 16, duration: 200 }}
>
    <div class="toast-body">
        {#if title}
            <p class="toast-title">{title}</p>
        {/if}
        <p class="toast-text">{message}</p>
        {#if actionLabel}
            <button type="button" class="toast-action" onclick={onAction}>
                {actionLabel}
            </button>
        {/if}
    </div>
    <button
        type="button"
        class="toast-close"
        aria-label="Schließen"
        onclick={onDismiss}
    >
        <span aria-hidden="true">×</span>
    </button>
</aside>

<style>
    .toast {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        max-width: min(22rem, calc(100dvw - 2rem));
        padding: 0.7rem 0.85rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .toast-body { min-width: 0; }

    .toast-title {
        margin: 0 0 0.15rem;
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.4;
    }

    .toast-text {
        margin: 0;
        color: var(--text);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .toast-action {
        display: inline-flex;
        margin-top: 0.45rem;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--primary);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
    }

    .toast-action:hover { text-decoration: underline; }

    .toast-close {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 1.6rem;
        height: 1.6rem;
        padding: 0;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1;
        cursor: pointer;
        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .toast-close:hover {
        background: var(--surface-hover);
        color: var(--text);
    }

    /* ── Variants ───────────────────────────────────────────────── */
    .toast.info .toast-title { color: var(--text); }

    .toast.warning {
        border-color: var(--warning-border);
        background: var(--warning-bg);
    }
    .toast.warning .toast-title { color: var(--warning-text); }
    .toast.warning .toast-action { color: var(--warning-text); }

    .toast.error {
        border-color: var(--danger-border);
        background: var(--danger-bg);
    }
    .toast.error .toast-title { color: var(--danger-text); }
    .toast.error .toast-action { color: var(--danger-text); }

    .toast.success {
        border-color: var(--success-border);
        background: var(--success-bg);
    }
    .toast.success .toast-title { color: var(--success-text); }
    .toast.success .toast-action { color: var(--success-text); }
</style>
