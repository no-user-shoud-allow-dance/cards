import { STYLES, type Style } from "#lib/core/deck/document";
import { IMAGE_TOKEN_SOURCE, STYLE_DELIMITER } from "#lib/core/deck/inline";
import type { NscError } from "#lib/core/errors";

/**
 * Syntax highlighting for deck markdown in the editor.
 * Pure tokenizer: it never builds a DeckDocument, it only splits the
 * raw source into typed spans so a renderer can color them. The
 * round-trip invariant holds by construction — concatenating all
 * token texts reproduces the source exactly, so a highlight layer
 * behind a transparent textarea always aligns with the input.
 */

export type HighlightTokenType =
    | "text"
    | "frontmatter-delimiter"
    | "frontmatter-key"
    | "frontmatter-value"
    | "title-marker"
    | "title-text"
    | "comment"
    | "separator"
    | "tag"
    | "moon"
    | "delim"
    | "hint"
    | "image";

export interface HighlightToken {
    type: HighlightTokenType;
    text: string;
    /** For `delim` tokens: the style the delimiter belongs to. */
    style?: Style;
    /** Set when the token's line carries a parse error (squiggle underline). */
    error?: boolean;
}

// Longest delimiters first, so "**" wins over "*" at the same position
// (same order as the inline parser).
const DELIMITERS: { style: Style; delim: string }[] = STYLES.map((style) => ({
    style,
    delim: STYLE_DELIMITER[style],
})).sort((a, b) => b.delim.length - a.delim.length);

// Sticky image token, matched at one position (compiled from the
// parser's single token shape).
const IMAGE_TOKEN = new RegExp(IMAGE_TOKEN_SOURCE, "y");

// Trailing `#tag` of a card line (same pattern as the parser's).
const TAG_TOKEN = /#([^\s#*]+)$/;

// Trailing image token `![alt](url)` at the very end of a card line.
const IMAGE_AT_END = new RegExp(IMAGE_TOKEN_SOURCE + "$");

type Emit = (type: HighlightTokenType, text: string, style?: Style) => void;

/** Tokenizes one card-side segment: images, hint brackets, style delimiters. */
function highlightInline(text: string, emit: Emit): void {
    let last = 0;
    let i = 0;
    const emitText = (end: number): void => {
        if (end > last) emit("text", text.slice(last, end));
    };
    while (i < text.length) {
        const ch = text[i]!;
        if (ch === "!") {
            // Image token: one leaf, matched before the `[` of `![`
            // could be mistaken for a hint bracket.
            IMAGE_TOKEN.lastIndex = i;
            const m = IMAGE_TOKEN.exec(text);
            if (m) {
                emitText(i);
                emit("image", m[0]);
                last = i = i + m[0].length;
                continue;
            }
            i++;
            continue;
        }
        if ((ch === "[" && text[i - 1] !== "!") || ch === "]") {
            // A `[` right after `!` belongs to an image token (or a
            // broken one) — never a hint bracket.
            emitText(i);
            emit("hint", ch);
            last = i = i + 1;
            continue;
        }
        const d = DELIMITERS.find((d) => text.startsWith(d.delim, i));
        if (!d) {
            i++;
            continue;
        }
        emitText(i);
        emit("delim", d.delim, d.style);
        last = i = i + d.delim.length;
    }
    emitText(text.length);
}

interface TrailingMarker {
    type: "tag" | "moon" | "image";
    text: string;
    /** Whitespace between this marker and the previous token. */
    gap: string;
}

/**
 * Strips trailing `*` / `#tag` markers from the end of a card line
 * (parser semantics), remembering each marker plus the whitespace gap
 * in front of it, so the round-trip (concatenated token texts ===
 * line) holds exactly.
 */
function stripTrailingMarkers(core: string): { body: string; markers: TrailingMarker[] } {
    const markers: TrailingMarker[] = [];
    let rest = core;
    for (;;) {
        let next: string | null = null;
        let marker: { type: "tag" | "moon" | "image"; text: string } | null = null;
        const img = IMAGE_AT_END.exec(rest);
        if (img) {
            next = rest.slice(0, img.index);
            marker = { type: "image", text: img[0] };
        } else if (rest.endsWith("*")) {
            next = rest.slice(0, -1);
            marker = { type: "moon", text: "*" };
        } else {
            const tagMatch = TAG_TOKEN.exec(rest);
            if (tagMatch) {
                next = rest.slice(0, tagMatch.index);
                marker = { type: "tag", text: tagMatch[0] };
            }
        }
        if (next === null || marker === null) break;
        const trimmed = next.trimEnd();
        markers.unshift({ ...marker, gap: next.slice(trimmed.length) });
        rest = trimmed;
    }
    return { body: rest, markers };
}

