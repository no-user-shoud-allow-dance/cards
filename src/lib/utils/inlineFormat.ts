/**
 * Limited inline markdown support for card sides. Only a small allowlist
 * of formatting constructs is recognized — every other markup stays
 * literal text.
 *
 * Syntax (delimiters wrap the content, like the toolbar inserts):
 *   `code`  **bold**  *italic*  ++underline++  ~~strike~~
 *   ==mark==  ^superscript^  ~subscript~
 *
 * Security: decks arrive from other users via share links, so rendering
 * never uses `{@html}`. `parseRichText` builds a node tree that a
 * component renders with real allowlisted elements only; unknown or
 * malformed markup stays escaped text.
 */

export const ALLOWED_TAGS = [
    "code",
    "sup",
    "sub",
    "b",
    "i",
    "u",
    "s",
    "mark",
] as const;
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

/** The markdown delimiter pair wrapping content of each allowed tag. */
export const TAG_DELIMITER: Record<AllowedTag, string> = {
    code: "`",
    b: "**",
    i: "*",
    u: "++",
    s: "~~",
    mark: "==",
    sup: "^",
    sub: "~",
};

// Longest delimiters first, so "**" wins over "*" at the same position.
const DELIMITERS: { tag: AllowedTag; delim: string }[] = (
    Object.entries(TAG_DELIMITER) as [AllowedTag, string][]
)
    .map(([tag, delim]) => ({ tag, delim }))
    .sort((a, b) => b.delim.length - a.delim.length);

export interface SourceToken {
    type: "text" | "open" | "close";
    /** Raw source of the token; for delimiters the literal, e.g. `**`. */
    raw: string;
    tag?: AllowedTag;
    start: number;
    end: number;
}

/**
 * Splits text into plain-text and delimiter tokens. A delimiter closes
 * the innermost open tag of the same kind, otherwise it opens one (so
 * `**bold**` pairs up naturally). Text between delimiters is verbatim.
 */
export function tokenizeInline(text: string): SourceToken[] {
    const tokens: SourceToken[] = [];
    const stack: AllowedTag[] = [];
    let last = 0;
    let i = 0;
    while (i < text.length) {
        const d = DELIMITERS.find((d) => text.startsWith(d.delim, i));
        if (!d) {
            i++;
            continue;
        }
        const top = stack[stack.length - 1];
        const type: "open" | "close" = top === d.tag ? "close" : "open";
        if (i > last) {
            tokens.push({
                type: "text",
                raw: text.slice(last, i),
                start: last,
                end: i,
            });
        }
        tokens.push({
            type,
            raw: d.delim,
            tag: d.tag,
            start: i,
            end: i + d.delim.length,
        });
        if (type === "open") stack.push(d.tag);
        else stack.pop();
        last = i = i + d.delim.length;
    }
    if (last < text.length) {
        tokens.push({
            type: "text",
            raw: text.slice(last),
            start: last,
            end: text.length,
        });
    }
    return tokens;
}

export type RichNode =
    | { type: "text"; text: string }
    | { type: "element"; tag: AllowedTag; children: RichNode[] };

/**
 * Parses text into a renderable node tree. Nesting of allowlisted
 * constructs is supported; a closing delimiter only pairs with the
 * innermost open tag of the same kind (anything else stays literal
 * text), and constructs left open at the end are closed implicitly.
 */
export function parseRichText(text: string): RichNode[] {
    const root: RichNode[] = [];
    const stack: { tag: AllowedTag; children: RichNode[] }[] = [];
    const current = (): RichNode[] =>
        stack.length > 0 ? stack[stack.length - 1]!.children : root;

    for (const token of tokenizeInline(text)) {
        if (token.type === "text") {
            current().push({ type: "text", text: token.raw });
            continue;
        }
        if (token.type === "open") {
            stack.push({ tag: token.tag!, children: [] });
            continue;
        }
        // Closing delimiter: pairs only with the innermost open tag.
        const top = stack[stack.length - 1];
        if (top && top.tag === token.tag) {
            stack.pop();
            current().push({
                type: "element",
                tag: top.tag,
                children: top.children,
            });
        } else {
            current().push({ type: "text", text: token.raw });
        }
    }

    // Implicitly close constructs left open at the end.
    while (stack.length > 0) {
        const { tag, children } = stack.pop()!;
        current().push({ type: "element", tag, children });
    }
    return root;
}

/**
 * Removes all allowlisted delimiter tokens, keeping their inner text.
 * Used where plain text is wanted (search queries, progress diffs).
 */
export function stripInlineFormat(text: string): string {
    return tokenizeInline(text)
        .filter((token) => token.type === "text")
        .map((token) => token.raw)
        .join("");
}

/**
 * Structural signature of the delimiter tokens in source: "C<raw>" per
 * chip (open / close token) and "L<tag>" per live element, in document
 * order, joined with "|". The source editor compares this with the
 * signature of its DOM to detect hand-typed formatting that still sits
 * in plain text nodes and needs to be re-rendered as chips + live
 * preview.
 */
export function tagStructureSignature(source: string): string {
    const out: string[] = [];
    const stack: AllowedTag[] = [];
    for (const token of tokenizeInline(source)) {
        if (token.type === "text") continue;
        if (token.type === "open") {
            out.push("C" + token.raw);
            out.push("L" + token.tag);
            stack.push(token.tag!);
        } else if (stack[stack.length - 1] === token.tag) {
            stack.pop();
            out.push("C" + token.raw);
        }
        // Unmatched closing delimiters stay literal text — no entry.
    }
    return out.join("|");
}

/** Wraps the character range [start, end) of source in the given tag. */
export function wrapRange(
    source: string,
    start: number,
    end: number,
    tag: AllowedTag,
): string {
    const s = Math.max(0, Math.min(start, end));
    const e = Math.max(0, Math.max(start, end));
    const delim = TAG_DELIMITER[tag];
    return source.slice(0, s) + delim + source.slice(s, e) + delim + source.slice(e);
}

/**
 * Removes the delimiter token at character offset `pos` together with
 * its matching counterpart (nesting-aware for same-kind delimiters). An
 * unclosed opening delimiter loses only the clicked token. Returns the
 * new source and the caret position where the token was, or null when
 * no delimiter token starts at `pos`.
 */
export function removeTagPair(
    source: string,
    pos: number,
): { text: string; caret: number } | null {
    const tokens = tokenizeInline(source);
    const idx = tokens.findIndex(
        (token) => token.start === pos && token.type !== "text",
    );
    if (idx === -1) return null;
    const token = tokens[idx]!;

    const removals: SourceToken[] = [token];
    let depth = 0;
    let match = -1;
    if (token.type === "open") {
        for (let i = idx + 1; i < tokens.length; i++) {
            const t = tokens[i]!;
            if (t.type === "text" || t.tag !== token.tag) continue;
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
            if (t.type === "text" || t.tag !== token.tag) continue;
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
    const ranges = removals
        .map((t) => [t.start, t.end] as const)
        .sort((a, b) => b[0] - a[0]);
    let text = source;
    for (const [s, e] of ranges) text = text.slice(0, s) + text.slice(e);
    return { text, caret: token.start };
}
