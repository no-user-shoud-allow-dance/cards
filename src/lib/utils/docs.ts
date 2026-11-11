import type { Component } from "svelte";

export interface DocModule {
    default: Component;
    metadata?: { title?: string; description?: string; icon?: string };
}

// All docs chapters, compiled from markdown by mdsvex (vite.config.ts).
// Single source of truth for the index page, the chapter page and the
// prerender entries, so all three always agree.
export const docs = import.meta.glob("/docs/*.md", {
    eager: true,
}) as Record<string, DocModule>;

// Chapter order comes from the numeric prefix of the file name.
export const slugs = Object.keys(docs)
    .map((path) => path.split("/").pop()!.replace(/\.md$/, ""))
    .sort((a, b) => a.localeCompare(b));

export function chapterMeta(slug: string) {
    const mod = docs[`/docs/${slug}.md`];
    return {
        mod,
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
    const i = slugs.indexOf(slug);
    const toEntry = (s: string) => ({ slug: s, title: chapterMeta(s).title });
    return {
        prev: i > 0 ? toEntry(slugs[i - 1]) : null,
        next: i >= 0 && i < slugs.length - 1 ? toEntry(slugs[i + 1]) : null,
    };
}
