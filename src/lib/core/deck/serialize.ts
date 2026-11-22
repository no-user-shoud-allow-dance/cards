import { escapeCardSide, imageToken, serializeInlineSide } from "#lib/core/deck/inline";
import type { Card, CardSide, DeckDocument } from "#lib/core/deck/document";
import type { DeckMeta } from "#lib/core/deck/identity";
import { makeRawMarkdown, type RawMarkdown } from "#lib/core/deck/parse";

/**
 * DeckDocument → deck markdown. Round-trip safe: for any serialized
 * source, serialize(parse(x)) === x. The serializer always writes the
 * canonical form (frontmatter with the structural `type:` key, tags,
 * context, moon).
 */

function serializeMeta(meta: DeckMeta): string[] {
    const lines: string[] = [];
    if (meta.author !== undefined) lines.push(`author: ${meta.author}`);
    if (meta.description !== undefined) lines.push(`description: ${meta.description}`);
    if (meta.source !== undefined) lines.push(`source: ${meta.source}`);
    for (const [key, value] of Object.entries(meta.extra)) {
        lines.push(`${key}: ${value}`);
    }
    return lines;
}

/** The canonical one-line form of a card (without the trailing newline). */
export function serializeCard(card: Card): string {
    const hintsFor = (side: CardSide) => card.hints.filter((h) => h.side === side);
    const front = serializeInlineSide(card.front, hintsFor("front"));
    const back = serializeInlineSide(card.back, hintsFor("back"));
    let line = `${escapeCardSide(front)} - ${escapeCardSide(back)}`;
    if (card.context !== undefined) {
        line += ` :: ${escapeCardSide(serializeInlineSide(card.context))}`;
    }
    for (const tag of card.tags) line += ` #${tag}`;
    // The card's image is a trailing field, before the moon.
    if (card.image) line += ` ${imageToken(card.image)}`;
    if (card.hidden) line += " *";
    return line;
}

export function serialize(doc: DeckDocument): RawMarkdown {
    const lines: string[] = ["---", `type: ${doc.type}`, ...serializeMeta(doc.meta), "---"];
    lines.push(`# ${doc.title}`);
    for (const card of doc.cards) lines.push(serializeCard(card));
    return makeRawMarkdown(lines.join("\n") + "\n");
}
