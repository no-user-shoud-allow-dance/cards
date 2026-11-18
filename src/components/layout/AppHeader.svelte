<script lang="ts">
    import { resolve } from "$app/paths";
    import { route } from "#components/model/route.svelte";
    import AppLogo from "#components/icons/AppLogo.svelte";
    import BackButton from "#components/icons/BackButton.svelte";
    import Breadcrumbs from "#components/layout/Breadcrumbs.svelte";
    import SettingsLink from "#components/shared/ui/SettingsLink.svelte";

    // Mobile app bar (≤700px): a back button plus the current position
    // replace the logo and breadcrumb path, which wrap and make the
    // header too tall on phones. The home page keeps the logo.
    let backHref = $derived.by(() => {
        switch (route.kind) {
            case "cram":
            case "overview":
            case "export":
            case "edit":
            case "print":
                return resolve("/(deck)/deck/[slug]", { slug: route.deckSlug });
            case "home":
                return null;
            default:
                return resolve("/");
        }
    });
</script>

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

    <Breadcrumbs />

    {#if route.isHomePage}
        <a class="add-link" href={resolve("/(io)/create")} aria-label="Stapel erstellen">
            <span aria-hidden="true">+</span>
        </a>
    {/if}

    <!-- Settings entry point, visible on every page, right of the
         pure-mode toggle. -->
    <SettingsLink href={resolve("/account")} />
</header>

<style lang="postcss">
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
        padding: 0.7rem max(1rem, calc((100dvw - var(--content-width)) / 2 + 1.5rem));

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

        transition: transform var(--transition-spring);

        &:hover {
            transform: scale(1.06);
        }
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
        color: var(--primary-on);

        font-size: 1.1rem;
        font-weight: 600;
        line-height: 1;
        text-decoration: none;

        transition:
            background var(--transition-fast),
            border-color var(--transition-fast),
            transform var(--transition-spring);

        &:hover {
            background: var(--primary-hover);
            border-color: var(--primary-hover);
            transform: scale(1.1);
        }

        &:active {
            transform: scale(0.94);
        }

        &:focus-visible {
            outline: 3px solid var(--focus-ring);
            outline-offset: 2px;
        }
    }

    /* Mobile app bar: back button + current position instead of the
       logo (the logo stays only where there is nowhere to go back to,
       i.e. home — see Breadcrumbs for the title). */
    @media (max-width: 700px) {
        .app-header {
            gap: 0.75rem;
            padding-block: 0.5rem;
        }

        .brand.mobile-hidden {
            display: none;
        }
    }
</style>
