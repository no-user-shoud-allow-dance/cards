// NSC is local-first: every deck, learning state and setting lives in the
// browser (IndexedDB/localStorage), so an SSR document of an app page is
// an empty shell — rendering happens client-side by default here. Content
// routes with real server HTML opt back in ((docs)/+layout.ts, /offline).
export const ssr = false;
