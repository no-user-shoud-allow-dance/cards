<script lang="ts">
    import { fly } from "svelte/transition";
    import type { HTMLAttributes } from "svelte/elements";
    import type { ToastKind } from "#lib/state/toasts.svelte";
    import CheckIcon from "#components/icons/CheckIcon.svelte";
    import CloseIcon from "#components/icons/CloseIcon.svelte";
    import InfoIcon from "#components/icons/InfoIcon.svelte";
    import WarningIcon from "#components/icons/WarningIcon.svelte";

    const ICONS: Record<ToastKind, typeof CheckIcon | null> = {
        success: CheckIcon,
        error: WarningIcon,
        warning: WarningIcon,
        info: InfoIcon,
    };

    // `class` arrives via rest and is merged into the class expression.
    let {
        message,
        type = "info",
        title,
        actionLabel,
        onAction,
        onDismiss,
        ...rest
    }: {
        message: string;
        type?: ToastKind;
        title?: string;
        actionLabel?: string;
        onAction?: () => void;
        onDismiss: () => void;
    } & HTMLAttributes<HTMLElement> = $props();
</script>

<aside
    {...rest}
    class={["toast", type, rest.class]}
    role="alert"
    aria-label={title ?? message}
    transition:fly={{ y: 16, duration: 200 }}
>
    {#if ICONS[type]}
        {@const Icon = ICONS[type]!}
        <span class="toast-icon {type}"><Icon size={17} /></span>
    {/if}
    <div class="toast-body">
        {#if title}
            <p class="toast-title">{title}</p>
        {/if}
        <div class="toast-row">
            <p class="toast-text">{message}</p>
            {#if actionLabel}
                <button type="button" class="toast-action" onclick={onAction}>
                    {actionLabel}
                </button>
            {/if}
        </div>
    </div>
    <button type="button" class="toast-close" aria-label="Schließen" onclick={onDismiss}>
        <CloseIcon size={15} />
    </button>
</aside>

<style lang="postcss">
    /* Single-line by default: the toast shrink-wraps its content, so a
       message only wraps when the available stack width runs out
       (viewport or a very long message). max-content is capped at the
       stack width (max-width), overflow-wrap catches monster tokens. */
    .toast {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-direction: row;
        gap: 0.75rem;
        padding: 0.7rem 0.85rem;
        width: max-content;
        max-width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-card);

        &.warning {
            border-color: var(--warning-border);
            background: var(--warning-bg);
        }

        &.error {
            border-color: var(--danger-border);
            background: var(--danger-bg);
        }

        &.success {
            border-color: var(--success-border);
            background: var(--success-bg);
        }
    }

    .toast-icon {
        flex: 0 0 auto;
        margin-top: 0.1rem;
        line-height: 0;

        &.success {
            color: var(--success-text);
        }
        &.error,
        &.warning {
            color: var(--danger-text);
        }
        &.info {
            color: var(--info-text);
        }
    }

    .toast-body {
        min-width: 0;
    }

    .toast-title {
        margin: 0 0 0.15rem;
        font-size: var(--fs-4);
        font-weight: 700;
        line-height: 1.4;
    }

    /* Message and action share one row: flex-wrap keeps them on a
       single line while there is room (the max-content toast grows
       with them); the action only drops to its own line once the
       max-width cap is hit. */
    .toast-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        column-gap: 0.75rem;
    }

    .toast-text {
        margin: 0;
        color: var(--text);
        font-size: var(--fs-4);
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    .toast-action {
        display: inline-flex;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--primary);
        font: inherit;
        font-size: var(--fs-4);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

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

        &:hover {
            background: var(--surface-hover);
            color: var(--text);
        }
    }

    /* ── Variants ───────────────────────────────────────────────── */
    .toast.info .toast-title {
        color: var(--text);
    }
    .toast.warning .toast-title {
        color: var(--warning-text);
    }
    .toast.warning .toast-action {
        color: var(--warning-text);
    }
    .toast.error .toast-title {
        color: var(--danger-text);
    }
    .toast.error .toast-action {
        color: var(--danger-text);
    }
    .toast.success .toast-title {
        color: var(--success-text);
    }
    .toast.success .toast-action {
        color: var(--success-text);
    }
</style>
