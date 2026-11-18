<script lang="ts">
    import { Page } from "#components";
    let { children } = $props();
</script>

<Page class="legal">
    {@render children()}
</Page>

<!-- The .legal content typography targets elements rendered by the child
     routes, so it lives in the global stylesheet (app.pcss), not here. -->
