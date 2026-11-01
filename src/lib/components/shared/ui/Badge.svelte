<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression.
    let {
        variant = "default",
        children,
        ...rest
    }: {
        variant?: "default" | "primary" | "success" | "danger" | "warning" | "overview" | "info";
        children: Snippet;
    } & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span {...rest} class={["badge", variant, rest.class]}>{@render children()}</span>

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
