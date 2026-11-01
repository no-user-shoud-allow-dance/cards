<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression; other
    // attributes fall through to the <header> via {...rest}. For custom title
    // layouts, style the elements inside the title snippet instead of
    // reaching into the h1 from outside.
    let {
        title,
        subtitle,
        compact = false,
        actions,
        ...rest
    }: {
        /** Page title; pass a snippet for a custom (e.g. editable) title. */
        title: string | Snippet;
        subtitle?: string;
        /** Tighter subtitle spacing when content follows directly. */
        compact?: boolean;
        actions?: Snippet;
    } & HTMLAttributes<HTMLElement> = $props();
</script>

<header {...rest} class={["page-header", rest.class]}>
    <h1 class="page-title">
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
