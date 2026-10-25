<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        variant = "primary",
        children,
    }: {
        variant?: "primary" | "overview" | "success";
        children: Snippet;
    } = $props();
</script>

<!-- Term pill — highlights a key term. -->
<span class="term {variant}">{@render children()}</span>

<style>
    .term {
        display: inline-block;

        margin: 0 0.15rem;
        padding: 0.05rem 0.55rem;

        border-radius: var(--radius-pill);

        font-size: 0.85em;
        font-weight: 700;
        white-space: nowrap;
    }

    .term.overview {
        background: var(--overview-soft);
        color: var(--overview);
    }

    .term.primary {
        background: var(--primary-soft);
        color: var(--primary);
    }

    .term.success {
        background: var(--success-bg);
        color: var(--success-text);
    }
</style>
