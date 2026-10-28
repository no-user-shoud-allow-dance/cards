import type { LayoutServerLoad } from "./$types";

// Shared by /deck/[slug], /cram/[slug], /overview/[slug],
// /export/[slug] and /edit/[slug]: each page only needs the deck slug;
// the deck itself is loaded client-side from the user's private IndexedDB store.
export const load: LayoutServerLoad = ({ params }) => ({
    slug: params.slug ?? "",
});
