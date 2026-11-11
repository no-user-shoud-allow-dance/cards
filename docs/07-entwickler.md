---
title: Für Entwickler:innen
description: Projekt lokal starten, Architektur, Speicher, Parsen, Sync und Konventionen.
icon: "/icons/docs/07-entwickler.svg"
---

## Lokal starten

Voraussetzung: [Bun](https://bun.sh) oder Node.js 18+.

```bash
bun install      # Abhängigkeiten installieren
bun run dev      # Dev-Server starten
bun run check    # Typprüfung
bun run build    # Produktions-Build
bun run preview  # Build lokal ansehen
```

## Architektur

NSC ist **local-first**: Es gibt kein Backend. Alle Daten liegen im Browser — Stapel in der IndexedDB, Fortschritt/Einstellungen/Lernzeit im Local Storage.

Stack: SvelteKit + Svelte 5 (Runes), TypeScript, Vite, adapter-vercel; Laufzeit-Bibliotheken: PeerJS (Sync), qr-code-styling (QR-Codes), detectincognitojs (Privatmodus-Erkennung).

```
src/
├── routes/            # SvelteKit-Seiten
│   ├── +page.svelte   # Startseite (Ordner, Weiterlernen)
│   ├── docs/          # diese Dokumentation (Markdown aus /docs, via mdsvex)
│   ├── account/       # Konto: Sync (Host/Join), Daten löschen
│   ├── (io)/          # Stapel erstellen / hochladen / importieren
│   ├── (deck)/        # deck/[slug], cram/[slug], overview/[slug], edit, export
│   └── legal/         # Impressum, Datenschutz, Lizenzen
└── lib/
    ├── components/    # Feature- und UI-Komponenten
    ├── composables/   # useCramSession, useOverviewSession, useStudyTimer
    ├── stores/        # data (IndexedDB), persistent (Local Storage), session
    ├── storages/      # typisierte Wrapper für Local Storage / IndexedDB
    ├── sync/          # Geräte-Sync über PeerJS/WebRTC
    ├── types/         # gemeinsame Typen
    └── utils/         # parser, share, inlineFormat, pure, …
```

Die Dokumentation liegt als Markdown im Ordner `docs/` im Projektverzeichnis und wird über mdsvex zur Build-Zeit als Svelte-Komponenten kompiliert (`vite.config.ts`), gerendert unter `/docs`.

## Speicher und Datenfluss

- **IndexedDB** — die Stapel, verwaltet über den `deckStore` (`src/lib/stores/data/deckStore.svelte.ts`, generischer Wrapper in `indexedDbStore.ts`). Jeder Stapel hat einen `slug` (für die URL, aus Inhalts-Hash + Zufallsuffix) und einen `contentHash` (Hash aus Roh-Markdown + Deck-Typ); darüber werden Duplikate beim Hinzufügen erkannt.
- **Local Storage** — Lernfortschritt, Einstellungen, Lernzeit und Timer über typisierte Wrapper (`src/lib/storages/localStorage.ts`, Schlüssel-Präfix `kk_`) und die Stores in `src/lib/stores/persistent/` (`cardStore`, `settingStore`, `studyTimeStore`, `timerStateStore`).
- Der Lernfortschritt liegt im `cardStore`; `BOX_COUNT = 6` in `src/lib/types/learning.ts` — eine Karte in Box VI gilt als gelernt.

## Deck-Format, Parsen und Rendering

- **Parsen**: `src/lib/utils/parser.ts` — Split am ersten ` - `, `\n`-Escapes für echte Zeilenumbrüche, Bild-URL-Validierung (nur `https://`, max. 1 Bild pro Seite).
- **Sprachtyp-Erkennung**: `src/lib/utils/deckTypes.ts` (Englisch/Latein/Griechisch, inkl. Pur-Modus je Typ).
- **Inline-Formatierung**: `src/lib/utils/inlineFormat.ts` — Allowlist der Tags (`code, b, i, u, s, mark, sup, sub`); `parseRichText` baut einen Knotenbaum, den `RichText.svelte` ohne `{@html}` rendert (sicher gegen fremde Decks aus Share-Links).
- **Anzeigetexte**: `src/lib/utils/pure.ts` (`displayFront` / `displayBack` / `purePrompt` mit Diakritika-Ersetzung über `replacements.ts`).

## Lernen: Sessions, Leitner und Timer

- Die Session-Logik liegt in den Composables `useCramSession` und `useOverviewSession` (`src/lib/composables/`), der Timer in `useStudyTimer`; Bewertungen laufen über `src/lib/utils/studyActions.ts`.
- `displayFront`/`displayBack` aus `pure.ts` blenden im Normalmodus die Klammern von [Hints](/docs/05-deck-format) aus, im Pur-Modus zusätzlich den Hinweis-Text und normalisieren Diakritika (Griechisch ohne Atemzeichen/Tonos, Latein ohne Makrons).

## Teilen und Sync

- **Share-Protokoll**: `src/lib/utils/share.ts` — gzip-komprimiert und base64url-kodiert im URL-Hash, Präfixe `#c.…` (Deck), `#p.…` (Fortschritt), `#t.…` (kombiniert). Der Hash verlässt den Browser nie.
- **QR-Codes**: erzeugt von `qr-code-styling` in `src/lib/components/sharing/QrCode.svelte`, gescannt über `QrScanner.svelte`.
- **Geräte-Sync**: `src/lib/sync/peer.ts` — Host mit Peer-ID `nsc-<zufall>`, Join per QR-Code/Paste; die Peer-ID ist der Trust-Anchor. Der Signalisierungs-Server sieht nur den Handshake (IP/Port), die Daten laufen danach direkt und verschlüsselt per WebRTC.
- **Sync-Paket**: `src/lib/sync/payload.ts` — alle Decks als Roh-Markdown plus Fortschritt je `contentHash`; Merge über `applyProgress` („die höhere Box gewinnt"), die Study-Time bleibt gerätelokal.

## Konventionen (siehe auch AGENTS.md)

- **Sprache**: UI-Texte auf Deutsch, Code-Kommentare und Bezeichner auf Englisch.
- **Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$props`) — keine Legacy-Syntax.
- **Styling**: Farben, Radien, Schatten und Übergänge nur über CSS-Variablen aus `src/app.css`; komponenten-lokale `<style>`-Blöcke; mobile-first mit `@media (max-width: 540px)`.
- **Neue Abhängigkeiten** nur nach Rückfrage; Eintrag dann zusätzlich in die Lizenzseite (`/legal/lizenzen`) und in `CREDITS`.

## Diese Dokumentation erweitern

Einfach eine neue Datei `docs/NN-thema.md` anlegen — mit Frontmatter (`title`, `description`, `icon`) erscheint sie automatisch im Inhaltsverzeichnis unter `/docs` und als Seite unter `/docs/NN-thema`. Die Kapitel-Reihenfolge ergibt sich aus der Nummer im Dateinamen; das Icon liegt als SVG unter `static/icons/docs/`. Optional ergänzt du einen Eintrag in `PER_PAGE` in `src/routes/docs/+layout.svelte`, damit die Kapitel-Seite passende animierte Screenshots in der Seitenleiste zeigt — ohne Eintrag erscheint dort die Gesamtübersicht.
