import type { DeckType, FlashCard, ParsedDeck } from "../types";

/**
 * Parses a single card line into a FlashCard:
 *
 *   front - back
 *
 * The front side may contain bracketed hints, e.g.
 *   ἀγάπη [Liebe] - love
 * In normal mode the brackets are hidden (content shown); in pure
 * mode both brackets and content are removed.
 */
function parseCardLine(line: string, lineNo: number): FlashCard | string {
    const parts = line.split(" - ");
    if (parts.length === 1) {
        return `Zeile ${lineNo}: Kein " - " gefunden: "${line}"`;
    }
    if (parts.length > 2) {
        return `Zeile ${lineNo}: Mehr als ein " - " gefunden: "${line}"`;
    }

    const front = parts[0].trim();
    const back = parts[1].trim();

    if (!front || !back) {
        return `Zeile ${lineNo}: Leere Vorder- oder Rückseite`;
    }

    return { id: "", front, back };
}

export function parseDeck(raw: string, _deckType: DeckType = "latin"): ParsedDeck {
    const lines = raw.split(/\r?\n/);
    let title: string | null = null;
    let titleCount = 0;
    const cards: FlashCard[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("# ")) {
            titleCount++;
            if (titleCount > 1) {
                errors.push(`Zeile ${i + 1}: Mehr als eine H1-Überschrift gefunden`);
            } else {
                title = trimmed.slice(2).trim();
            }
            continue;
        }

        const result = parseCardLine(trimmed, i + 1);
        if (typeof result === "string") {
            errors.push(result);
        } else {
            cards.push(result);
        }
    }

    if (titleCount === 0) errors.push("Keine H1-Überschrift gefunden");

    return { title, cards, errors };
}
