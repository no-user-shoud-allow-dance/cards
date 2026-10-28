<script lang="ts">
    import Page from "#lib/components/shared/ui/Page.svelte";

    let { children } = $props();
</script>

<Page class="legal">
    {@render children()}
</Page>

<!-- svelte-ignore css_unused_selector -->
<style>
    .legal :global(h2) {
        margin: 2.25rem 0 0.6rem;
        font-size: 1.2rem;
    }

    .legal :global(p) {
        margin: 0 0 0.9rem;
    }

    .legal :global(ul) {
        margin: 0 0 0.9rem;
        padding-left: 1.25rem;
    }

    .legal :global(li) {
        margin-bottom: 0.35rem;
    }

    .legal :global(address) {
        margin: 0 0 0.9rem;
        font-style: normal;
        line-height: 1.7;
    }

    .legal :global(a) {
        color: var(--primary);
        text-decoration: none;
    }

    .legal :global(a:hover) {
        text-decoration: underline;
    }
</style>
