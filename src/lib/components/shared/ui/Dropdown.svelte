<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Snippet } from "svelte";
    import type { DialogType } from "#lib/types";

    let {
        title,
        open = $bindable(false),
        bg = "surface",
        persistent = false,
        class: className = "",
        children,
        footer,
    }: {
        title: string;
        /** Initial expanded state (collapsible mode only). */
        open?: boolean;
        /** Background color variant. */
        bg?: DialogType;
        /** When true: static header (not clickable), body always visible, no chevron. */
        persistent?: boolean;
        class?: string;
        children: Snippet;
        footer?: Snippet;
    } = $props();

    let isOpen = $state(open);

    $effect(() => {
        if (!persistent) isOpen = open;
    });

    function toggle(): void {
        isOpen = !isOpen;
    }
</script>

<div class="dropdown bg-{bg} {className}">
    {#if persistent}
        <!-- Static header: not clickable, no chevron -->
        <div class="dropdown-header static">
            <span class="dropdown-title">{title}</span>
        </div>
        <div class="dropdown-body">
            {@render children()}
            {#if footer}
                <div class="dropdown-footer">{@render footer()}</div>
            {/if}
        </div>
    {:else}
        <!-- Collapsible header with chevron -->
        <button
            type="button"
            class="dropdown-header"
            class:open={isOpen}
            aria-expanded={isOpen}
            onclick={toggle}
        >
            <span class="dropdown-title">{title}</span>
            <span class="dropdown-chevron" aria-hidden="true">▾</span>
        </button>
        {#if isOpen}
            <div class="dropdown-body" transition:fade={{ duration: 150 }}>
                {@render children()}
                {#if footer}
                    <div class="dropdown-footer">{@render footer()}</div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .dropdown {
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        box-shadow: var(--shadow-card);
        overflow: hidden;
    }

    /* ── Background variants ────────────────────────────────────── */
    .dropdown.bg-surface  { background: var(--surface); }
    .dropdown.bg-soft     { background: var(--surface-soft); }
    .dropdown.bg-primary  { background: var(--primary-soft); }
    .dropdown.bg-success  { background: var(--success-bg); }
    .dropdown.bg-danger   { background: var(--danger-bg); }
    .dropdown.bg-warning  { background: var(--warning-bg); }
    .dropdown.bg-info     { background: var(--info-bg); }
    .dropdown.bg-overview { background: var(--overview-soft); }

    /* Header sits on a slightly darker grade of the bg. */
    .dropdown.bg-surface  .dropdown-header { background: var(--surface-soft); }
    .dropdown.bg-soft     .dropdown-header { background: var(--surface-hover); }
    .dropdown.bg-primary  .dropdown-header { background: color-mix(in srgb, var(--primary-soft) 85%, var(--primary)); }
    .dropdown.bg-success  .dropdown-header { background: var(--success-hover); }
    .dropdown.bg-danger   .dropdown-header { background: var(--danger-hover); }
    .dropdown.bg-warning  .dropdown-header { background: var(--warning-hover); }
    .dropdown.bg-info     .dropdown-header { background: var(--info-hover); }
    .dropdown.bg-overview .dropdown-header { background: color-mix(in srgb, var(--overview-soft) 85%, var(--overview)); }

    .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.55rem 1.25rem;
        border: 0;
        border-bottom: 1px solid var(--border);
        background: var(--surface-soft);
        cursor: pointer;
        text-align: left;
        transition: background var(--transition-fast);
    }

    .dropdown-header:hover .dropdown-title { color: var(--text); }
    .dropdown-header:not(.open) { border-bottom: 0; }

    /* Static header (persistent): not a button, no hover effect. */
    .dropdown-header.static { cursor: default; }
    .dropdown-header.static:hover .dropdown-title { color: var(--text-muted); }

    .dropdown-title {
        font-family: var(--font-sans);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1.4;
        text-transform: uppercase;
    }

    .dropdown-chevron {
        color: var(--text-muted);
        font-size: 0.7rem;
        transition: transform var(--transition-fast);
    }

    .dropdown-header.open .dropdown-chevron { transform: rotate(180deg); }

    .dropdown-body {
        padding: 1.1rem 1.25rem 1.25rem;
        font-size: 0.95rem;
        line-height: 1.75;
    }

    .dropdown-footer {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border);
    }

    /* ── Mobile ─────────────────────────────────────────────────── */
    @media (max-width: 540px) {
        .dropdown-body { padding: 0.9rem 1rem 1rem; }
    }
</style>
