<script lang="ts">
    import "../app.pcss";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import {
        AppFooter,
        AppHeader,
        DialogHost,
        ImpersistentToast,
        PrivacyToast,
        ReadyGate,
        ToastHost,
        decks,
        provideSettingsReady,
        route,
        useMediaQuery,
    } from "#components";
    import { settingsStore, toastStore } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { children } = $props();

    // The layout owns settings initialization: descendants read settings
    // through the reactive context value instead of racing their own
    // init. The page area stays behind a gate until the persisted
    // record has been applied, so pages and toasts never see default
    // values where persisted ones exist.
    const settingsReady = provideSettingsReady();

    // ── Study-mode chrome logic ──────────────────────────────────

    // Study modes (overview, cram) run distraction-free: the global
    // header and footer slide away and only reappear when the mouse
    // enters the top or bottom edge zone of the viewport. Mobile chrome
    // (narrow viewports and touch devices, which have no hover edge
    // zones) keeps the header as a visible in-flow bar and omits the
    // footer (see the media rules below).
    // Distance from the viewport edge that triggers chrome reveal (px).
    const EDGE_ZONE = 80;

    let mouseY = $state<number | null>(null);
    let viewportH = $state(0);
    const narrowQuery = useMediaQuery("(max-width: 700px)");
    const coarseQuery = useMediaQuery("(pointer: coarse)");

    // An unfocused window (e.g. Chrome dev tools) receives no mousemove
    // events, so the edge zones would keep the header hidden — show it
    // for as long as the window is unfocused.
    let windowFocused = $state(true);

    // The mobile chrome layout applies to narrow viewports (phones, and
    // devtools inspection at a narrow width) and to touch devices without
    // a mouse (tablets). Auto-hiding only makes sense elsewhere.
    let mobileChrome = $derived(narrowQuery.matches || coarseQuery.matches);
    let autoHideChrome = $derived(route.isStudyPage && !mobileChrome);

    let showHeader = $derived(
        !autoHideChrome || !windowFocused || (mouseY !== null && mouseY <= EDGE_ZONE)
    );

    let showFooter = $derived(
        !autoHideChrome || (mouseY !== null && viewportH > 0 && mouseY >= viewportH - EDGE_ZONE)
    );

    function handleMousemove(event: MouseEvent): void {
        mouseY = event.clientY;
    }

    function handleResize(): void {
        viewportH = window.innerHeight;
    }

    // The document language and title suffix follow the persisted
    // locale; re-applied on every navigation (svelte:head sets the base
    // title first, this effect runs after it).
    $effect(() => {
        void page.url.pathname;
        const locale = settingsStore.locale;
        document.documentElement.lang = locale;
        const base = document.title.replace(/ \[(de|en)\]$/, "");
        document.title = locale === "de" ? base : `${base} [en]`;
    });

    // P1: a new service worker announces itself via postMessage; the
    // reload only happens after the user confirms the update toast.
    let updateOffered = false;

    function watchServiceWorkerUpdates(): void {
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
            if ((event.data as { type?: unknown } | null)?.type !== "nsc:update-available") return;
            if (updateOffered) return;
            updateOffered = true;
            toastStore.show(UI.updateAvailable, "info", 0, {
                actionLabel: UI.updateAction,
                onAction: () => {
                    void navigator.serviceWorker
                        .getRegistration()
                        .then((reg) => reg?.waiting?.postMessage({ type: "nsc:skip-waiting" }));
                },
            });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
        });
    }

    let fontsLoaded = $state(false);

    $effect(() => {
        document.fonts.ready.then(() => {
            fontsLoaded = true;
        });
    });

    onMount(() => {
        void settingsStore.init().then(() => (settingsReady.ready = true));
        void decks.init();
        watchServiceWorkerUpdates();
        viewportH = window.innerHeight;
        windowFocused = document.hasFocus();
    });
</script>

<svelte:head></svelte:head>

<ReadyGate ready={fontsLoaded}>
    <div
        class="layout"
        class:study-mode={route.isStudyPage}
        class:editor-mode={route.isEditPage}
        class:header-visible={showHeader}
        class:footer-visible={showFooter}
    >
        <AppHeader />

        <main>
            <!-- The gate opens once the persisted settings are applied; on
             the server and during hydration of server-rendered pages the
             content flag keeps the already-rendered page area intact. -->
            {#key settingsReady}
                <ReadyGate ready={settingsReady.ready || settingsReady.content}>
                    {@render children()}
                </ReadyGate>
            {/key}
        </main>

        <AppFooter />

        <!-- Logic-only components: trigger toasts via the store. -->
        <PrivacyToast />
        <ImpersistentToast />

        <!-- Renders all active toasts and the active dialog. -->
        <ToastHost />
        <DialogHost />
    </div>
</ReadyGate>

<svelte:window
    onmousemove={handleMousemove}
    onresize={handleResize}
    onblur={() => (windowFocused = false)}
    onfocus={() => (windowFocused = true)}
/>

<style lang="postcss">
    .layout {
        display: flex;
        flex-direction: column;

        min-height: 100dvh;

        & > main {
            flex: 1 0 auto;
        }
    }

    /* Editor mode (/edit/… only): the editor page runs fullscreen, so
       the header no longer centers its content on the narrow content
       column — it hugs the wider editor with smaller padding. The
       header element lives in AppHeader, so the selector is global. */
    .layout.editor-mode :global(.app-header) {
        padding: 0.7rem clamp(1rem, 2.5dvw, 2.5rem);
    }

    /* ── Study-mode chrome ── */

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

        /* The matching .study-page.full-height rule lives in StudyLayout,
           which owns that element. */
    }

    /* Print (/print/…): the app chrome stays on screen — only the page's
       .print-area reaches the paper. Same component, so these rules win
       over the in-flow header/footer at equal specificity. */
    @media print {
        .layout {
            display: block;
            min-height: 0;
        }

        :global(.app-header),
        :global(.app-footer) {
            display: none;
        }
    }
</style>
