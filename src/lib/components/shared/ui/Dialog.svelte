<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import type { Snippet } from "svelte";
    import type { DialogType } from "#lib/types";

    let {
        title,
        open = $bindable(false),
        bg = "surface",
        class: className = "",
        onclose,
        children,
        footer,
    }: {
        title: string;
        open?: boolean;
        bg?: DialogType;
        class?: string;
        onclose?: () => void;
        children: Snippet;
        footer?: Snippet;
    } = $props();

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
            class="dialog bg-{bg} {className}"
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

    /* Background variants */
    .dialog.bg-surface  { background: var(--surface); }
    .dialog.bg-soft     { background: var(--surface-soft); }
    .dialog.bg-primary  { background: var(--primary-soft); }
    .dialog.bg-success  { background: var(--success-bg); }
    .dialog.bg-danger   { background: var(--danger-bg); }
    .dialog.bg-warning  { background: var(--warning-bg); }
    .dialog.bg-info     { background: var(--info-bg); }
    .dialog.bg-overview { background: var(--overview-soft); }

    /* Header/footer sit on a slightly darker grade of the bg. */
    .dialog.bg-surface  .dialog-header, .dialog.bg-surface  .dialog-footer { background: var(--surface-soft); }
    .dialog.bg-soft     .dialog-header, .dialog.bg-soft     .dialog-footer { background: var(--surface-hover); }
    .dialog.bg-primary  .dialog-header, .dialog.bg-primary  .dialog-footer { background: color-mix(in srgb, var(--primary-soft) 85%, var(--primary)); }
    .dialog.bg-success  .dialog-header, .dialog.bg-success  .dialog-footer { background: var(--success-hover); }
    .dialog.bg-danger   .dialog-header, .dialog.bg-danger   .dialog-footer { background: var(--danger-hover); }
    .dialog.bg-warning  .dialog-header, .dialog.bg-warning  .dialog-footer { background: var(--warning-hover); }
    .dialog.bg-info     .dialog-header, .dialog.bg-info     .dialog-footer { background: var(--info-hover); }
    .dialog.bg-overview .dialog-header, .dialog.bg-overview .dialog-footer { background: color-mix(in srgb, var(--overview-soft) 85%, var(--overview)); }

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
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .dialog-close:hover {
        background: var(--surface-hover);
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
        padding: 0.75rem 1.25rem;
        border-top: 1px solid var(--border);
        background: var(--surface-soft);
    }

    /* ── Mobile ─────────────────────────────────────────────────── */
    @media (max-width: 540px) {
        .dialog-backdrop { padding: 1rem; }
        .dialog { max-height: calc(100dvh - 2rem); }
        .dialog-body { padding: 0.9rem 1rem; }
        .dialog-footer { padding: 0.65rem 1rem; }
    }
</style>
