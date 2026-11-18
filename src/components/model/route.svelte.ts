// route.svelte.ts — single source of truth for route classification.
// Everything derives from `page` ($app/state), so the module is SSR-safe
// and every importer shares the same reactive values.
import { page } from "$app/state";

export type RouteKind =
    | "home"
    | "deck"
    | "draft"
    | "cram"
    | "overview"
    | "export"
    | "edit"
    | "print"
    | "docs"
    | "account"
    | "io"
    | "protocols"
    | "legal"
    | "offline"
    | "unknown";

const path = $derived(page.url.pathname);

// /export/[slug]…, /edit/[slug]…, /print/[slug]/… — deck sub-pages with a
// slug segment, like cram/overview.
const isDeckExportPath = $derived(/^\/export\/[^/]+(\/|$)/.test(path));
const isEditPath = $derived(/^\/edit\/[^/]+(\/|$)/.test(path));
const isPrintPath = $derived(/^\/print\/[^/]+(\/|$)/.test(path));

const kind = $derived.by((): RouteKind => {
    if (path === "/") return "home";
    if (path.startsWith("/deck/")) return "deck";
    if (path.startsWith("/draft/")) return "draft";
    if (path.startsWith("/cram/")) return "cram";
    if (path.startsWith("/overview/")) return "overview";
    if (isDeckExportPath) return "export";
    if (isEditPath) return "edit";
    if (isPrintPath) return "print";
    if (path.startsWith("/docs")) return "docs";
    if (path.startsWith("/legal/")) return "legal";
    if (path === "/account") return "account";
    // (io) routes: create/upload/import — the group name is not in the URL.
    if (/^\/(create|upload|import)(\/|$)/.test(path)) return "io";
    // (protocols) routes: single-letter paths /c/…, /k/…, /p/…, /s/…, /t/….
    if (/^\/[cpkst](\/|$)/.test(path)) return "protocols";
    if (path === "/offline") return "offline";
    return "unknown";
});

export const route = {
    get path() {
        return path;
    },
    get kind() {
        return kind;
    },
    get isHomePage() {
        return path === "/";
    },
    get isDeckPage() {
        return path.startsWith("/deck/");
    },
    get isCramPage() {
        return path.startsWith("/cram/");
    },
    get isOverviewPage() {
        return path.startsWith("/overview/");
    },
    get isDeckExportPage() {
        return isDeckExportPath;
    },
    get isEditPage() {
        return isEditPath;
    },
    get isPrintPage() {
        return isPrintPath;
    },
    /** Deck pages and their sub-pages show the home link and folder crumb. */
    get isDeckSubPage() {
        return (
            kind === "deck" ||
            kind === "draft" ||
            kind === "cram" ||
            kind === "overview" ||
            kind === "export" ||
            kind === "edit" ||
            kind === "print"
        );
    },
    /** Study modes (overview, cram) drive the chrome auto-hide. */
    get isStudyPage() {
        return kind === "overview" || kind === "cram";
    },
    get isDocsPage() {
        return path.startsWith("/docs");
    },
    get isLegalPage() {
        return path.startsWith("/legal/");
    },
    get deckSlug() {
        return page.params.slug ?? "";
    },
};
