<script lang="ts">
    import { onMount } from "svelte";
    import { userDecks } from "#lib/decks/store/userDecks.svelte";
    import Page from "#lib/app/components/shared/Page.svelte";

    let { data, children } = $props();

    // Decks live only in this browser (IndexedDB). Wait for them before
    // rendering the page, so the server render and the first client render
    // agree and no "Stapel nicht gefunden" flash appears for user decks.
    let ready = $state(false);

    onMount(() => {
        userDecks.init().then(() => {
            ready = true;
        });
    });

    // Guard once for the whole group: every page here (/deck, /overview,
    // /cram, /export) needs an existing deck.
    const deckMissing = $derived(ready && userDecks.load(data.slug) === null);
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
