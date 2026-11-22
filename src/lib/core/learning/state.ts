import type { EpochMs } from "#lib/core/primitives";
import type { CardId } from "#lib/core/deck/ids";
import type { DeckHash } from "#lib/core/deck/hash";
import type { FolderName } from "#lib/core/deck/identity";
import { demote, initialBox, promote, type Box } from "#lib/core/learning/leitner";

/**
 * One record per card holding all its learning attributes. CardState
 * references only the CardId string; Card carries no learning attributes,
 * and neither imports the other.
 */
export interface CardState {
    cardId: CardId;
    box: Box;
    /** Wrong answers total. */
    lapses: number;
    lastReviewed: EpochMs | null;
    /** Card was viewed in overview mode — survives reload/sessions. */
    overviewDone: boolean;
}

/**
 * One record per deck (the kk_* group): deck-level values alongside the
 * sparse per-card map (only cards ever answered or overviewed).
 */
export interface DeckState {
    deckHash: DeckHash;
    /** Sync merge timestamp. */
    updatedAt: EpochMs;
    /** Deck-level count of correct answers in a row. */
    streak: number;
    /** Total active learning time in ms. */
    studyTime: number;
    /**
     * Device-local folders of the deck (simple + `#special`), persisted
     * in this very record (kk-state) — folders never travel on the sync
     * or share wire, so they are NOT deck content. Absent when the deck
     * was never assigned any (e.g. states rebuilt from wire bodies);
     * readers fall back to the deck default folder.
     */
    folders?: FolderName[];
    /**
     * Device-local pure-mode override for this deck; absent when the
     * deck follows the global settings default (the reader decides).
     * Persisted in this very record (kk-state) because it is
     * device-local, exactly like folders — it never travels on the
     * sync or share wire.
     */
    pureMode?: boolean;
    cards: Record<CardId, CardState>;
}

export function newDeckState(deckHash: DeckHash, now: EpochMs): DeckState {
    return {
        deckHash,
        updatedAt: now,
        streak: 0,
        studyTime: 0,
        cards: {},
    };
}

export function newCardState(cardId: CardId, _now: EpochMs): CardState {
    return { cardId, box: initialBox(), lapses: 0, lastReviewed: null, overviewDone: false };
}

/**
 * Records one answer on a deck state (pure): box transition via
 * leitner.ts, lapse counting, deck-level streak, and the sync timestamp.
 */
export function answerCard(
    state: DeckState,
    cardId: CardId,
    correct: boolean,
    now: EpochMs
): DeckState {
    const prev = state.cards[cardId] ?? newCardState(cardId, now);
    const card: CardState = {
        ...prev,
        box: correct ? promote(prev.box) : demote(prev.box),
        lapses: correct ? prev.lapses : prev.lapses + 1,
        lastReviewed: now,
    };
    return {
        ...state,
        updatedAt: now,
        streak: correct ? state.streak + 1 : 0,
        cards: { ...state.cards, [cardId]: card },
    };
}

/** Adds active learning time (ms) to the deck total (pure). */
export function recordStudyTime(state: DeckState, ms: number, now: EpochMs): DeckState {
    return { ...state, studyTime: state.studyTime + ms, updatedAt: now };
}

/** Marks one card as seen in overview mode. */
export function markOverviewDone(state: DeckState, cardId: CardId, now: EpochMs): DeckState {
    const prev = state.cards[cardId] ?? newCardState(cardId, now);
    return {
        ...state,
        updatedAt: now,
        cards: { ...state.cards, [cardId]: { ...prev, overviewDone: true } },
    };
}

/**
 * Overview completion is derived, never stored: complete when every
 * card's overviewDone is set. Adding cards to a completed deck makes it
 * incomplete again automatically.
 */
export function isOverviewComplete(state: DeckState, cardCount: number): boolean {
    if (cardCount <= 0) return false;
    let seen = 0;
    for (const card of Object.values(state.cards)) if (card.overviewDone) seen++;
    return seen >= cardCount;
}

function mergeCard(local: CardState | undefined, remote: CardState | undefined): CardState {
    if (!local) return remote!;
    if (!remote) return local;
    // Newer review wins; on a tie the higher box wins, flags OR-merge.
    const localTime = local.lastReviewed ?? 0;
    const remoteTime = remote.lastReviewed ?? 0;
    if (remoteTime !== localTime) return remoteTime > localTime ? remote : local;
    return {
        cardId: local.cardId,
        box: Math.max(local.box, remote.box) as Box,
        lapses: Math.max(local.lapses, remote.lapses),
        lastReviewed: local.lastReviewed,
        overviewDone: local.overviewDone || remote.overviewDone,
    };
}

/**
 * Per-card merge for sync: the deck-level fields follow the newer
 * `updatedAt` (newer-wins per field), CardStates merge per card by
 * lastReviewed. Folders and the pure-mode override are device-local:
 * wire bodies never carry them, so the merge always keeps the FIRST
 * argument's (local) values verbatim. Clock skew is bounded by the
 * per-card timestamps.
 */
export function mergeDeckStates(a: DeckState, b: DeckState): DeckState {
    const newer = a.updatedAt >= b.updatedAt ? a : b;
    const ids = new Set([...Object.keys(a.cards), ...Object.keys(b.cards)]) as Set<CardId>;
    const cards: Record<CardId, CardState> = {};
    for (const id of ids) cards[id] = mergeCard(a.cards[id], b.cards[id]);
    return {
        deckHash: newer.deckHash,
        updatedAt: Math.max(a.updatedAt, b.updatedAt) as EpochMs,
        streak: newer.streak,
        // Study time is a monotonic counter on both sides — max wins.
        studyTime: Math.max(a.studyTime, b.studyTime),
        folders: a.folders,
        pureMode: a.pureMode,
        cards,
    };
}
