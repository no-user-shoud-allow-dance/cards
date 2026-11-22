// The offline fallback page must be a self-contained document that works
// without JS, so it opts back into SSR and stays prerendered/static.
export const ssr = true;
export const prerender = true;
