<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        class: className = "",
        children,
    }: {
        class?: string;
        children: Snippet;
    } = $props();
</script>

<div class="page {className}">
    {@render children()}
</div>

<style>
    .page {
        width: min(100%, var(--content-width));
        margin-inline: auto;
        padding: 2.25rem 1.5rem 4rem;
    }

    @media (max-width: 540px) {
        .page {
            padding: 1.5rem 1rem 3rem;
        }
    }
</style>
