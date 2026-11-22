import type { PageRouteId } from "$app/types";
import type { Component } from "svelte";

import * as c01 from "./chapters/01-was-ist-nsc.svx";
import * as c02 from "./chapters/02-loslegen.svx";
import * as c03 from "./chapters/03-lernen.svx";
import * as c04 from "./chapters/04-teilen-und-sync.svx";
import * as c05 from "./chapters/05-deck-format.svx";
import * as c06 from "./chapters/06-account.svx";
import * as c07 from "./chapters/07-entwickler.svx";

export interface ChapterModule {
    default: Component;
    metadata?: { title?: string; description?: string; icon?: string };
}

// Explicit registry of all doc chapters. The chapter bodies live here as
// chapters/NN-slug.svx (compiled by mdsvex); each route NN-slug/+page.svelte
// is a thin wrapper rendering DocsChapterBody. The index page, the chapter
// chrome in the docs layout and the pager all read from this list, so they
// always agree. Chapter order = the order here (numeric prefix).
export const chapters: { slug: string; mod: ChapterModule }[] = [
    { slug: "01-was-ist-nsc", mod: c01 },
    { slug: "02-loslegen", mod: c02 },
    { slug: "03-lernen", mod: c03 },
    { slug: "04-teilen-und-sync", mod: c04 },
    { slug: "05-deck-format", mod: c05 },
    { slug: "06-account", mod: c06 },
    { slug: "07-entwickler", mod: c07 },
];

// Route id for a chapter slug (chapters are static routes, no params);
// "" is the /docs index itself. resolve()'s overloads accept only a single
// literal route id per call, so call sites cast the returned union to one
// member — safe because chapter ids are static: resolve_route() passes them
// through unchanged (only stripping the "(docs)" group).
export function routeIdOf(slug: string): PageRouteId {
    return (slug === "" ? "/(docs)/docs" : `/(docs)/docs/${slug}`) as PageRouteId;
}

export function chapterMeta(slug: string) {
    const mod = chapters.find((c) => c.slug === slug)?.mod;
    return {
        title: mod?.metadata?.title ?? "Dokumentation",
        description: mod?.metadata?.description ?? "",
        icon: mod?.metadata?.icon ?? "",
    };
}

// Previous/next chapter for the pager on chapter pages.
export function neighbors(slug: string): {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
} {
    const i = chapters.findIndex((c) => c.slug === slug);
    const toEntry = (index: number) => ({
        slug: chapters[index].slug,
        title: chapterMeta(chapters[index].slug).title,
    });
    return {
        prev: i > 0 ? toEntry(i - 1) : null,
        next: i >= 0 && i < chapters.length - 1 ? toEntry(i + 1) : null,
    };
}
