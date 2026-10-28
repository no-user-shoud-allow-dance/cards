<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        variant = "default",
        class: className = "",
        children,
    }: {
        variant?: "default" | "primary" | "success" | "danger" | "warning" | "overview" | "info";
        class?: string;
        children: Snippet;
    } = $props();
</script>

<span class="badge {variant} {className}">{@render children()}</span>

<style>
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.55rem;
        border-radius: var(--radius-sm);
        background: var(--surface-soft);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.5;
        white-space: nowrap;
        box-shadow: var(--shadow-sm);
    }

    .badge.primary  { background: var(--primary-soft); color: var(--primary); }
    .badge.success  { background: var(--success-bg); color: var(--success-text); }
    .badge.danger   { background: var(--danger-bg); color: var(--danger-text); }
    .badge.warning  { background: var(--warning-bg); color: var(--warning-text); }
    .badge.overview { background: var(--overview-soft); color: var(--overview); }
    .badge.info     { background: var(--info-bg); color: var(--info-text); }
</style>
