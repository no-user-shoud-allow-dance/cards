<script lang="ts">
    import { onMount } from "svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import Page from "#lib/components/shared/Page.svelte";

    let { data, children } = $props();

    // Decks live only in this browser (IndexedDB). Wait for them before
    // rendering the page, so the server render and the first client render
    // agree and no "Stapel nicht gefunden" flash appears for user decks.
    let ready = $state(false);

    onMount(() => {
        decks.init().then(() => {
            ready = true;
        });
    });

    // Guard once for the whole group: every page here (/deck, /overview,
    // /cram, /export) needs an existing deck.
    const deckMissing = $derived(ready && decks.load(data.slug) === null);
</script>

{#if ready}
    {#if deckMissing}
        <Page>
            <p>Stapel nicht gefunden.</p>
        </Page>
    {:else}
        {@render children()}
    {/if}
{/if}
