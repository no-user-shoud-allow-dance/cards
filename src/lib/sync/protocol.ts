import { ErrorCode, NscError } from "#lib/core/errors";
import { cardIdFromString, type CardId } from "#lib/core/deck/ids";
import { deckHashFromString, type DeckHash } from "#lib/core/deck/hash";
import { makeRawMarkdown, parse } from "#lib/core/deck/parse";
import { serialize, serializeCard } from "#lib/core/deck/serialize";
import type { DeckDocument } from "#lib/core/deck/document";
import { makeBox } from "#lib/core/learning/leitner";
import type { CardState, DeckState } from "#lib/core/learning/state";
import { makeEpochMs } from "#lib/core/primitives";
import { validateBody, type ProgressBody, type TogetherBody } from "#lib/core/share/links";
import type { DeckEntry } from "#lib/repositories/decksRepository";

/**
 * Sync payload schema (the `t`/`p` bodies), versioned. Payloads carry
 * gzipped markdown on the wire (share links) — over the PeerJS data
 * channel the full-sync payload travels as one plain JSON string, no
 * gzip/base64, because the channel is binary and stays debuggable.
 */

export function buildProgressBody(state: DeckState): ProgressBody {
    return {
        h: state.deckHash,
        s: state.streak,
        c: Object.values(state.cards).map((c): [CardId, number, number, number | null, 0 | 1] => [
            c.cardId,
            c.box,
            c.lapses,
            c.lastReviewed,
            c.overviewDone ? 1 : 0,
        ]),
    };
}

/** Rebuilds a DeckState from a validated p body (branded edges). */
export function progressBodyToState(body: ProgressBody): DeckState {
    const cards: Record<CardId, CardState> = {};
    for (const [id, box, lapses, lastReviewed, overviewDone] of body.c) {
        cards[cardIdFromString(id)] = {
            cardId: cardIdFromString(id),
            box: makeBox(box),
            lapses,
            lastReviewed: lastReviewed === null ? null : makeEpochMs(lastReviewed),
            overviewDone: overviewDone === 1,
        };
    }
    return {
        deckHash: deckHashFromString(body.h),
        updatedAt: makeEpochMs(0),
        streak: body.s,
        // studyTime is local-only (not part of the p wire body).
        studyTime: 0,
        cards,
    };
}

/**
 * Builds the t body of one deck: `head` (frontmatter + title) plus one
 * `[cardMarkdown, box, lapses, lastReviewed, overviewDone]` tuple per
 * card in deck order — head + all card lines = a valid deck file.
 */
export function buildTogetherBody(
    entry: DeckEntry,
    state: DeckState | null,
    hash: DeckHash
): TogetherBody {
    const head = serialize({ ...entry.doc, cards: [] }).trimEnd();
    return {
        h: hash,
        s: state?.streak ?? 0,
        head,
        c: entry.doc.cards.map((card) => {
            const cs = state?.cards[card.id];
            return [
                serializeCard(card),
                cs?.box ?? 1,
                cs?.lapses ?? 0,
                cs?.lastReviewed ?? null,
                cs?.overviewDone ? 1 : 0,
            ] as [string, number, number, number | null, 0 | 1];
        }),
    };
}

export interface DecodedTogether {
    doc: DeckDocument;
    states: Record<CardId, CardState>;
    deckHash: DeckHash;
}

/**
 * Parses a t body in one pass: head + card lines form the deck file;
 * each tuple's state attaches to the card at the same index (CardId =
 * content hash of the parsed card).
 */
export function decodeTogetherBody(body: TogetherBody): DecodedTogether {
    const raw = makeRawMarkdown(body.head + "\n" + body.c.map((t) => t[0]).join("\n") + "\n");
    const doc = parse(raw);
    if (doc.cards.length !== body.c.length) {
        throw new Error("t body: card count mismatch between head and tuples");
    }
    const states: Record<CardId, CardState> = {};
    doc.cards.forEach((card, i) => {
        const [, box, lapses, lastReviewed, overviewDone] = body.c[i]!;
        states[card.id] = {
            cardId: card.id,
            box: makeBox(box),
            lapses,
            lastReviewed: lastReviewed === null ? null : makeEpochMs(lastReviewed),
            overviewDone: overviewDone === 1,
        };
    });
    return { doc, states, deckHash: deckHashFromString(body.h) };
}

export interface FullSyncItem {
    entry: DeckEntry;
    state: DeckState | null;
    hash: DeckHash;
}

/** The full-sync message: one JSON string with all t bodies. */
export function encodeFullSync(items: FullSyncItem[]): string {
    return JSON.stringify(
        items.map((item) => buildTogetherBody(item.entry, item.state, item.hash))
    );
}

/** Validates and decodes a full-sync message from the data channel. */
export function decodeFullSync(json: string): DecodedTogether[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new NscError(ErrorCode.LINK_INVALID_ENCODING, { reason: "json" });
    }
    if (!Array.isArray(parsed)) {
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind: "sync", field: "array" });
    }
    return parsed.map((raw) => decodeTogetherBody(validateBody("t", raw) as TogetherBody));
}
