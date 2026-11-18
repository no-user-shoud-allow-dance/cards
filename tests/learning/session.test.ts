import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { cardIdFromString, type CardId } from "#lib/core/deck/ids";
import { makeTag } from "#lib/core/deck/parse";
import type { Card } from "#lib/core/deck/document";
import { createSession, currentCard, revealAnswer, submitAnswer } from "#lib/core/learning/session";

function mkCard(idHex: string, tags: string[] = [], hidden = false): Card {
    return {
        id: cardIdFromString(idHex) as CardId,
        front: { plain: idHex, spans: [], images: [] },
        back: { plain: "b", spans: [], images: [] },
        hints: [],
        tags: tags.map((t) => makeTag(t)),
        hidden,
    };
}

const a = mkCard("000000000000000a");
const b = mkCard("000000000000000b");

describe("createSession", () => {
    test("hidden (moon) cards never enter the queue", () => {
        const s = createSession([mkCard("000000000000000a", [], true), b]);
        expect(s.queue).toEqual([b.id]);
        expect(s.phase).toBe("question");
    });
    test("tag filter applies", () => {
        const tagged = mkCard("000000000000000a", ["verben"]);
        const s = createSession([tagged, b], { tag: makeTag("verben") });
        expect(s.queue).toEqual([tagged.id]);
        expect(s.tagFilter).toBe("verben");
    });
    test("empty queue throws SESSION_EMPTY", () => {
        try {
            createSession([mkCard("000000000000000a", [], true)]);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SESSION_EMPTY).toBe(true);
        }
    });
});

describe("session flow", () => {
    test("wrong answers re-queue the card; done when exhausted", () => {
        let s = createSession([a, b]);
        expect(currentCard(s)).toBe(a.id);

        s = revealAnswer(s);
        expect(s.phase).toBe("answer");

        s = submitAnswer(s, false); // a wrong → re-appended
        expect(s.wrong).toBe(1);
        expect(s.queue).toEqual([a.id, b.id, a.id]);
        expect(s.phase).toBe("question");
        expect(currentCard(s)).toBe(b.id);

        s = submitAnswer(revealAnswer(s), true); // b correct
        expect(s.correct).toBe(1);
        expect(currentCard(s)).toBe(a.id);

        s = submitAnswer(revealAnswer(s), true); // a correct on retry → queue exhausted
        expect(s.phase).toBe("done");
        expect(s.correct).toBe(2);
        expect(s.wrong).toBe(1);
        expect(currentCard(s)).toBeNull();
    });

    test("reveal outside question phase throws", () => {
        const s = revealAnswer(createSession([a]));
        try {
            revealAnswer(s);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SESSION_NOT_IN_PROGRESS).toBe(
                true
            );
        }
    });

    test("submit outside answer phase throws", () => {
        const s = createSession([a]);
        try {
            submitAnswer(s, true);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SESSION_NOT_IN_PROGRESS).toBe(
                true
            );
        }
    });
});
