import { ErrorCode, NscError } from "#lib/core/errors";
import type { Card, CardSide, Span, StyledText } from "#lib/core/deck/document";
import { IMAGE_TOKEN_SOURCE } from "#lib/core/deck/inline";

/**
 * A `[hint]` range on one side: offsets into that side's `plain`. Only
 * the bracket characters are stripped at parse time; the content stays
 * in `plain`, marked by the range. A side may carry any number of
 * hints — one per bracket pair.
 */
export interface Hint {
    side: CardSide;
    /** 0-based, inclusive — the hint content. */
    start: number;
    /** Exclusive. */
    end: number;
}

/** The one checked constructor of Hint. */
export function makeHint(side: CardSide, start: number, end: number, plainLength: number): Hint {
    if (
        (side !== "front" && side !== "back") ||
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        start >= end ||
        end > plainLength
    ) {
        throw new NscError(ErrorCode.HINT_INVALID, { side, start, end, plainLength });
    }
    return { side, start, end };
}

// Sticky image token, matched at one position. Image tokens are atomic:
// their `[...]` belongs to the image syntax, never to a hint. Compiled
// from the parser's single token shape.
const IMAGE_TOKEN = new RegExp(IMAGE_TOKEN_SOURCE, "y");

/**
 * Extracts every bracketed hint `[...]` from a side's `plain`, strips
 * the bracket characters and remaps the spans into the new plain.
 * Image tokens (`![alt](url)`) are skipped — their brackets are part of
 * the image syntax. An unclosed `[` stays literal text.
 */
export function extractHints(
    plain: string,
    spans: Span[],
    side: CardSide
): {
    plain: string;
    spans: Span[];
    hints: Hint[];
} {
    // Positions of hint brackets in `plain` (open, close, open, close, …).
    const brackets: number[] = [];
    let i = 0;
    while (i < plain.length) {
        if (plain[i] === "!") {
            IMAGE_TOKEN.lastIndex = i;
            const m = IMAGE_TOKEN.exec(plain);
            if (m) {
                i += m[0].length;
                continue;
            }
            i++;
            continue;
        }
        if (plain[i] === "[") {
            const close = plain.indexOf("]", i + 1);
            if (close !== -1) {
                brackets.push(i, close);
                i = close + 1;
                continue;
            }
        }
        i++;
    }
    if (brackets.length === 0) return { plain, spans, hints: [] };

    // Remove the bracket characters; every later offset shifts left by
    // the number of removed positions before it.
    const removed = new Set(brackets);
    let nextPlain = "";
    for (let p = 0; p < plain.length; p++) {
        if (!removed.has(p)) nextPlain += plain[p];
    }
    const shift = (p: number): number => p - brackets.filter((b) => b < p).length;
    const nextSpans = spans.map((s) => ({ ...s, start: shift(s.start), end: shift(s.end) }));
    nextSpans.sort((a, b) => a.start - b.start || b.end - a.end);
    const hints: Hint[] = [];
    for (let k = 0; k < brackets.length; k += 2) {
        const open = brackets[k]!;
        const close = brackets[k + 1]!;
        hints.push(makeHint(side, shift(open + 1), shift(close), nextPlain.length));
    }
    return { plain: nextPlain, spans: nextSpans, hints };
}

/**
 * The side's text without any hint content of that side — the one place
 * that knows the rule, so search and type detection don't each
 * re-implement it.
 */
export function plainWithoutHints(card: Card, side: CardSide): string {
    const text = side === "front" ? card.front : card.back;
    const hints = card.hints.filter((h) => h.side === side);
    let out = text.plain;
    // Remove from the end so earlier offsets stay valid.
    for (const h of [...hints].sort((a, b) => b.start - a.start)) {
        out = out.slice(0, h.start) + out.slice(h.end);
    }
    return out;
}

/** Rebuilds a StyledText with all hint bracket characters re-inserted. */
export function withHintBrackets(text: StyledText, hints: Hint[]): StyledText {
    let plain = text.plain;
    const inserts: { pos: number; text: string }[] = [];
    for (const h of hints) {
        inserts.push({ pos: h.end, text: "]" }, { pos: h.start, text: "[" });
    }
    inserts.sort((a, b) => b.pos - a.pos || b.text.length - a.text.length);
    for (const ins of inserts) {
        plain = plain.slice(0, ins.pos) + ins.text + plain.slice(ins.pos);
    }
    return { ...text, plain };
}
