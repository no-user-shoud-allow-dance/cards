<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression;
    // aria-*/onclick/… fall through via {...rest}.
    let {
        variant = "secondary",
        href,
        type = "button",
        disabled = false,
        children,
        ...rest
    }: {
        variant?: "primary" | "secondary" | "danger" | "overview" | "warning";
        href?: string;
        type?: "button" | "submit";
        disabled?: boolean;
        children: Snippet;
    } & HTMLAttributes<HTMLElement> = $props();
</script>

{#if href}
    <a {...rest} class={["btn", variant, rest.class]} {href}>
        {@render children()}
    </a>
{:else}
    <button {...rest} class={["btn", variant, rest.class]} {type} {disabled}>
        {@render children()}
    </button>
{/if}

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-height: 2.65rem;
        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .btn:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .btn.primary {
        border-color: transparent;
        background: var(--primary);
        color: var(--primary-text);
    }

    .btn.primary:hover {
        background: var(--primary-hover);
    }

    .btn.overview {
        border-color: transparent;
        background: var(--overview);
        color: var(--overview-text);
    }

    .btn.overview:hover {
        background: var(--overview-hover);
    }

    .btn.danger {
        border-color: var(--danger-border);
        background: var(--danger-bg);
        color: var(--danger-text);
    }

    .btn.danger:hover {
        background: var(--danger-hover);
    }

    .btn.warning {
        border-color: var(--warning-border);
        background: var(--warning-bg);
        color: var(--warning-text);
    }

    .btn.warning:hover {
        background: var(--warning-hover);
    }
</style>
