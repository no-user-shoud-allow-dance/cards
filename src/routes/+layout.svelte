<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";
    import BackButton from "#lib/components/shared/ui/BackButton.svelte";
    import AppLogo from "#lib/components/shared/ui/AppLogo.svelte";
    import PrivacyToast from "#lib/components/layout/PrivacyToast.svelte";
    import ImpersistentToast from "#lib/components/layout/ImpersistentToast.svelte";
    import ToastHost from "#lib/components/layout/ToastHost.svelte";
    import DialogHost from "#lib/components/layout/DialogHost.svelte";

    let { children } = $props();

    // ── AppHeader logic ──────────────────────────────────────────

    const formatSlug = (slug: string) =>
        slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    let routePath = $derived(page.url.pathname);
    let isHomePage = $derived(routePath === "/");
    let isDeckPage = $derived(routePath.startsWith("/deck/"));
    let isCramPage = $derived(routePath.startsWith("/cram/"));
    let isOverviewPage = $derived(routePath.startsWith("/overview/"));
    // /export/[slug]… — a deck sub-page, like cram/overview.
    let isDeckExportPage = $derived(
        /^\/export\/[^/]+(\/|$)/.test(routePath),
    );
    // Deck pages and their sub-pages show the home link and folder crumb.
    let isDeckSubPage = $derived(
        isDeckPage || isCramPage || isOverviewPage || isDeckExportPage,
    );
    let slug = $derived(page.params.slug ?? "");
    let deck = $derived(slug ? decks.load(slug) : null);

    let deckName = $derived(
        deck?.name || formatSlug(slug) || "Stapel",
    );

    // Folder crumb is only known once the deck is loaded (user decks load
    // client-side, so it stays empty during SSR for uploaded decks).
    let deckFolder = $derived(deck?.folder ?? "");

    // The deck defines whether a pure mode exists for it.
    let pureModeAvailable = $derived(deck?.pureMode ?? false);

    // Mobile app bar (≤700px): a back button plus the current position
    // replace the logo and breadcrumb path, which wrap and make the
    // header too tall on phones. The home page keeps the logo.
    let backHref = $derived.by(() => {
        if (isCramPage || isOverviewPage || isDeckExportPage) {
            return resolve("/(deck)/deck/[slug]", { slug });
        }
        if (isDeckPage) return resolve("/");
        if (routePath === "/") return null;
        return resolve("/");
    });

    let mobileTitle = $derived.by(() => {
        if (isCramPage) return `${deckName} · Lernmodus`;
        if (isOverviewPage) return `${deckName} · Übersicht`;
        if (isDeckExportPage) return `${deckName} · Exportieren`;
        if (isDeckPage) return deckName;
        return "";
    });

    // ── Study-mode chrome logic ──────────────────────────────────

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
    <!-- ── AppHeader (inlined) ── -->
    <header class="app-header">
        {#if backHref}
            <BackButton href={backHref} />
        {/if}

        <a
            class="brand"
            class:mobile-hidden={backHref !== null}
            href={resolve("/")}
            aria-label="NSC – zur Startseite"
        >
            <AppLogo />
        </a>

        <nav class="breadcrumbs" aria-label="Brotkrumennavigation">
            <ol>
                <li>
                    {#if isDeckSubPage}
                        <a href={resolve("/")}>~</a>
                    {:else}
                        <span aria-current="page">~</span>
                    {/if}
                </li>

                {#if isDeckSubPage && deckFolder}
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <span class="breadcrumb-folder">{deckFolder}</span>
                    </li>
                {/if}

                {#if isDeckExportPage}
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <a href={resolve("/(deck)/deck/[slug]", { slug })}>{deckName}</a>
                    </li>
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <span aria-current="page">Exportieren</span>
                    </li>
                {:else if isDeckPage}
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <span aria-current="page">{deckName}</span>
                    </li>
                {:else if isCramPage}
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <a href={resolve("/(deck)/deck/[slug]", { slug })}>{deckName}</a>
                    </li>
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <span aria-current="page">Lernmodus</span>
                    </li>
                {:else if isOverviewPage}
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <a href={resolve("/(deck)/deck/[slug]", { slug })}>{deckName}</a>
                    </li>
                    <li>
                        <span class="separator" aria-hidden="true">/</span>
                        <span aria-current="page">Übersicht</span>
                    </li>
                {/if}
            </ol>
        </nav>

        {#if isHomePage}
            <a
                class="add-link"
                href={resolve("/(io)/create")}
                aria-label="Stapel erstellen"
            >
                <span aria-hidden="true">+</span>
            </a>
        {/if}

        {#if mobileTitle}
            <span class="mobile-title">{mobileTitle}</span>
        {/if}

        {#if pureModeAvailable}
            <Toggle
                label="Pur-Modus"
                checked={settingStore.pureMode}
                onchange={(value) => settingStore.setPureMode(value)}
            />
        {/if}
    </header>

    <main>
        {@render children()}
    </main>

    <!-- ── AppFooter (inlined) ── -->
    <footer class="app-footer">
        <nav class="footer-nav" aria-label="Rechtliches">
            <a href={resolve("/legal/impressum")}>Impressum</a>
            <span class="separator" aria-hidden="true">·</span>
            <a href={resolve("/legal/datenschutz")}>Datenschutz</a>
            <span class="separator" aria-hidden="true">·</span>
            <a href={resolve("/legal/lizenzen")}>Lizenzen</a>
        </nav>
    </footer>

    <!-- Logic-only components: trigger toasts via the store. -->
    <PrivacyToast />
    <ImpersistentToast />

    <!-- Renders all active toasts and the active dialog. -->
    <ToastHost />
    <DialogHost />
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

    /* ── AppHeader styles (inlined) ── */

    .app-header {
        position: sticky;
        top: 0;
        z-index: 10;

        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 1rem;

        width: 100%;
        min-height: var(--header-h);
        padding: 0.7rem
            max(1rem, calc((100dvw - var(--content-width)) / 2 + 1.5rem));

        background: var(--surface);
        border-bottom: 1px solid var(--border);
    }

    .brand {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.55rem;

        color: var(--text);
        text-decoration: none;
    }

    .breadcrumbs {
        flex: 1;
        min-width: 0;

        color: var(--text-muted);
        font-size: 0.85rem;
    }

    .breadcrumbs ol {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.45rem;

        margin: 0;
        padding: 0;
        list-style: none;
    }

    .breadcrumbs li {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;

        min-width: 0;
    }

    .breadcrumbs a {
        color: var(--text-muted);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .breadcrumbs a:hover {
        color: var(--primary);
    }

    .breadcrumbs [aria-current="page"] {
        color: var(--text);
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .breadcrumbs .breadcrumb-folder {
        color: var(--text-muted);
        font-weight: 500;
        overflow-wrap: anywhere;
    }

    .breadcrumbs .separator {
        color: var(--border-strong);
        user-select: none;
    }

    /* Current position shown next to the back button on mobile. */
    .mobile-title {
        display: none;
        flex: 1;
        min-width: 0;

        overflow: hidden;
        color: var(--text);
        font-size: 0.95rem;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ── "+" add-link (home page only) ── */

    .add-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;

        width: 1.8rem;
        height: 1.8rem;
        padding: 0;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);

        font-size: 1.1rem;
        font-weight: 600;
        line-height: 1;
        text-decoration: none;

        transition:
            background var(--transition-fast),
            border-color var(--transition-fast);
    }

    .add-link:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
    }

    .add-link:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
    }

    /* Mobile app bar: back button + current position instead of the
       logo and the breadcrumb path (which wrap and make the header
       too tall). The logo stays only where there is nowhere to go
       back to (home). */
    @media (max-width: 700px) {
        .app-header {
            gap: 0.75rem;
            padding-block: 0.5rem;
        }

        .breadcrumbs {
            display: none;
        }

        .brand.mobile-hidden {
            display: none;
        }

        :global(.back-button) {
            display: inline-flex;
        }

        .mobile-title {
            display: block;
        }
    }

    /* ── AppFooter styles (inlined) ── */

    .app-footer {
        display: flex;
        align-items: center;
        justify-content: center;

        min-height: var(--footer-h);
        padding: 0.75rem 1.5rem;

        border-top: 1px solid var(--border);
        background: var(--surface);
    }

    .footer-nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;

        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 500;
    }

    .footer-nav a {
        color: var(--text-muted);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .footer-nav a:hover {
        color: var(--primary);
    }

    .footer-nav .separator {
        color: var(--border-strong);
        user-select: none;
    }

    /* ── Study-mode chrome ── */

    /* Study mode: chrome overlays content and slides in when the
       mouse enters the top or bottom edge zone. z-index sits above
       study content but below modal overlays (z-30+). Only wide
       viewports with a mouse/trackpad get the overlay behavior. */
    @media (min-width: 701px) and (pointer: fine) {
        .layout.study-mode .app-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 25;

            transform: translateY(-100%);
            transition: transform var(--transition-normal);
        }

        .layout.study-mode.header-visible .app-header {
            transform: translateY(0);
        }

        .layout.study-mode .app-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 25;

            transform: translateY(100%);
            transition: transform var(--transition-normal);
        }

        .layout.study-mode.footer-visible .app-footer {
            transform: translateY(0);
        }
    }

    /* Mobile chrome: narrow viewports and touch devices have no hover
       edge zones, so the header stays in the normal flow (always
       visible) and the footer is omitted in study mode — the legal
       links stay one tap away via the header's back button. The study
       page reserves the header height instead of the full viewport. */
    @media (max-width: 700px), (pointer: coarse) {
        .layout.study-mode .app-footer {
            display: none;
        }

        .layout.study-mode :global(.study-page.full-height) {
            min-height: calc(100dvh - var(--header-h));
        }
    }
</style>
