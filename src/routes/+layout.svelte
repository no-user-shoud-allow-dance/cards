<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { cardStore } from "#lib/store/store.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import AppHeader from "#lib/components/layout/AppHeader.svelte";

    let { children } = $props();

    onMount(() => {
        cardStore.init();
        userDecks.init();
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<AppHeader />

<main>
    {@render children()}
</main>
