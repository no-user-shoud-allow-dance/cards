# AGENTS.md — NSC

NSC is a local-first flashcard app for vocabulary learning with the Leitner
spaced-repetition system. SvelteKit + Svelte 5 (runes) + TypeScript + Vite.
All data lives in the browser (IndexedDB); there is no backend.

## Hard rules

- **No checks.** Do not run `bun run check`, `svelte-check`, `tsc`, linters,
  or any test/build command unless the user explicitly asks. The user handles
  verification themselves.
- **Bun for checks.** If a check is undeniably needed (user asked), use
  `bun` — e.g. `bun run check`, `bun x tsc --noEmit`. Prefer `bun` over
  `npx`/`npm` for any ad-hoc tooling.

## Language

- **UI text is German.** All user-facing strings (labels, buttons, notes,
  errors, confirmations) must be in German.
- Code comments and identifiers are in English.

## Svelte 5 conventions

- Use **runes** (`$state`, `$derived`, `$effect`, `$props`) — never the
  legacy `$:` syntax or `export let`.
- Component props are declared via `let { … } = $props()`.
- Shared UI components live in `src/lib/components/shared/ui/` (plus
  `src/lib/components/shared/` for app-level wrappers like ResetButton).
- Feature components live under `src/lib/components/<feature>/`
  (decks, home, learning, sharing, layout).
- Composable logic (session/timer state) lives in `src/lib/composables/`.

## Styling

- All colors, radii, shadows, and transitions come from CSS custom properties
  defined in `src/app.css` (e.g. `var(--surface)`, `var(--border)`,
  `var(--radius-lg)`, `var(--shadow-card)`, `var(--primary)`).
- Never hardcode hex colors in component styles; use the variables.
- Component-scoped `<style>` blocks; use `:global()` only when targeting
  child component classes.
- Mobile-first: there is a `@media (max-width: 540px)` breakpoint pattern
  used across pages.

## Architecture notes

- **Decks** are stored in IndexedDB via the `decks` store
  (`src/lib/stores/data/deckStore.svelte.ts`). Each deck has a `slug`
  (derived from content hash + random suffix) and a `contentHash` (hash of
  raw markdown + deck type). Adding a deck dedups by `contentHash`.
- **Share links** carry data in the URL hash: `#c.…` (deck), `#p.…`
  (progress), `#t.…` (combined). Payloads are gzip-compressed + base64url
  encoded. See `src/lib/utils/share.ts` for the full protocol.
- **Learning state** (Leitner boxes, overview done, study time, timer) is in
  `src/lib/stores/persistent/` — persisted to `localStorage` through the
  typed schema helpers in `src/lib/storages/localStorage.ts` (prefix `kk_`;
  raw keys outside the schema must use the exported `PREFIX`).
- **Deck types**: `english`, `latin`, `greek`. Latin and Greek support "pure
  mode" (hides translations until revealed).

## Adding a new library

If a new dependency is ever needed, follow this order:

1. **Prompt the user first.** Ask for permission before installing anything.
   Do not install packages unilaterally.
2. **On approval, install** with `bun add <package>` (or `bun add -d` for
   dev-only deps).
3. **Add it to the licenses page** — `src/routes/legal/lizenzen/+page.svelte`.
   Add an entry to the `libraries` array with the package name, a short
   German description, the project URL, and the verbatim license text.
4. **Add it to `CREDITS`** — append a section at the end of the `CREDITS`
   file with the same information: name, description, package/project links,
   and the full license text.

Both the licenses page and `CREDITS` must stay in sync — every runtime
dependency must appear in both.

## File layout

```
src/
  lib/
    components/         — feature + layout components
      shared/ui/        — generic UI (Button, Card, Dialog, Page, …)
      shared/           — app-level wrappers (ResetButton, ResetProgress)
      decks|home|learning|sharing|layout/
    composables/        — useCramSession, useOverviewSession, useStudyTimer
    stores/
      data/             — IndexedDB-backed stores (deckStore, IndexedDbStore)
      persistent/       — localStorage-backed stores (LocalStorageStore)
      session/          — dialog + toast stores
    storages/           — typed localStorage / IndexedDB wrappers
    sync/               — local profile (account) + avatar
    types/              — shared types
    utils/              — pure helpers (parser, share, pure, studyActions, …)
  routes/
    (deck)/             — deck-scoped pages (deck, cram, overview, edit, export)
    (io)/               — create / upload / import pages
    +page.svelte        — home (deck list)
```
