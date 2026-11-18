// useMediaQuery.svelte.ts — reactive boolean for one media query.
// The change listener lives in an $effect, so it is torn down with the
// calling component; the initial value stays false during SSR.
export function useMediaQuery(query: string): { readonly matches: boolean } {
    let matches = $state(false);

    $effect(() => {
        const media = window.matchMedia(query);
        matches = media.matches;
        const handleChange = (event: MediaQueryListEvent): void => {
            matches = event.matches;
        };
        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    });

    return {
        get matches() {
            return matches;
        },
    };
}
