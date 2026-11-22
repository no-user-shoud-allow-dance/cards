<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import Spinner from "#components/shared/ui/Spinner.svelte";

    // `class` arrives via rest and is merged into the class expression;
    // aria-*/onclick/… fall through via {...rest}.
    let {
        variant = "secondary",
        href,
        type = "button",
        disabled = false,
        busy = false,
        busyLabel,
        leading,
        children,
        ...rest
    }: {
        variant?:
            | "primary"
            | "secondary"
            | "danger"
            | "success"
            | "overview"
            | "warning"
            | "tertiary"
            | "moon"
            | "moon-overlay";
        href?: string;
        type?: "button" | "submit";
        disabled?: boolean;
        /** Disables the button and swaps the label for a spinner (+ busyLabel). */
        busy?: boolean;
        /** Label shown next to the spinner while busy; without it the children stay. */
        busyLabel?: string;
        /** Optional icon slot rendered before the label (I). */
        leading?: Snippet;
        children: Snippet;
    } & HTMLAttributes<HTMLElement> = $props();

    let btnClass = $derived(["btn", variant, busy ? "busy" : "", rest.class]);
</script>

{#if href}
    <!-- Callers pass an already resolve()d route; resolving again would fail at runtime. -->
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a {...rest} class={btnClass} {href} aria-disabled={busy || disabled || undefined}>
        {#if busy}
            <Spinner size={16} />
        {:else if leading}
            {@render leading()}
        {/if}
        {#if busy && busyLabel}
            {busyLabel}
        {:else}
            {@render children()}
        {/if}
    </a>
{:else}
    <button {...rest} class={btnClass} {type} disabled={disabled || busy}>
        {#if busy}
            <Spinner size={16} />
        {:else if leading}
            {@render leading()}
        {/if}
        {#if busy && busyLabel}
            {busyLabel}
        {:else}
            {@render children()}
        {/if}
    </button>
{/if}

<style lang="postcss">
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
        font-size: var(--fs-4);
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast),
            transform var(--transition-spring);

        &:not(:disabled):active {
            transform: scale(0.96);
        }

        &:hover {
            border-color: var(--border-strong);
            background: var(--surface-hover);
        }

        &:disabled {
            opacity: 0.6;
            cursor: default;
        }

        &.primary {
            border-color: transparent;
            background: var(--primary);
            color: var(--primary-on);

            &:hover {
                background: var(--primary-hover);
            }
        }

        &.overview {
            border-color: transparent;
            background: var(--overview);
            color: var(--overview-on);

            &:hover {
                background: var(--overview-hover);
            }
        }

        &.tertiary {
            border-color: transparent;
            background: var(--tertiary);
            color: var(--tertiary-on);

            &:hover {
                background: var(--tertiary-hover);
            }
        }

        &.danger {
            border-color: var(--danger-border);
            background: var(--danger-bg);
            color: var(--danger-text);

            &:hover {
                background: var(--danger-hover);
            }
        }

        &.success {
            border-color: var(--success-border);
            background: var(--success-bg);
            color: var(--success-text);

            &:hover {
                background: var(--success-hover);
            }
        }

        &.warning {
            border-color: var(--warning-border);
            background: var(--warning-bg);
            color: var(--warning-text);

            &:hover {
                background: var(--warning-hover);
            }
        }

        &.moon {
            width: 1.6rem;
            height: 1.6rem;
        }
    }

    /* Icon-only moon toggle (the anti-star `*`): stone palette, pill
       shape. `moon-overlay` is the same button floating at a card's
       top-right corner. The `mooned` state class arrives via
       rest.class on this component's own root, so no :global is
       needed. */
    .btn.moon,
    .btn.moon-overlay {
        flex: 0 0 auto;

        min-height: 0;
        padding: 0;

        border-color: var(--stone-border);
        border-radius: var(--radius-pill);

        background: var(--stone-bg);
        color: var(--stone-text);
    }

    /* Overlay variant: anchored to the nearest positioned ancestor
       (the card), slightly larger, with a shadow. The transform
       transition stays off so the button doesn't drift while the
       card flips. */
    .btn.moon-overlay {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        z-index: 2;

        width: 2rem;
        height: 2rem;

        box-shadow: var(--shadow-sm);

        transition: 0s transform ease;
    }

    .btn.moon:not(:disabled):hover,
    .btn.moon-overlay:not(:disabled):hover {
        border-color: var(--stone-text);
        background: var(--stone-hover);
        color: var(--stone-text);
    }

    .btn.moon.mooned,
    .btn.moon-overlay.mooned {
        border-color: var(--stone-text);
        background: var(--stone-hover);
        color: var(--stone-text);
    }

    .btn.moon:focus-visible,
    .btn.moon-overlay:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
    }
</style>
