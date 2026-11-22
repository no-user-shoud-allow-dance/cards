import { STYLES, type Style } from "#lib/core/deck/document";
import { IMAGE_TOKEN_SOURCE, STYLE_DELIMITER } from "#lib/core/deck/inline";

/**
 * Editor-side helpers for the raw card-side source — the one sanctioned
 * place where raw markup is edited (the L0 exception, next to the
 * editor textarea). Keyed on the core `Style` model and its
 * `STYLE_DELIMITER` allowlist; mapping a style to a real HTML element
 * is a rendering concern and stays in the UI. Pure string functions,
 * so this module lives in core next to the parser (inline.ts).
 *
 * Recognized constructs (delimiters wrap the content, like the
 * toolbar inserts):
 *   `code`  **bold**  *italic*  ++underline++  ~~strike~~
 *   ==mark==  ^superscript^  ~subscript~
 * plus the editor-only visualizations: bracketed hints `[...]` and
 * image tokens `![alt](url)`. Everything else stays literal text.
 */

export interface SourceToken {
    type: "text" | "open" | "close";
    /** Raw source of the token; for delimiters the literal, e.g. `**`. */
    raw: string;
    style?: Style;
    start: number;
    end: number;
}

/**
 * Editor-only tokens: bracketed hint spans `[...]` (hint-open/hint-close)
 * and image tokens `![alt](url)` (image, one leaf token). Used by the
 * editor to visualize them; the display pipeline treats them as plain
 * text (hints.ts / parseInlineSide handle them separately).
 */
export type EditorToken =
    | SourceToken
    | { type: "hint-open" | "hint-close"; raw: string; start: number; end: number }
    | { type: "image"; raw: string; start: number; end: number };

// Longest delimiters first, so "**" wins over "*" at the same position
// (same order as the inline parser and the highlighter).
const DELIMITERS: { style: Style; delim: string }[] = STYLES.map((style) => ({
    style,
    delim: STYLE_DELIMITER[style],
})).sort((a, b) => b.delim.length - a.delim.length);

/** Sticky image token, matched at one position (compiled from the parser's
 * single token shape). */
const IMAGE_TOKEN = new RegExp(IMAGE_TOKEN_SOURCE, "y");

/**
 * Tokenizes raw editor source into text, delimiter, hint and image
 * tokens. A delimiter closes the innermost open style of the same kind,
 * otherwise it opens one (so `**bold**` pairs up naturally). Image
 * tokens and hint brackets are matched before delimiters so their
 * inner characters are never scanned.
 */
export function tokenizeEditorSource(text: string): EditorToken[] {
    const tokens: EditorToken[] = [];
    const stack: ({ kind: "delim"; style: Style } | { kind: "hint" })[] = [];
    let last = 0;
    let i = 0;
    const emitText = (end: number): void => {
        if (end > last) {
            tokens.push({
                type: "text",
                raw: text.slice(last, end),
                start: last,
                end,
            });
        }
    };
    while (i < text.length) {
        const ch = text[i]!;
        if (ch === "!") {
            // Image token: one leaf token, matched before the `[` of
            // `![` could be mistaken for a hint bracket.
            IMAGE_TOKEN.lastIndex = i;
            const m = IMAGE_TOKEN.exec(text);
            if (m) {
                emitText(i);
                tokens.push({
                    type: "image",
                    raw: m[0],
                    start: i,
                    end: i + m[0].length,
                });
                last = i = i + m[0].length;
                continue;
            }
            i++;
            continue;
        }
        if (ch === "[" && text[i - 1] !== "!") {
            emitText(i);
            tokens.push({ type: "hint-open", raw: "[", start: i, end: i + 1 });
            stack.push({ kind: "hint" });
            last = i = i + 1;
            continue;
        }
        if (ch === "]") {
            const top = stack[stack.length - 1];
            if (top && top.kind === "hint") {
                emitText(i);
                stack.pop();
                tokens.push({ type: "hint-close", raw: "]", start: i, end: i + 1 });
                last = i = i + 1;
                continue;
            }
            i++; // literal ] — becomes part of a later text token
            continue;
        }
        const d = DELIMITERS.find((d) => text.startsWith(d.delim, i));
        if (!d) {
            i++;
            continue;
        }
        const top = stack[stack.length - 1];
        const type: "open" | "close" =
            top && top.kind === "delim" && top.style === d.style ? "close" : "open";
        emitText(i);
        tokens.push({
            type,
            raw: d.delim,
            style: d.style,
            start: i,
            end: i + d.delim.length,
        });
        if (type === "open") stack.push({ kind: "delim", style: d.style });
        else stack.pop();
        last = i = i + d.delim.length;
    }
    emitText(text.length);
    return tokens;
}

