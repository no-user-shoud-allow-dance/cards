<script lang="ts">
    import Page from "#lib/components/shared/ui/Page.svelte";

    let { children } = $props();
</script>

<Page class="legal">
    {@render children()}
</Page>

<!-- The .legal content typography targets elements rendered by the child
     routes, so it lives in the global stylesheet (app.css), not here. -->
