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

Im Normalmodus werden die Klammern versteckt und der Hinweis inline angezeigt. Im Pur-Modus (Latein/Griechisch) wird der Hinweis ganz ausgeblendet — du siehst dann nur `ἀγάπη`.

## Bilder

Beide Seiten akzeptieren **ein Bild** über `![alt-text](https://…)` — nur `https://`-Adressen sind erlaubt.
