import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageLoad } from "./$types";

// All docs chapters; the slug is the file name without .md.
const slugs = Object.keys(import.meta.glob("/docs/*.md")).map((path) =>
    path.split("/").pop()!.replace(/\.md$/, ""),
);

export const prerender = true;

export const entries: EntryGenerator = () =>
    slugs.map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
    if (!slugs.includes(params.slug)) {
        error(404, "Kapitel nicht gefunden");
    }
    return { slug: params.slug };
};
