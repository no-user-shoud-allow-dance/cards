---
title: Das Deck-Format
description: Wie eine Stapel-Datei aufgebaut ist — inklusive Formatierung, Hinweisen und Bildern.
icon: "/icons/docs/05-deck-format.svg"
---

Ein Stapel ist eine einfache Textdatei (Markdown):

```markdown
# Lektion 22

amo - ich liebe
amas - du liebst
amat - er/sie/es liebt
```

- Die **erste Zeile** mit `#` ist der Titel des Stapels.
- Jede weitere Zeile ist **eine Karte**: Vorderseite und Rückseite, getrennt durch das erste ` - `. Die Rückseite darf selbst ` - ` enthalten.
- Leerzeilen und Zeilen ohne ` - ` werden übersprungen bzw. als Fehler gemeldet.

## Formatierung im Text

In KartenTexten funktioniert eine kleine Auswahl an Formatierung (alles andere bleibt normaler Text):

| Syntax | Ergebnis |
| --- | --- |
| `` `code` `` | `code` |
| `**fett**` | **fett** |
| `*kursiv*` | *kursiv* |
| `++unterstrichen++` | unterstrichen |
| `~~durchgestrichen~~` | ~~durchgestrichen~~ |
| `==markiert==` | markiert |
| `^hoch^` | hochgestellt |
| `~tief~` | tiefgestellt |

## Hinweise (Hints)

Auf der **Vorderseite** darf ein Hinweis in eckigen Klammern stehen:

```markdown
ἀγάπη [Liebe] - love
```

So wird diese Karte in beiden Modi angezeigt:

| | Pur-Modus an | Pur-Modus aus |
| --- | --- | --- |
| **Vorderseite** | <svg width="110" height="26" viewBox="0 0 110 26" role="img" aria-label="Vorderseite im Pur-Modus: αγαπη"><rect x="1" y="1" width="108" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/><text x="55" y="17" text-anchor="middle" font-size="10" fill="var(--text)">αγαπη</text></svg> | <svg width="110" height="26" viewBox="0 0 110 26" role="img" aria-label="Vorderseite normal: ἀγάπη Liebe"><rect x="1" y="1" width="108" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/><text x="55" y="17" text-anchor="middle" font-size="9" fill="var(--text)">ἀγάπη Liebe</text></svg> |
| **Rückseite** | <svg width="130" height="26" viewBox="0 0 130 26" role="img" aria-label="Rückseite im Pur-Modus: ἀγάπη Liebe: love"><rect x="1" y="1" width="128" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/><text x="65" y="16.5" text-anchor="middle" font-size="8" fill="var(--text-muted)">ἀγάπη Liebe: love</text></svg> | <svg width="110" height="26" viewBox="0 0 110 26" role="img" aria-label="Rückseite normal: love"><rect x="1" y="1" width="108" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/><text x="55" y="17" text-anchor="middle" font-size="10" fill="var(--text-muted)">love</text></svg> |

Im Normalmodus werden die Klammern versteckt und der Hinweis inline angezeigt. Im Pur-Modus (Latein/Griechisch) wird der Hinweis ganz ausgeblendet und die Diakritika werden entfernt — du siehst dann nur `αγαπη`. Auf der Rückseite steht im Pur-Modus „Vorderseite: Antwort“.

## Bilder

Beide Seiten akzeptieren **ein Bild** über `![alt-text](https://…)` — nur `https://`-Adressen sind erlaubt.
