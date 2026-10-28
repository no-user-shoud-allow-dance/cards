import type { DeckType, FlashCard, ParsedDeck } from "../types";
import { DECK_TYPES } from "./deckTypes";

/** Per-language article/gender markers that prefix the question. */
const ARTICLES: Record<DeckType, Set<string>> = {
    english: new Set(["the", "a", "an"]),
    latin: new Set(["m.", "f.", "n."]),
    greek: new Set(["ὁ", "ἡ", "τό", "τοῦ", "τῆς", "τῷ", "τόν", "τήν", "τοί", "ταί", "τά"]),
};

/**
 * Parses a single card line into a FlashCard using the rich syntax:
 *
 *   [article ]question[, form[, form …]] - answer [(info)]
 *
 * A line without article, forms, and info parses to the same result as
 * the old `front - back` format (full backward compatibility).
 */
function parseCardLine(line: string, lineNo: number, deckType: DeckType): FlashCard | string {
    const parts = line.split(" - ");
    if (parts.length === 1) {
        return `Zeile ${lineNo}: Kein " - " gefunden: "${line}"`;
    }
    if (parts.length > 2) {
        return `Zeile ${lineNo}: Mehr als ein " - " gefunden: "${line}"`;
    }

    // --- Left side: article + question + forms ---
    const left = parts[0].trim();
    if (!left) {
        return `Zeile ${lineNo}: Leere Vorder- oder Rückseite`;
    }

    let article: string | undefined;
    let rest = left;

    // Check if the first token is a known article for this deck type.
    const firstSpace = left.indexOf(" ");
    if (firstSpace > 0) {
        const firstToken = left.slice(0, firstSpace);
        if (ARTICLES[deckType].has(firstToken)) {
            article = firstToken;
            rest = left.slice(firstSpace + 1).trim();
        }
    }

    // Split question and forms on the first comma.
    let question = rest;
    let forms: string[] = [];
    const commaIdx = rest.indexOf(",");
    if (commaIdx >= 0) {
        question = rest.slice(0, commaIdx).trim();
        const formsRaw = rest.slice(commaIdx + 1);
        forms = formsRaw
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f.length > 0);
    }

    if (!question) {
        return `Zeile ${lineNo}: Leere Vorder- oder Rückseite`;
    }

    // --- Right side: answer + additional (trailing parenthesized group) ---
    const right = parts[1].trim();
    if (!right) {
        return `Zeile ${lineNo}: Leere Vorder- oder Rückseite`;
    }

    let answer = right;
    let additional: string | undefined;

    // Peel off the last balanced parenthesized group if the answer ends with ")".
    if (right.endsWith(")")) {
        // Find the matching opening paren.
        let depth = 0;
        let openIdx = -1;
        for (let i = right.length - 1; i >= 0; i--) {
            if (right[i] === ")") {
                depth++;
            } else if (right[i] === "(") {
                depth--;
                if (depth === 0) {
                    openIdx = i;
                    break;
                }
            }
        }
        if (openIdx > 0) {
            const before = right.slice(0, openIdx).trim();
            const inside = right.slice(openIdx + 1, -1).trim();
            if (before && inside) {
                answer = before;
                additional = inside;
            }
        }
    }

    const card: FlashCard = {
        id: "",
        question,
        forms,
        answer,
    };
    if (article) card.article = article;
    if (additional) card.additional = additional;

    return card;
}

export function parseDeck(raw: string, deckType: DeckType = "latin"): ParsedDeck {
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

        const result = parseCardLine(trimmed, i + 1, deckType);
        if (typeof result === "string") {
            errors.push(result);
        } else {
            cards.push(result);
        }
    }

    if (titleCount === 0) errors.push("Keine H1-Überschrift gefunden");

    return { title, cards, errors };
}
