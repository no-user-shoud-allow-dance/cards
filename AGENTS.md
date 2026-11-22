# AGENTS

NSC is a local-first flashcard app for vocabulary learning with the Leitner spaced-repetition system. SvelteKit + Svelte 5 (runes) + TypeScript strict + Vite + Bun. All learning data lives in the browser; the only server is a pseudonymized share-link KV endpoint.

## Rules

- **Tools.**
  Stick to `bun`. `npx` and `npm` are off-limits: they can silently break things. Use `bunx` and `bun` instead.

- **Languages**
  All user-facing strings (labels, buttons, notes, errors, confirmations) ship in **German (default) and English**: every string is added to both locales (`src/messages/languages/de.ts` and `src/messages/languages/en.ts`, typed by the shared `Messages` interface) in the same change, and import sites use the reactive accessor `#messages/locale.svelte`. Code comments and identifiers stay **English**. Legal pages (impressum/datenschutz/lizenzen) and docs chapters stay German-only.

- **Dependencies.**
  No new dependencies without permission. Ask first.
  Once approved: `bun add <package>` (`-d` for dev-only), then document the license in **both** `src/routes/(docs)/legal/lizenzen.md` and `CREDITS` (append at end). Each entry needs: package name, short German description, project URL, verbatim license text. Keep both files in sync.

## Svelte 5

- Runes only: `$state`, `$derived`, `$effect`, `$props`. No legacy `$:` or `export let`.
- Props: `let { … } = $props()` with an explicit `Props` interface.

## Architecture

- **One dependency direction:** `core` → `storage` → `state` → `sync`/`ui` → `routes`. Never import against it. Routes import only via `src/lib/index.ts`.
- **`core/` is pure:** functions and types only. No DOM, no Svelte, no stores, no fetch.
- **Markdown stays in L0.** Raw deck markdown lives only in storage, wire payloads, and the editor textarea (`getRaw`/`putRaw`, the single exception). Everything else works on the `DeckDocument` JSON model. Never parse markdown elsewhere.
- **Errors are codes.** `core` throws typed `NscError`s (`error.code`). German sentences live only in `src/messages/languages/de.ts`. The UI catches once at the boundary and maps code → message. Never hard-code German strings in core/sync logic.
- **Branded types carry invariants.** One branded type (`CardId`, `DeckHash`, `Slug`, `Box`, `EpochMs`, …) means exactly one checked constructor. Plain primitives only at the edges.
- **Persistence is a capability, not a location.** Everything above `storage/` sees only repository interfaces. Never branch on the engine. `storage/engines.ts` decides IndexedDB vs. localStorage vs. memory.
- **UI wording is normative.** Use exactly the German terms from the proposal's terminology table. No synonyms per concept.

## Styling

- All colors, radii, shadows, and transitions come from CSS variables in `src/app.pcss` (`--surface`, `--border`, `--radius-lg`, `--shadow-card`, `--primary`, …). Never hardcode hex colors.
- Component-scoped `<style>` blocks. `:global()` only to target child component classes.
- Nesting through `&`: express selector families inside parents (`&:hover`, `&.modifier`, `& .child`, `& > .child`). Keep a selector flat only when nesting would visibly re-order the cascade against same-property siblings.
- Mobile-first. Shared breakpoint: `@media (max-width: 540px)`.

## Code Review Standards

After completing any implementation, review the code for:

- Functions longer than 30 lines (likely doing too much)
- Logic duplicated more than twice (extract to utility)
- Any `any` type usage in TypeScript (replace with real types)
- Components with more than 3 props that could be grouped into an object
- Missing error handling on async operations

Run /simplify before presenting code to the user.
