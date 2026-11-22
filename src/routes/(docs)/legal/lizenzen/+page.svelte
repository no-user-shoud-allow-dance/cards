<script lang="ts">
    import { PageHeader } from "#components";

    // Imported as mdsvex components, not copied as raw text: the page always
    // renders the current LICENSE.md / CREDITS.md from the repo root.
    import License from "../../../../../LICENSE.md";
    import Credits from "../../../../../CREDITS.md";
</script>

<svelte:head>
    <title>Lizenzen – NSC</title>
</svelte:head>

<PageHeader
    title="Lizenzen"
    subtitle="Die Lizenz von NSC selbst und die Lizenzen eingebundener Drittanbieter-Bibliotheken."
/>

<!-- docs-content reuses the global markdown typography from app.pcss, the
     same class the /docs chapters use for their mdsvex content. -->
<div class="docs-content">
    <License />
    <hr />
    <Credits />
</div>

<style lang="postcss">
    :global(pre),
    :global(code) {
        word-wrap: break-word;
        white-space: break-spaces;
        text-wrap: wrap;
    }
</style>