/** Splits the card body at the first ` - ` and the ` :: ` (parser semantics). */
function highlightCardBody(body: string, emit: Emit): void {
    const sep = body.indexOf(" - ");
    if (sep === -1) {
        highlightInline(body, emit);
        return;
    }
    const afterFront = body.slice(sep + 3);
    const ctxSep = afterFront.indexOf(" :: ");
    highlightInline(body.slice(0, sep), emit);
    emit("separator", " - ");
    if (ctxSep === -1) {
        highlightInline(afterFront, emit);
        return;
    }
    highlightInline(afterFront.slice(0, ctxSep), emit);
    emit("separator", " :: ");
    highlightInline(afterFront.slice(ctxSep + 4), emit);
}

/** One card line: body with inline tokens, then trailing markers. */
function highlightCardLine(line: string, emit: Emit): void {
    // Markers are extracted from the trimmed line (parser semantics);
    // whitespace beyond them stays plain text at the end.
    const core = line.trimEnd();
    const { body, markers } = stripTrailingMarkers(core);
    highlightCardBody(body, emit);
    for (const marker of markers) {
        if (marker.gap) emit("text", marker.gap);
        emit(marker.type, marker.text);
    }
    const tail = line.slice(core.length);
    if (tail) emit("text", tail);
}

/** One frontmatter line: `key: value`, a closing `---`, or blank. */
function highlightFrontmatterLine(line: string, nl: string, emit: Emit): "body" | null {
    if (line.trim() === "---") {
        emit("frontmatter-delimiter", line + nl);
        return "body";
    }
    if (line.trim().length === 0) {
        emit("text", line + nl);
        return null;
    }
    const colon = line.indexOf(":");
    if (colon === -1) {
        emit("frontmatter-key", line + nl);
    } else {
        emit("frontmatter-key", line.slice(0, colon + 1));
        emit("frontmatter-value", line.slice(colon + 1) + nl);
    }
    return null;
}

/** One body line: blank, `//` comment, `# ` title, or a card line. */
function highlightBodyLine(line: string, nl: string, emit: Emit): void {
    const leadWs = line.slice(0, line.length - line.trimStart().length);
    const content = line.trimStart();
    if (leadWs) emit("text", leadWs);
    if (content.trim().length === 0) {
        emit("text", content + nl);
        return;
    }
    if (content.startsWith("//")) {
        emit("comment", content + nl);
        return;
    }
    if (content.startsWith("# ")) {
        emit("title-marker", "#");
        emit("title-text", content.slice(1) + nl);
        return;
    }
    highlightCardLine(content + nl, emit);
}

/**
 * 0-based line numbers that carry a parse error (for squiggle
 * underlines in the editor). Parse errors attach a 1-based `line`
 * detail; errors without a location (e.g. a missing title) are skipped.
 */
export function errorLinesOf(errors: readonly NscError[]): Set<number> {
    const lines = new Set<number>();
    for (const e of errors) {
        const line = e.details["line"];
        if (typeof line === "number" && Number.isInteger(line) && line >= 1) lines.add(line - 1);
    }
    return lines;
}

/**
 * Splits deck markdown into highlight tokens. Mirrors the
 * parser's line semantics: an optional leading frontmatter block, then
 * body lines (blank, `//` comment, `# ` title, card lines).
 *
 * When `errorLines` (0-based) is given, tokens on those lines get
 * `error: true`; text tokens are split at newlines so the flag is
 * per-line. The round-trip invariant still holds exactly.
 */
export function highlightDeckSource(
    source: string,
    errorLines?: ReadonlySet<number>
): HighlightToken[] {
    const tokens: HighlightToken[] = [];
    let line = 0;
    const emit: Emit = (type, text, style) => {
        if (text.length === 0) return;
        if (errorLines === undefined) {
            if (style !== undefined) tokens.push({ type, text, style });
            else tokens.push({ type, text });
            return;
        }
        // Split at newlines so each segment is flagged with its own line.
        let start = 0;
        while (start < text.length) {
            const nl = text.indexOf("\n", start);
            const end = nl === -1 ? text.length : nl + 1;
            const error = errorLines.has(line) ? true : undefined;
            if (style !== undefined)
                tokens.push({ type, text: text.slice(start, end), style, error });
            else tokens.push({ type, text: text.slice(start, end), error });
            if (nl !== -1) line++;
            start = end;
        }
    };

    let phase: "prologue" | "frontmatter" | "body" = "prologue";
    // Splits after each newline so the "\n" stays attached to its line.
    for (const chunk of source.split(/(?<=\n)/)) {
        const hasNl = chunk.endsWith("\n");
        const line = hasNl ? chunk.slice(0, -1) : chunk;
        const nl = hasNl ? "\n" : "";

        if (phase === "prologue") {
            if (line.trim().length === 0) {
                emit("text", line + nl);
                continue;
            }
            if (line.trim() === "---") {
                emit("frontmatter-delimiter", line + nl);
                phase = "frontmatter";
                continue;
            }
            phase = "body";
        }
        if (phase === "frontmatter") {
            const next = highlightFrontmatterLine(line, nl, emit);
            if (next === "body") phase = "body";
            continue;
        }
        highlightBodyLine(line, nl, emit);
    }
    return tokens;
}
