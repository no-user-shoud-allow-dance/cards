<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        href,
        hover = false,
        padding = "md",
        bg = "surface",
        class: className = "",
        onclick,
        children,
        header,
        footer,
    }: {
        href?: string;
        hover?: boolean;
        padding?: "sm" | "md" | "lg";
        bg?: "surface" | "soft" | "primary" | "success" | "danger" | "warning" | "info" | "overview";
        class?: string;
        onclick?: (event: MouseEvent) => void;
        children: Snippet;
        header?: Snippet;
        footer?: Snippet;
    } = $props();
</script>

{#if href}
    <a class="card {padding} bg-{bg} {className}" class:hover {href} {onclick}>
        {#if header}<div class="card-header">{@render header()}</div>{/if}
        <div class="card-body">{@render children()}</div>
        {#if footer}<div class="card-footer">{@render footer()}</div>{/if}
    </a>
{:else}
    <div class="card {padding} bg-{bg} {className}" class:hover role={onclick ? "button" : undefined} {onclick} tabindex={onclick ? 0 : undefined}>
        {#if header}<div class="card-header">{@render header()}</div>{/if}
        <div class="card-body">{@render children()}</div>
        {#if footer}<div class="card-footer">{@render footer()}</div>{/if}
    </div>
{/if}

<style>
    .card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        color: var(--text);
        text-decoration: none;
        box-shadow: var(--shadow-card);
    }

    .card.hover {
        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    .card.hover:hover {
        border-color: var(--border-strong);
    }

    a.card.hover { cursor: pointer; }

    /* ── Background variants ────────────────────────────────────── */
    .card.bg-surface  { background: var(--surface); }
    .card.bg-soft     { background: var(--surface-soft); }
    .card.bg-primary  { background: var(--primary-soft); }
    .card.bg-success  { background: var(--success-bg); }
    .card.bg-danger   { background: var(--danger-bg); }
    .card.bg-warning  { background: var(--warning-bg); }
    .card.bg-info     { background: var(--info-bg); }
    .card.bg-overview { background: var(--overview-soft); }

    /* Hover grades: slightly darker shade of each background. */
    .card.hover.bg-surface:hover  { background: var(--surface-hover); }
    .card.hover.bg-soft:hover     { background: var(--surface-hover); }
    .card.hover.bg-primary:hover  { background: color-mix(in srgb, var(--primary-soft) 82%, var(--primary)); }
    .card.hover.bg-success:hover  { background: var(--success-hover); }
    .card.hover.bg-danger:hover   { background: var(--danger-hover); }
    .card.hover.bg-warning:hover  { background: var(--warning-hover); }
    .card.hover.bg-info:hover     { background: var(--info-hover); }
    .card.hover.bg-overview:hover { background: color-mix(in srgb, var(--overview-soft) 82%, var(--overview)); }

    /* ── Padding variants ───────────────────────────────────────── */
    .card.sm { padding: 0.75rem 0.9rem; }
    .card.md { padding: 1.1rem 1.2rem; }
    .card.lg { padding: 1.5rem 1.6rem; }

    .card-header {
        padding-bottom: 0.65rem;
        border-bottom: 1px solid var(--border);
        font-weight: 600;
    }

    .card-body { flex: 1; }
    .card-header + .card-body { padding-top: 0.75rem; }

    .card-footer {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border);
    }

    .card-body + .card-footer { margin-top: 0.75rem; }

    @media (max-width: 540px) {
        .card.lg { padding: 1.1rem 1rem; }
    }
</style>
