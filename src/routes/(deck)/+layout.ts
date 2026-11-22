import type { LayoutLoad } from "./$types";

/**
 * Every route in this group is /…/[slug]; the slug rides in the layout
 * data so pages and the guard below can use `data.slug` (typed).
 */
export const load: LayoutLoad = ({ params }) => ({
    slug: params.slug ?? "",
});
