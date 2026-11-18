import { ErrorCode, NscError } from "#lib/core/errors";
import {
    STYLES,
    type CardImage,
    type Span,
    type Style,
    type StyledText,
} from "#lib/core/deck/document";

/**
 * Raw side text before span parsing. Only this module turns it into a
 * `StyledText` — unparsed markup cannot reach a renderer.
 */
export type RawCardSide = string & { readonly __brand: "RawCardSide" };

/** The single constructor of RawCardSide. */
export function asRawCardSide(text: string): RawCardSide {
    return text as RawCardSide;
}

/** Markdown delimiter per style. */
export const STYLE_DELIMITER: Record<Style, string> = {
    bold: "**",
    italic: "*",
    code: "`",
    underline: "++",
    strike: "~~",
    mark: "==",
    sup: "^",
    sub: "~",
};

// Longest delimiters first, so "**" wins over "*" at the same position.
const DELIMITERS: { style: Style; delim: string }[] = STYLES.map((style) => ({
    style,
    delim: STYLE_DELIMITER[style],
})).sort((a, b) => b.delim.length - a.delim.length);

/**
 * URL segment of an image token: non-space, non-parenthesis characters
 * allowing one level of balanced parentheses (Wikipedia-style
 * `File_(1).png` URLs), so a `)` inside a URL does not end the token.
 */
export const IMAGE_URL = String.raw`(?:[^()\s]|\([^()]*\))+`;

/**
 * Full image token `![alt](url)` — the single source of truth for the
 * token's shape. The delimiter scanners (editor, highlighter, hints)
 * and the parser compile it with the flags they need, so image tokens
 * tokenize identically everywhere.
 */
export const IMAGE_TOKEN_SOURCE = String.raw`!\[[^\]]*\]\(` + IMAGE_URL + String.raw`\)`;

// Capturing variant (alt + URL) used to strip/collect image tokens.
const IMAGE_PATTERN = new RegExp(
    String.raw`!\[([^\]]*)\]\(` + `(${IMAGE_URL})` + String.raw`\)`,
    "g"
);

// Exact-match variant (alt + URL) of one complete token; captures both.
const IMAGE_TOKEN_EXACT = new RegExp(
    String.raw`^!\[([^\]]*)\]\(` + `(${IMAGE_URL})` + String.raw`\)$`
);

// Sticky variant, matched at one position (used to keep image tokens
// atomic while scanning for delimiters).
const IMAGE_TOKEN = new RegExp(IMAGE_TOKEN_SOURCE, "y");

/** Security boundary: only absolute https URLs may become `<img src>`. */
export function isValidImageUrl(url: string): boolean {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

interface Token {
    kind: "text" | "delim";
    raw: string;
    style?: Style;
    delim?: string;
    role?: "open" | "close" | "literal";
}

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let last = 0;
    let i = 0;
    while (i < source.length) {
        if (source[i] === "!") {
            // Image token: atomic — it stays verbatim in `plain`, so
            // delimiters or brackets inside alt/URL are never parsed
            // as styles or hints.
            IMAGE_TOKEN.lastIndex = i;
            const m = IMAGE_TOKEN.exec(source);
            if (m) {
                if (i > last) tokens.push({ kind: "text", raw: source.slice(last, i) });
                tokens.push({ kind: "text", raw: m[0] });
                i += m[0].length;
                last = i;
                continue;
            }
            i++;
            continue;
        }
        const d = DELIMITERS.find((d) => source.startsWith(d.delim, i));
        if (!d) {
            i++;
            continue;
        }
        if (i > last) tokens.push({ kind: "text", raw: source.slice(last, i) });
        tokens.push({ kind: "delim", raw: d.delim, style: d.style, delim: d.delim });
        i += d.delim.length;
        last = i;
    }
    if (last < source.length) tokens.push({ kind: "text", raw: source.slice(last) });
    return tokens;
}

/** Pairs delimiter tokens (stack per position); unmatched ones stay literal. */
function pairTokens(tokens: Token[]): void {
    const stack: number[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!;
        if (t.kind !== "delim") continue;
        const top = stack[stack.length - 1];
        if (top !== undefined && tokens[top]!.style === t.style) {
            tokens[top]!.role = "open";
            t.role = "close";
            stack.pop();
        } else {
            stack.push(i);
        }
    }
    for (const i of stack) tokens[i]!.role = "literal";
}

/** The one checked constructor of Span. */
export function makeSpan(style: Style, start: number, end: number, plainLength: number): Span {
    if (
        !STYLES.includes(style) ||
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        start >= end ||
        end > plainLength
    ) {
        throw new NscError(ErrorCode.SPAN_INVALID, { style, start, end, plainLength });
    }
    return { style, start, end };
}

