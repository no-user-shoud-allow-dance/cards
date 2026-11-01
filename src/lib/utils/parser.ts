import type { CardImage, CardImageRef, FlashCard, ParsedDeck } from "../types";

/**
 * Matches one markdown image token `![alt](url)`: no whitespace between
 * the brackets or inside the URL (standard markdown). A ` - ` inside a
 * URL therefore never matches — it breaks the " - " line split below and
 * is rejected there with an error. The URL capture is greedy up to the
 * last `)` before whitespace, so URLs that themselves contain parentheses
 * (e.g. `javascript:alert(1)`) still match and are then rejected by the
 * https-only validation.
 */
const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^\s]+)\)/g;

/**
 * Security boundary: only absolute https URLs are allowed as image
 * sources. Decks arrive from other users via share links, so arbitrary
 * schemes (javascript:, data:, …) must never reach an `<img src>`.
 */
function isValidImageUrl(url: string): boolean {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * The valid image tokens of a text as alt + URL. Only https URLs are
 * returned — only those may be rendered as `<img src>`.
 */
export function extractImages(text: string): CardImage[] {
    const images: CardImage[] = [];
    for (const match of text.matchAll(IMAGE_PATTERN)) {
        const alt = match[1] ?? "";
        const url = match[2] ?? "";
        if (isValidImageUrl(url)) images.push({ alt, url });
    }
    return images;
}

/**
 * Replaces every image token with its alt text. Used where the alt is
 * wanted as text (search queries, progress diffs) — not for card
 * display, where the image itself is shown.
 */
export function imageTokensToAltText(text: string): string {
    if (!text.includes("![")) return text;
    return text
        .replace(IMAGE_PATTERN, (_match, alt: string) => ` ${alt} `)
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Removes valid image tokens from display text (the image is rendered
 * separately, its alt attribute serves as the loading/error fallback).
 * Invalid tokens are not rendered as images, so they keep their alt
 * text. The raw tokens stay in the plain-text fields either way.
 */
export function stripImageTokens(text: string): string {
    if (!text.includes("![")) return text;
    return text
        .replace(IMAGE_PATTERN, (_match, alt: string, url: string) =>
            isValidImageUrl(url) ? " " : ` ${alt} `,
        )
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Parses a single card line into a FlashCard:
 *
 *   front - back
 *
 * The line is split on the FIRST " - " only, so the back side may
 * itself contain " - " (the editor serializes sides verbatim, and this
 * keeps save → reload lossless).
 *
 * The front side may contain bracketed hints, e.g.
 *   ἀγάπη [Liebe] - love
 * In normal mode the brackets are hidden (content shown); in pure
 * mode both brackets and content are removed.
 *
 * Image tokens `![alt](url)` are allowed on both sides in any position.
 * They stay verbatim in the plain-text fields (so the editor round-trips
 * them losslessly); the structured `images` list keeps alt + URL + side,
 * and every URL is validated (https only) because decks arrive from
 * other users via share links.
 */
function parseCardLine(
    line: string,
    lineNo: number,
    errors: string[],
): FlashCard | null {
    const sep = line.indexOf(" - ");
    if (sep === -1) {
        errors.push(`Zeile ${lineNo}: Kein " - " gefunden: "${line}"`);
        return null;
    }

    const front = line.slice(0, sep).trim();
    const back = line.slice(sep + 3).trim();

    if (!front || !back) {
        errors.push(`Zeile ${lineNo}: Leere Vorder- oder Rückseite`);
        return null;
    }

    // One image per side: multiple stacked images would make the card
    // scrollable, which reads poorly in the study view.
    const images: CardImageRef[] = [];
    for (const [text, side] of [
        [front, "front"],
        [back, "back"],
    ] as const) {
        let sideImages = 0;
        for (const match of text.matchAll(IMAGE_PATTERN)) {
            const alt = match[1] ?? "";
            const url = match[2] ?? "";
            if (!isValidImageUrl(url)) {
                errors.push(
                    `Zeile ${lineNo}: Ungültige Bild-URL (nur https:// erlaubt): ${url}`,
                );
                continue;
            }
            sideImages++;
            if (sideImages > 1) {
                errors.push(
                    `Zeile ${lineNo}: Mehr als ein Bild auf der ${side === "front" ? "Vorderseite" : "Rückseite"} — nur eines pro Seite erlaubt`,
                );
                continue;
            }
            images.push({ alt, url, side });
        }
    }

    return { id: "", front, back, images };
}

/**
 * Only the first non-empty line can be the H1 title. A "# " line later
 * in the deck is an ordinary card line — the editor writes the title
 * first, so a card front starting with "# " round-trips losslessly.
 */
export function parseDeck(raw: string): ParsedDeck {
    const lines = raw.split(/\r?\n/);
    let title: string | null = null;
    const cards: FlashCard[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("# ") && title === null && cards.length === 0) {
            title = trimmed.slice(2).trim();
            continue;
        }

        const card = parseCardLine(trimmed, i + 1, errors);
        if (card) cards.push(card);
    }

    if (title === null) errors.push("Keine H1-Überschrift gefunden");

    return { title, cards, errors };
}
