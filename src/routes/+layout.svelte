<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { cardStore } from "#lib/store/store.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import AppHeader from "#lib/components/layout/AppHeader.svelte";
    import AppFooter from "#lib/components/layout/AppFooter.svelte";
    import PrivacyToast from "#lib/components/layout/PrivacyToast.svelte";
    import ImpersistentToast from "#lib/components/layout/ImpersistentToast.svelte";

    let { children } = $props();

    onMount(() => {
        cardStore.init();
        userDecks.init();
    });
</script>

<svelte:head>
    {#if !cardStore.googleDisabled}
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
    {/if}
</svelte:head>

<div class="layout">
    <AppHeader />

    <main>
        {@render children()}
    </main>

    <AppFooter />

    <div class="toast-stack">
        <PrivacyToast />
        <ImpersistentToast />
    </div>
</div>

<style>
    .layout {
        display: flex;
        flex-direction: column;

        min-height: 100vh;
    }

    .layout > main {
        flex: 1 0 auto;
    }

    .toast-stack {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 60;

        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.6rem;

        max-width: min(22rem, calc(100vw - 2rem));
    }

    @media (max-width: 540px) {
        .toast-stack {
            right: 0.75rem;
            bottom: 0.75rem;
        }
    }
</style>
