<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import AppHeader from "#lib/components/layout/AppHeader.svelte";
    import AppFooter from "#lib/components/layout/AppFooter.svelte";
    import PrivacyToast from "#lib/components/layout/PrivacyToast.svelte";
    import ImpersistentToast from "#lib/components/layout/ImpersistentToast.svelte";

    let { children } = $props();

    // Study modes (overview, cram) run distraction-free: the global
    // header and footer slide away and only reappear when the mouse
    // enters the top or bottom edge zone of the viewport. Mobile chrome
    // (narrow viewports and touch devices, which have no hover edge
    // zones) keeps the header as a visible in-flow bar and omits the
    // footer (see the media rules below).
    let isStudyPage = $derived(
        page.url.pathname.startsWith("/overview/") ||
            page.url.pathname.startsWith("/cram/"),
    );

    // Distance from the viewport edge that triggers chrome reveal (px).
    const EDGE_ZONE = 80;

    let mouseY = $state<number | null>(null);
    let viewportH = $state(0);
    let narrowViewport = $state(false);
    let coarsePointer = $state(false);

    // An unfocused window (e.g. Chrome dev tools) receives no mousemove
    // events, so the edge zones would keep the header hidden — show it
    // for as long as the window is unfocused.
    let windowFocused = $state(true);

    // The mobile chrome layout applies to narrow viewports (phones, and
    // devtools inspection at a narrow width) and to touch devices without
    // a mouse (tablets). Auto-hiding only makes sense elsewhere.
    let mobileChrome = $derived(narrowViewport || coarsePointer);
    let autoHideChrome = $derived(isStudyPage && !mobileChrome);

    let showHeader = $derived(
        !autoHideChrome ||
            !windowFocused ||
            (mouseY !== null && mouseY <= EDGE_ZONE),
    );

    let showFooter = $derived(
        !autoHideChrome ||
            (mouseY !== null && viewportH > 0 && mouseY >= viewportH - EDGE_ZONE),
    );

    function handleMousemove(event: MouseEvent): void {
        mouseY = event.clientY;
    }

    onMount(() => {
        cardStore.init();
        settingStore.init();
        decks.init();
        viewportH = window.innerHeight;
        window.addEventListener("resize", () => {
            viewportH = window.innerHeight;
        });

        const narrowQuery = window.matchMedia("(max-width: 700px)");
        narrowViewport = narrowQuery.matches;
        narrowQuery.addEventListener("change", (event) => {
            narrowViewport = event.matches;
        });

        const coarseQuery = window.matchMedia("(pointer: coarse)");
        coarsePointer = coarseQuery.matches;
        coarseQuery.addEventListener("change", (event) => {
            coarsePointer = event.matches;
        });

        windowFocused = document.hasFocus();
        window.addEventListener("blur", () => {
            windowFocused = false;
        });
        window.addEventListener("focus", () => {
            windowFocused = true;
        });
    });
</script>

<svelte:head>
    {#if !settingStore.googleDisabled}
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

<div
    class="layout"
    class:study-mode={isStudyPage}
    class:header-visible={showHeader}
    class:footer-visible={showFooter}
>
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

<svelte:window onmousemove={handleMousemove} />

<style>
    .layout {
        display: flex;
        flex-direction: column;

        min-height: 100dvh;
    }

    .layout > main {
        flex: 1 0 auto;
    }

    /* Study mode: chrome overlays content and slides in when the
       mouse enters the top or bottom edge zone. z-index sits above
       study content but below modal overlays (z-30+). Only wide
       viewports with a mouse/trackpad get the overlay behavior. */
    @media (min-width: 701px) and (pointer: fine) {
        .layout.study-mode :global(.app-header) {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 25;

            transform: translateY(-100%);
            transition: transform var(--transition-normal);
        }

        .layout.study-mode.header-visible :global(.app-header) {
            transform: translateY(0);
        }

        .layout.study-mode :global(.app-footer) {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 25;

            transform: translateY(100%);
            transition: transform var(--transition-normal);
        }

        .layout.study-mode.footer-visible :global(.app-footer) {
            transform: translateY(0);
        }
    }

    /* Mobile chrome: narrow viewports and touch devices have no hover
       edge zones, so the header stays in the normal flow (always
       visible) and the footer is omitted in study mode — the legal
       links stay one tap away via the header's back button. The study
       page reserves the header height instead of the full viewport. */
    @media (max-width: 700px), (pointer: coarse) {
        .layout.study-mode :global(.app-footer) {
            display: none;
        }

        .layout.study-mode :global(.study-page.full-height) {
            min-height: calc(100dvh - var(--header-h));
        }
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

        max-width: min(22rem, calc(100dvw - 2rem));
    }

    @media (max-width: 540px) {
        .toast-stack {
            right: 0.75rem;
            bottom: 0.75rem;
        }
    }
</style>