/**
 * Structural signature of the formatting tokens in source: "C<raw>" per
 * delimiter chip (open / close token) and "L<style>" per live element
 * (style, "hint" for a bracketed span, "image" for an image token), in
 * document order, joined with "|". The source editor compares this with
 * the signature of its DOM to detect hand-typed formatting that still
 * sits in plain text nodes and needs to be re-rendered as chips + live
 * preview.
 */
export function structureSignature(source: string): string {
    const out: string[] = [];
    const stack: string[] = [];
    for (const token of tokenizeEditorSource(source)) {
        if (token.type === "text") continue;
        if (token.type === "image") {
            out.push("Limage");
            continue;
        }
        if (token.type === "hint-close") {
            stack.pop();
            continue;
        }
        if (token.type === "hint-open") {
            out.push("Lhint");
            stack.push("hint");
        } else if (token.type === "open") {
            out.push("C" + token.raw);
            out.push("L" + token.style);
            stack.push("delim:" + token.style);
        } else if (token.type === "close" && stack[stack.length - 1] === "delim:" + token.style) {
            stack.pop();
            out.push("C" + token.raw);
        }
        // Unmatched closing delimiters stay literal text — no entry.
    }
    return out.join("|");
}

/** Wraps the character range [start, end) of source in the given style's delimiters. */
export function wrapRange(source: string, start: number, end: number, style: Style): string {
    const s = Math.max(0, Math.min(start, end));
    const e = Math.max(0, Math.max(start, end));
    const delim = STYLE_DELIMITER[style];
    return source.slice(0, s) + delim + source.slice(s, e) + delim + source.slice(e);
}

/**
 * Removes the delimiter token at character offset `pos` together with
 * its matching counterpart (nesting-aware for same-style delimiters).
 * An unclosed opening delimiter loses only the clicked token. Returns
 * the new source and the caret position where the token was, or null
 * when no delimiter token starts at `pos`.
 */
export function removeDelimiterPair(
    source: string,
    pos: number
): { text: string; caret: number } | null {
    const tokens = tokenizeEditorSource(source).filter(
        (token): token is SourceToken =>
            token.type !== "hint-open" && token.type !== "hint-close" && token.type !== "image"
    );
    const idx = tokens.findIndex((token) => token.start === pos && token.type !== "text");
    if (idx === -1) return null;
    const token = tokens[idx]!;

    const removals: SourceToken[] = [token];
    let depth = 0;
    let match = -1;
    if (token.type === "open") {
        for (let i = idx + 1; i < tokens.length; i++) {
            const t = tokens[i]!;
            if (t.type === "text" || t.style !== token.style) continue;
            if (t.type === "open") depth++;
            else if (t.type === "close") {
                if (depth === 0) {
                    match = i;
                    break;
                }
                depth--;
            }
        }
    } else {
        for (let i = idx - 1; i >= 0; i--) {
            const t = tokens[i]!;
            if (t.type === "text" || t.style !== token.style) continue;
            if (t.type === "close") depth++;
            else if (t.type === "open") {
                if (depth === 0) {
                    match = i;
                    break;
                }
                depth--;
            }
        }
    }
    if (match !== -1) removals.push(tokens[match]!);

    // Remove from the end so earlier offsets stay valid.
    const ranges = removals.map((t) => [t.start, t.end] as const).sort((a, b) => b[0] - a[0]);
    let text = source;
    for (const [s, e] of ranges) text = text.slice(0, s) + text.slice(e);
    return { text, caret: token.start };
}
