<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        title,
        subtitle,
        compact = false,
        class: className = "",
        titleClass = "",
        actions,
    }: {
        /** Page title; pass a snippet for a custom (e.g. editable) title. */
        title: string | Snippet;
        subtitle?: string;
        /** Tighter subtitle spacing when content follows directly. */
        compact?: boolean;
        class?: string;
        titleClass?: string;
        actions?: Snippet;
    } = $props();
</script>

<header class="page-header {className}">
    <h1 class="page-title {titleClass}">
        {#if typeof title === "string"}
            {title}
        {:else}
            {@render title()}
        {/if}
    </h1>
    {#if subtitle}
        <p class="page-subtitle" class:compact>{subtitle}</p>
    {/if}
    {#if actions}
        {@render actions()}
    {/if}
</header>

<style>
    .page-title {
        margin: 0 0 0.4rem;
        font-size: clamp(1.7rem, 3dvw, 2.1rem);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.2;
    }

    .page-subtitle {
        margin: 0 0 1.75rem;
        color: var(--text-muted);
        font-size: 0.95rem;
    }

    .page-subtitle.compact {
        margin-bottom: 0.35rem;
    }
</style>
