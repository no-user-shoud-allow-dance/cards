<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    // No `class` prop declaration needed: it arrives via rest and is merged
    // into the class expression (Svelte joins ClassValue arrays), so a
    // parent's class can never override the component's own classes.
    let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...rest} class={["page", rest.class]}>
    {@render children()}
</div>

<style>
    .page {
        width: min(100%, var(--content-width));
        margin-inline: auto;
        padding: 2.25rem 1.5rem;
    }

    @media (max-width: 540px) {
        .page {
            padding: 1.5rem 1rem;
        }
    }
</style>
