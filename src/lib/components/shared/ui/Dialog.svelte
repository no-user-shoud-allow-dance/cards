<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import type { DialogType } from "#lib/types";

    // `class` arrives via rest and is merged into the class expression; other
    // attributes fall through to the dialog panel via {...rest}.
    let {
        title,
        open = $bindable(false),
        bg = "surface",
        onclose,
        children,
        footer,
        ...rest
    }: {
        title: string;
        open?: boolean;
        bg?: DialogType;
        onclose?: () => void;
        children: Snippet;
        footer?: Snippet;
    } & HTMLAttributes<HTMLDivElement> = $props();

    function closeModal(): void {
        open = false;
        onclose?.();
    }

    function handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) closeModal();
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === "Escape" && open) {
            event.stopPropagation();
            closeModal();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        class="dialog-backdrop"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 150 }}
        onclick={handleBackdropClick}
    >
        <div
            {...rest}
            class={["dialog", `bg-${bg}`, rest.class]}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            in:scale={{ duration: 200, start: 0.96 }}
            out:scale={{ duration: 150, start: 0.96 }}
        >
            <header class="dialog-header">
                <h2 class="dialog-title">{title}</h2>
                <button
                    type="button"
                    class="dialog-close"
                    aria-label="Schließen"
                    onclick={closeModal}
                >
                    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                        <path d="M2 2 12 12 M12 2 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </header>
            <div class="dialog-body">
                {@render children()}
            </div>
            {#if footer}
                <footer class="dialog-footer">
                    {@render footer()}
                </footer>
            {/if}
        </div>
    </div>
{/if}

<style>
    .dialog-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: var(--backdrop);
    }

    .dialog {
        display: flex;
        flex-direction: column;
        width: min(100%, 32rem);
        max-height: calc(100dvh - 3rem);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow-card);
        overflow: hidden;
    }

    /* Header sit on a slightly darker grade of the bg. */
    .dialog.bg-surface  .dialog-header { color: var(--text); background: var(--surface-soft); }
    .dialog.bg-soft     .dialog-header { color: var(--text-muted); background: var(--surface-hover); }
    .dialog.bg-primary  .dialog-header { color: var(--primary); background: color-mix(in srgb, var(--primary-soft) 85%, var(--primary)); }
    .dialog.bg-success  .dialog-header { color: var(--success-text); background: var(--success-hover); }
    .dialog.bg-danger   .dialog-header { color: var(--danger-text); background: var(--danger-hover); }
    .dialog.bg-warning  .dialog-header { color: var(--warning-text); background: var(--warning-hover); }
    .dialog.bg-info     .dialog-header { color: var(--info-text); background: var(--info-hover); }
    .dialog.bg-overview .dialog-header { color: var(--overview-text); background: color-mix(in srgb, var(--overview-soft) 85%, var(--overview)); }

    .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1.25rem;
        border-bottom: 1px solid var(--border);
        background: var(--surface-soft);
    }

    .dialog-title {
        margin: 0;
        font-family: var(--font-sans);
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.4;
    }

    .dialog-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 1.75rem;
        height: 1.75rem;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    /* Header sit on a slightly darker grade of the bg. */
    .dialog.bg-surface  .dialog-close { color: var(--text); }
    .dialog.bg-soft     .dialog-close { color: var(--text-muted); }
    .dialog.bg-primary  .dialog-close { color: var(--primary); }
    .dialog.bg-success  .dialog-close { color: var(--success-text); }
    .dialog.bg-danger   .dialog-close { color: var(--danger-text); }
    .dialog.bg-warning  .dialog-close { color: var(--warning-text); }
    .dialog.bg-info     .dialog-close { color: var(--info-text); }
    .dialog.bg-overview .dialog-close { color: var(--overview-text); }

    .dialog-close:hover {
        border-color: var(--border-strong);
        color: var(--text);
    }

    .dialog-body {
        padding: 1.1rem 1.25rem;
        overflow-y: auto;
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .dialog-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.6rem;
        padding: 0.75rem 0rem;
        margin: 0.0rem 1.25rem;
        border-top: 1px solid var(--border);
    }

    /* ── Mobile ─────────────────────────────────────────────────── */
    @media (max-width: 540px) {
        .dialog-backdrop { padding: 1rem; }
        .dialog { max-height: calc(100dvh - 2rem); }
        .dialog-body { padding: 0.9rem 0rem; margin: 0 1rem; }
        .dialog-footer { padding: 0.65rem 1rem; }
    }
</style>