/**
 * Parses one raw card side into plain text + spans + validated images.
 * Style delimiters are removed from `plain`; image tokens stay verbatim
 * in `plain` (lossless editor round-trip) and are additionally collected
 * into `images` after https validation. Bracketed hints are NOT touched
 * here — hints.ts works on the resulting `plain`.
 */
export function parseInlineSide(raw: RawCardSide): StyledText {
    const tokens = tokenize(raw);
    pairTokens(tokens);
    let plain = "";
    const spans: Span[] = [];
    const openAt: (number | undefined)[] = [];
    for (const t of tokens) {
        if (t.kind === "text" || t.role === "literal") {
            plain += t.raw;
            continue;
        }
        if (t.role === "open") {
            openAt[STYLES.indexOf(t.style!)] = plain.length;
        } else {
            const start = openAt[STYLES.indexOf(t.style!)];
            if (start !== undefined) {
                spans.push({ style: t.style!, start, end: plain.length });
            }
            openAt[STYLES.indexOf(t.style!)] = undefined;
        }
    }
    spans.sort((a, b) => a.start - b.start || b.end - a.end);
    const validated = spans.map((s) => makeSpan(s.style, s.start, s.end, plain.length));
    return { plain, spans: validated, images: extractImages(plain) };
}

/** Builds the raw image token `![alt](url)` from a validated CardImage. */
export function imageToken(image: CardImage): string {
    return `![${image.alt}](${image.url})`;
}

/**
 * Parses one raw image token into alt + URL, validating the https
 * boundary. Throws PARSE_INVALID_IMAGE_URL for malformed tokens or
 * non-https URLs.
 */
export function imageFromToken(token: string): CardImage {
    const m = IMAGE_TOKEN_EXACT.exec(token);
    const url = m?.[2] ?? "";
    if (!m || !isValidImageUrl(url)) {
        throw new NscError(ErrorCode.PARSE_INVALID_IMAGE_URL, { url });
    }
    return { alt: m[1] ?? "", url };
}

/** Removes all image tokens from a plain text. */
export function stripImageTokens(text: string): string {
    return text.replace(IMAGE_PATTERN, "");
}

/** Replaces every image token in a plain text by its alt text. */
export function imageTokensToAltText(text: string): string {
    return text.replace(IMAGE_PATTERN, (_match, alt: string) => alt);
}

/** Valid https image tokens of a plain text as alt + URL. */
export function extractImages(plain: string): CardImage[] {
    const images: CardImage[] = [];
    for (const match of plain.matchAll(IMAGE_PATTERN)) {
        const alt = match[1] ?? "";
        const url = match[2] ?? "";
        if (!isValidImageUrl(url)) {
            throw new NscError(ErrorCode.PARSE_INVALID_IMAGE_URL, { url });
        }
        images.push({ alt, url });
        if (images.length > 1) {
            throw new NscError(ErrorCode.PARSE_TOO_MANY_IMAGES, {
                side: "front-or-back",
            });
        }
    }
    return images;
}

/** Escapes a side for the one-line-per-card format: `\\` first, then `\n`. */
export function escapeCardSide(text: string): string {
    return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
}

/** Inverse of escapeCardSide, single pass left to right. */
export function unescapeCardSide(text: string): string {
    return text.replace(/\\(.)/g, (match, ch: string) =>
        ch === "n" ? "\n" : ch === "\\" ? "\\" : match
    );
}

/**
 * Serializes a side back to raw markup: hint brackets first, then style
 * delimiters (inserted at descending offsets so earlier offsets stay
 * valid). `hintRanges` are the side's hint ranges in `plain` coordinates
 * (any number of them). Overlapping spans (nesting) re-serialize to
 * nested markup.
 */
export function serializeInlineSide(
    text: StyledText,
    hintRanges: { start: number; end: number }[] = []
): RawCardSide {
    let out = text.plain;
    const inserts: { pos: number; text: string }[] = [];
    for (const h of hintRanges) {
        inserts.push({ pos: h.end, text: "]" }, { pos: h.start, text: "[" });
    }
    for (const span of text.spans) {
        const delim = STYLE_DELIMITER[span.style];
        inserts.push({ pos: span.end, text: delim }, { pos: span.start, text: delim });
    }
    inserts.sort((a, b) => b.pos - a.pos || b.text.length - a.text.length);
    for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
    return asRawCardSide(out);
}
