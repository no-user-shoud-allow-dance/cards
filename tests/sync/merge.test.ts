import { describe, expect, test } from "bun:test";
import { makeEpochMs } from "#lib/core/primitives";
import { makeRawMarkdown, parse } from "#lib/core/deck/parse";
import { serializeCard } from "#lib/core/deck/serialize";
import { hashDeckContent } from "#lib/core/deck/hash";
import { cardIdFromString } from "#lib/core/deck/ids";
import { makeSlug } from "#lib/core/deck/identity";
import { answerCard, newDeckState } from "#lib/core/learning/state";
import type { DeckEntry } from "#lib/repositories/decksRepository";
import { applyRemoteDecks, localHash, mergeSyncItems } from "#lib/sync/merge";
import type { FullSyncItem } from "#lib/sync/protocol";

function entryOf(markdown: string, suffix: string): DeckEntry {
    const doc = parse(makeRawMarkdown(markdown));
    return {
        slug: makeSlug("0123456789abcdef", suffix),
        createdAt: makeEpochMs(0),
        doc,
    };
}

const entryA = entryOf("# A\namo - lieben\n", "aaaa");
const entryB = entryOf("# B\nhello - hallo\n", "bbbb");
const hashA = localHash(entryA);
const hashB = localHash(entryB);
const cidA = entryA.doc.cards[0]!.id;

const stateA = answerCard(newDeckState(hashA, makeEpochMs(100)), cidA, true, makeEpochMs(200));
const itemA: FullSyncItem = { entry: entryA, state: stateA, hash: hashA };
const itemB: FullSyncItem = { entry: entryB, state: null, hash: hashB };

describe("localHash", () => {
    test("content hash of the entry's document", () => {
        expect(localHash(entryA)).toBe(hashDeckContent(entryA.doc, serializeCard));
    });
});

describe("mergeSyncItems", () => {
    test("unknown remote decks are added, known hashes merge states only", () => {
        const remote: FullSyncItem[] = [
            { entry: entryA, state: null, hash: hashA }, // same hash, no state
            itemB,
        ];
        const res = mergeSyncItems([itemA], remote);
        expect(res.added).toBe(1);
        expect(res.merged).toBe(1);
        expect(res.items).toHaveLength(2);
        const merged = res.items.find((i) => i.hash === hashA)!;
        // identical hash = identical content → local entry wins, local state kept
        expect(merged.entry).toBe(entryA);
        expect(merged.state).toBe(stateA);
    });

    test("identical hashes on both sides do not duplicate", () => {
        const res = mergeSyncItems([itemA], [itemA]);
        expect(res.items).toHaveLength(1);
        expect(res.added).toBe(0);
        expect(res.merged).toBe(1);
    });
});

describe("applyRemoteDecks", () => {
    test("decoded remote decks become entries; empty states → null state", () => {
        const res = applyRemoteDecks([itemA], [], (doc, hash) => ({
            slug: makeSlug(hash.slice(0, 16), "cccc"),
            createdAt: makeEpochMs(0),
            doc,
        }));
        expect(res.items).toHaveLength(1);
    });

    test("remote deck with states lands as a new item", () => {
        const docB = entryB.doc;
        const cidB = docB.cards[0]!.id;
        const res = applyRemoteDecks(
            [itemA],
            [
                {
                    doc: docB,
                    states: {
                        [cidB]: {
                            cardId: cardIdFromString(cidB),
                            box: 3 as never,
                            lapses: 1,
                            lastReviewed: makeEpochMs(50),
                            overviewDone: true,
                        },
                    },
                    deckHash: hashB,
                },
            ],
            (doc, _hash) => ({
                slug: makeSlug("0123456789abcdef", "bbbb"),
                createdAt: makeEpochMs(0),
                doc,
            })
        );
        expect(res.added).toBe(1);
        const added = res.items.find((i) => i.hash === hashB)!;
        expect(added.state?.cards[cidB]?.box).toBe(3);
        expect(added.state?.cards[cidB]?.overviewDone).toBe(true);
    });
});
