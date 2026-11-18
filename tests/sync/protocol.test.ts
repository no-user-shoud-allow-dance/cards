import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { makeEpochMs } from "#lib/core/primitives";
import { makeRawMarkdown, parse } from "#lib/core/deck/parse";
import { serialize, serializeCard } from "#lib/core/deck/serialize";
import { hashDeckContent } from "#lib/core/deck/hash";
import { makeSlug } from "#lib/core/deck/identity";
import { answerCard, newDeckState } from "#lib/core/learning/state";
import type { DeckEntry } from "#lib/repositories/decksRepository";
import {
    buildProgressBody,
    buildTogetherBody,
    decodeFullSync,
    decodeTogetherBody,
    encodeFullSync,
    progressBodyToState,
} from "#lib/sync/protocol";

function entryOf(markdown: string): DeckEntry {
    const doc = parse(makeRawMarkdown(markdown));
    return {
        slug: makeSlug("0123456789abcdef", "aaaa"),
        createdAt: makeEpochMs(0),
        doc,
    };
}

const entry = entryOf("---\ntype: latin\n---\n# Verben\namo - lieben\nportare - tragen #verb\n");
const hash = hashDeckContent(entry.doc, serializeCard);
const cid = entry.doc.cards[0]!.id;
const state = answerCard(newDeckState(hash, makeEpochMs(100)), cid, true, makeEpochMs(200));

describe("progress body round-trip", () => {
    test("buildProgressBody → progressBodyToState preserves card states", () => {
        const body = buildProgressBody(state);

        expect(body.h).toBe(hash);
        expect(body.s).toBe(1);
        const back = progressBodyToState(body);
        expect(back.cards[cid]!.box).toBe(2);
        expect(back.cards[cid]!.lastReviewed).toBe(200);
        expect(back.streak).toBe(1);
    });
});

describe("together body round-trip", () => {
    test("head + card lines re-parse to the same deck; states attach by index", () => {
        const body = buildTogetherBody(entry, state, hash);

        expect(body.c).toHaveLength(2);
        const decoded = decodeTogetherBody(body);
        expect(serialize(decoded.doc)).toBe(serialize(entry.doc));
        expect(decoded.states[cid]!.box).toBe(2);
        expect(decoded.deckHash).toBe(hash);
        // second card has no state → defaults
        const cid2 = entry.doc.cards[1]!.id;
        expect(decoded.states[cid2]!.box).toBe(1);
    });
});

describe("full sync", () => {
    test("encodeFullSync/decodeFullSync round-trip", () => {
        const json = encodeFullSync([{ entry, state, hash }]);
        const decoded = decodeFullSync(json);
        expect(decoded).toHaveLength(1);
        expect(serialize(decoded[0]!.doc)).toBe(serialize(entry.doc));
        expect(decoded[0]!.states[cid]!.box).toBe(2);
    });

    test("invalid messages throw typed errors", () => {
        const expectCode = (json: string, code: ErrorCode) => {
            try {
                decodeFullSync(json);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === code).toBe(true);
            }
        };
        expectCode("not json", ErrorCode.LINK_INVALID_ENCODING);
        expectCode("{}", ErrorCode.LINK_BAD_SHAPE);
        expectCode(JSON.stringify([{ h: "zz" }]), ErrorCode.LINK_BAD_SHAPE);
    });
});
