> [!CAUTION]
> Vibe-coded / AI-developed app
> Not yet proofed by a human.

# NSC

![Mistral AI](https://img.shields.io/badge/mistral%20ai-%23FA520F.svg?style=for-the-badge&logo=mistralai&logoColor=white)
![SvelteKit](https://img.shields.io/badge/sveltekit-%23FF3E00.svg?style=for-the-badge&logo=svelte&logoColor=white)
![Svelte](https://img.shields.io/badge/svelte%205-%23FF3E00.svg?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg?style=for-the-badge)

NSC is a local-first flashcard app for learning vocabulary with the Leitner system. Upload your own decks as Markdown, browse them in an overview, or run focused cram sessions with a built-in timer.

## Features

- **Leitner spaced repetition** — Cards progress through 6 boxes based on how well you know them. Cards you struggle with reappear sooner.
- **Cram mode** — Timed study sessions with a countdown clock, break reminders, and a session summary with confetti on completion.
- **Overview mode** — Browse all cards in a deck without affecting your Leitner progress.
- **Deck management** — Upload `.md` decks, organize them into folders, and track per-deck progress. Decks are stored entirely in your browser (IndexedDB).
- **Deck types** — English, Latin, and Altgriechisch. Latin and Greek decks support a "pure mode" that hides translations until you reveal them. The deck type is auto-detected from the content on upload.
- **Share & import** — Export a deck as a share link or import one from a link.
- **Privacy-first** — No accounts, no servers, no tracking. All data stays on your device. Incognito/private windows are detected so you're warned that data won't persist.
- **PWA** — Installable as a standalone app with offline support.
- **Study timer** — Track time spent per deck across sessions.

## Deck format

Decks are plain Markdown files. One H1 title line, then one card per line with front and back separated by ` - `:

```markdown
# Lektion 22

amo - ich liebe
amas - du liebst
amat - er/sie/es liebt
```

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) — App framework (routing, SSR)
- [Svelte 5](https://svelte.dev) — UI framework (runes mode)
- [TypeScript](https://www.typescriptlang.org) — Type safety
- [Vite](https://vite.dev) — Build tool
- [@sveltejs/adapter-vercel](https://svelte.dev/docs/kit/adapter-vercel) — Deployment adapter
- [detectincognitojs](https://github.com/Joe12387/detectIncognito) — Incognito detection for the persistence warning

## Getting started

Prerequisites: [Bun](https://bun.sh) or Node.js 18+

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Type-check
bun run check

# Build for production
bun run build

# Preview the production build
bun run preview
```

## Project structure

```
src/
├── routes/                  # SvelteKit pages
│   ├── +page.svelte         # Home (folder overview, continue learning)
│   ├── upload/              # Upload a new deck
│   ├── (deck)/             # Deck-scoped routes
│   │   ├── deck/[slug]/     # Deck detail & management
│   │   ├── cram/[slug]/     # Cram session (Leitner + timer)
│   │   └── overview/[slug]/ # Overview mode (no Leitner)
│   └── legal/               # Legal pages (Datenschutz, Impressum, Lizenzen)
├── lib/
│   ├── components/          # Svelte components (cram, deck, home, shared, …)
│   ├── composables/         # Reusable stateful logic (sessions, timer)
│   ├── decks/               # Deck parsing & type detection
│   ├── store/               # Svelte 5 runes stores (IndexedDB-backed)
│   └── utils/               # Pure utilities (types, share, time, …)
└── app.html                 # HTML shell
```

## Privacy

All decks and learning progress are stored locally in your browser's IndexedDB. Nothing is sent to a server. If you use a private/incognito window, the app warns you that your data will be lost when the session ends.

## License

[Unlicense](LICENSE) — free and unencumbered software released into the public domain.
