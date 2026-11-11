import { error } from "@sveltejs/kit";

import { slugs } from "#lib/utils/docs";

import type { EntryGenerator, PageLoad } from "./$types";

export const prerender = true;

// All docs chapters; the slug is the file name without .md.
export const entries: EntryGenerator = () =>
    slugs.map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
    if (!slugs.includes(params.slug)) {
        error(404, "Kapitel nicht gefunden");
    }
    return { slug: params.slug };
};
