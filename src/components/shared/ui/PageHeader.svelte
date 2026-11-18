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
        oneliner = false,
        actions,
        ...rest
    }: {
        /** Page title; pass a snippet for a custom (e.g. editable) title. */
        title: string | Snippet<[]>;
        subtitle?: string | Snippet<[]>;
        /** Tighter subtitle spacing when content follows directly. */
        compact?: boolean;
        oneliner?: boolean;
        actions?: Snippet<[]>;
    } & Omit<HTMLAttributes<HTMLElement>, "title"> = $props();
</script>

<header {...rest} class={["page-header", rest.class]} class:oneliner>
    <h1 class="page-title">
        {#if typeof title === "string"}
            {title}
        {:else}
            {@render title()}
        {/if}
    </h1>
    {#if typeof title === "string"}
        <p class="page-subtitle" class:compact>{subtitle}</p>
    {:else if typeof subtitle !== "string" && subtitle}
        {@render subtitle()}
    {/if}
    {#if actions}
        {@render actions()}
    {/if}
</header>

<style lang="postcss">
    .page-header {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        flex-direction: column;

        &.oneliner {
            justify-content: flex-start;
            align-items: center;
            flex-direction: row;
            gap: 1rem;
            background: linear-gradient(
                to bottom,
                transparent calc(50% + 0.25rem - 0.25px),
                var(--stone-border) calc(50% + 0.25rem - 0.25px),
                var(--stone-border) calc(50% + 0.25rem + 0.5px),
                transparent calc(50% + 0.25rem + 0.5px)
            );
        }
    }
    .page-title {
        margin: 0 0 0.4rem;
        font-size: clamp(1.7rem, 3dvw, 2.1rem);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.2;

        .oneliner & {
            margin: 0;
            padding: 0 0.5rem 0 0;
            background: var(--bg);
        }
    }

    .page-subtitle {
        margin: 0 0 1.75rem;
        color: var(--text-muted);
        font-size: var(--fs-5);

        &.compact {
            margin-bottom: 0.35rem;
        }

        .oneliner & {
            margin: 0;
            margin-top: 0.5rem;
            padding: 0 0.5rem;
            background: var(--bg);
        }
    }
</style>
