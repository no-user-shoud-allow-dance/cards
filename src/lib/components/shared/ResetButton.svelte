<script lang="ts">
    let {
        label,
        confirmText,
        onReset,
        variant = "danger",
        class: className = "",
    }: {
        label: string;
        confirmText: string;
        onReset: () => void;
        variant?: "danger" | "neutral";
        class?: string;
    } = $props();

    function handleClick(): void {
        if (!confirm(confirmText)) return;
        onReset();
    }
</script>

<button
    type="button"
    class="reset-button {variant} {className}"
    onclick={handleClick}
>
    {label}
</button>

<style>
    .reset-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.65rem;
        padding: 0.6rem 0.85rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: transparent;

        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .reset-button.danger {
        border-color: var(--danger-border);
        color: var(--danger-text);
    }

    .reset-button.danger:hover {
        background: var(--danger-bg);
    }

    .reset-button.neutral {
        color: var(--text-muted);
    }

    .reset-button.neutral:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        color: var(--text);
    }
</style>
