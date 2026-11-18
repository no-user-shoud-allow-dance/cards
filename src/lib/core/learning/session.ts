import { ErrorCode, NscError } from "#lib/core/errors";
import type { Card } from "#lib/core/deck/document";
import type { CardId } from "#lib/core/deck/ids";
import type { Tag } from "#lib/core/deck/document";

/**
 * Cram-session state machine: queue, order, retry logic. Card.hidden
 * (moon) never enters the queue. Transitions are exhaustive and
 * compile-checked via SessionPhase.
 */
export type SessionPhase = "idle" | "question" | "answer" | "done";

export interface CramSession {
    phase: SessionPhase;
    /** Remaining card ids; the wrong ones are re-appended (retry). */
    queue: CardId[];
    /** Index of the current card inside `queue`. */
    index: number;
    /** Cards answered correctly / wrong in this run. */
    correct: number;
    wrong: number;
    /** Optional tag filter the session was created with. */
    tagFilter: Tag | null;
}

export interface SessionOptions {
    /** Only cards carrying this tag enter the queue. */
    tag?: Tag;
}

/**
 * Builds the queue from the deck's cards: hidden cards are skipped,
 * the tag filter applies when given. Throws SESSION_EMPTY when no card
 * qualifies.
 */
export function createSession(cards: Card[], options: SessionOptions = {}): CramSession {
    const queue = cards
        .filter((c) => !c.hidden && (!options.tag || c.tags.includes(options.tag)))
        .map((c) => c.id);
    if (queue.length === 0) throw new NscError(ErrorCode.SESSION_EMPTY);
    return {
        phase: "question",
        queue,
        index: 0,
        correct: 0,
        wrong: 0,
        tagFilter: options.tag ?? null,
    };
}

/** The current card id, or null when the session is done/idle. */
export function currentCard(session: CramSession): CardId | null {
    if (session.phase === "done" || session.phase === "idle") return null;
    return session.queue[session.index] ?? null;
}

/** Reveals the answer of the current card. */
export function revealAnswer(session: CramSession): CramSession {
    if (session.phase !== "question") {
        throw new NscError(ErrorCode.SESSION_NOT_IN_PROGRESS, { phase: session.phase });
    }
    return { ...session, phase: "answer" };
}

/**
 * Submits the grade for the current card. Correct: advance. Wrong: the
 * card is re-appended to the end of the queue (retry logic) and the run
 * continues; the session ends ("done") when the queue is exhausted.
 */
export function submitAnswer(session: CramSession, correct: boolean): CramSession {
    if (session.phase !== "answer") {
        throw new NscError(ErrorCode.SESSION_NOT_IN_PROGRESS, { phase: session.phase });
    }
    const current = session.queue[session.index]!;
    let queue = session.queue;
    const index = session.index + 1;
    if (!correct) queue = [...queue, current];
    if (index >= queue.length) {
        return {
            ...session,
            queue,
            phase: "done",
            correct: session.correct + (correct ? 1 : 0),
            wrong: session.wrong + (correct ? 0 : 1),
        };
    }
    return {
        ...session,
        queue,
        index,
        phase: "question",
        correct: session.correct + (correct ? 1 : 0),
        wrong: session.wrong + (correct ? 0 : 1),
    };
}
