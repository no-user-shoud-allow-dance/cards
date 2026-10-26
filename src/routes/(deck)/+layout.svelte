<script lang="ts">
    import { onMount } from "svelte";
    import { userDecks } from "#lib/decks/store/userDecks.svelte";

    let { children } = $props();

    // Decks live only in this browser (IndexedDB). Wait for them before
    // rendering the page, so the server render and the first client render
    // agree and no "Stapel nicht gefunden" flash appears for user decks.
    let ready = $state(false);

    onMount(() => {
        userDecks.init().then(() => {
            ready = true;
        });
    });
</script>

{#if ready}
    {@render children()}
{/if}
