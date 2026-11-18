import { ErrorCode, NscError } from "#lib/core/errors";
import {
    detectDeckType,
    emptyDeckMeta,
    parseDeckMetaValue,
    parseDeckTitle,
    parseDeckTypeValue,
    type DeckMeta,
} from "#lib/core/deck/identity";
import {
    asRawCardSide,
    imageFromToken,
    IMAGE_TOKEN_SOURCE,
    parseInlineSide,
    unescapeCardSide,
} from "#lib/core/deck/inline";
import { extractHints, plainWithoutHints, type Hint } from "#lib/core/deck/hints";
import { makeCardId } from "#lib/core/deck/ids";
import {
    type Card,
    type CardImage,
    type DeckDocument,
    type DeckType,
    type StyledText,
    type Tag,
} from "#lib/core/deck/document";

/**
 * Unparsed deck source (L0). Only storage's `getRaw()` produces it in
 * production; only `parse()` consumes it — a markdown leak past the
 * storage boundary becomes a compile error.
 */
export type RawMarkdown = string & { readonly __brand: "RawMarkdown" };

/** The single constructor of RawMarkdown (storage boundary + tests). */
export function makeRawMarkdown(source: string): RawMarkdown {
    return source as RawMarkdown;
}

/** One parsed line of a deck file — a typed pipeline, not a string mixture. */
export type ParsedLine =
    | { kind: "blank"; line: number }
    | { kind: "frontmatter"; key: string; value: string; line: number }
    | { kind: "title"; text: string; line: number }
    | { kind: "comment"; line: number }
    | { kind: "card"; raw: string; line: number };

export const TAG_MAX_LENGTH = 24;

export function makeTag(raw: string): Tag {
    const tag = raw.trim().toLowerCase();
    if (tag.length === 0 || tag.length > TAG_MAX_LENGTH) {
        throw new NscError(ErrorCode.PARSE_TAG_TOO_LONG, {
            limit: TAG_MAX_LENGTH,
            value: raw,
        });
    }
    return tag as Tag;
}

interface SideResult {
    text: StyledText;
    hints: Hint[];
}

function parseSide(segment: string, side: "front" | "back", line: number): SideResult {
    try {
        const text = parseInlineSide(asRawCardSide(unescapeCardSide(segment.trim())));
        const extracted = extractHints(text.plain, text.spans, side);
        return {
            text: { plain: extracted.plain, spans: extracted.spans, images: text.images },
            hints: extracted.hints,
        };
    } catch (e) {
        if (e instanceof NscError) throw new NscError(e.code, { ...e.details, line });
        throw e;
    }
}

// A trailing image token `![alt](url)` at the very end of a card line
// (compiled from the single token shape in inline.ts).
const IMAGE_AT_END = new RegExp(IMAGE_TOKEN_SOURCE + "$");

interface TrailingMarkers {
    body: string;
    tags: Tag[];
    hidden: boolean;
    /** The trailing image field, if the line ends with one. */
    image: CardImage | null;
}

/** Splits the trailing image, `#tag` tokens and the moon `*` off a card line. */
function extractTrailingMarkers(line: string): TrailingMarkers {
    let rest = line.trimEnd();
    let hidden = false;
    let image: CardImage | null = null;
    const tags: Tag[] = [];
    for (;;) {
        const img = IMAGE_AT_END.exec(rest);
        if (img) {
            // At most one image per card.
            if (image) throw new NscError(ErrorCode.PARSE_TOO_MANY_IMAGES, {});
            image = imageFromToken(img[0]);
            rest = rest.slice(0, img.index).trimEnd();
            continue;
        }
        if (rest.endsWith("*")) {
            hidden = true;
            rest = rest.slice(0, -1).trimEnd();
            continue;
        }
        const tagMatch = /#([^\s#*]+)$/.exec(rest);
        if (tagMatch) {
            tags.unshift(makeTag(tagMatch[1]!));
            rest = rest.slice(0, tagMatch.index).trimEnd();
            continue;
        }
        break;
    }
    const deduped = [...new Set(tags)];
    return { body: rest, tags: deduped, hidden, image };
}

/** Splits `front - back :: context` into its three raw segments. */
function splitSides(
    body: string,
    lineNo: number
): { frontRaw: string; backRaw: string; contextRaw: string | null } {
    const sep = body.indexOf(" - ");
    if (sep === -1) {
        // A separator at the very edge ("- back" / "front -") means one
        // side is empty — that is the more precise error.
        if (body.startsWith("- ") || body.endsWith(" -")) {
            throw new NscError(ErrorCode.PARSE_EMPTY_SIDE, { line: lineNo });
        }
        throw new NscError(ErrorCode.PARSE_MISSING_SEPARATOR, { line: lineNo, text: body });
    }
    const frontRaw = body.slice(0, sep);
    let rest = body.slice(sep + 3);
    let contextRaw: string | null = null;
    const ctxSep = rest.indexOf(" :: ");
    if (ctxSep !== -1) {
        contextRaw = rest.slice(ctxSep + 4);
        rest = rest.slice(0, ctxSep);
    }
    if (frontRaw.trim().length === 0 || rest.trim().length === 0) {
        throw new NscError(ErrorCode.PARSE_EMPTY_SIDE, { line: lineNo });
    }
    return { frontRaw, backRaw: rest, contextRaw };
}

function parseCardLine(line: string, lineNo: number): Card {
    let markers: TrailingMarkers;
    try {
        markers = extractTrailingMarkers(line);
    } catch (e) {
        if (e instanceof NscError) throw new NscError(e.code, { ...e.details, line: lineNo });
        throw e;
    }
    const { body, tags, hidden, image } = markers;
    const { frontRaw, backRaw, contextRaw } = splitSides(body, lineNo);
    const front = parseSide(frontRaw, "front", lineNo);
    const back = parseSide(backRaw, "back", lineNo);
    const context =
        contextRaw !== null && contextRaw.trim().length > 0
            ? parseSide(contextRaw, "back", lineNo).text
            : undefined;
    const hints = [...front.hints, ...back.hints];
    return {
        id: makeCardId(front.text, back.text),
        front: front.text,
        back: back.text,
        context,
        hints,
        tags,
        hidden,
        image: image ?? undefined,
    };
}

interface FrontmatterResult {
    lines: ParsedLine[];
    type: DeckType | null;
    meta: DeckMeta;
    /** Index of the closing "---" line. */
    end: number;
    errors: NscError[];
}

function parseFrontmatter(lines: string[], startIndex: number): FrontmatterResult {
    const parsed: ParsedLine[] = [];
    const meta = emptyDeckMeta();
    const errors: NscError[] = [];
    let type: DeckType | null = null;
    let i = startIndex + 1;
    for (; i < lines.length; i++) {
        const trimmed = lines[i]!.trim();
        if (trimmed === "---") {
            return { lines: parsed, type, meta, end: i, errors };
        }
        if (trimmed.length === 0) continue;
        const colon = trimmed.indexOf(":");
        const key = colon === -1 ? trimmed : trimmed.slice(0, colon).trim();
        const value = colon === -1 ? "" : trimmed.slice(colon + 1).replace(/^ /, "");
        parsed.push({ kind: "frontmatter", key, value, line: i + 1 });
        if (key === "type") {
            // An unknown type value is a collected error, but it must not
            // cascade: the block is still consumed up to its closing "---".
            try {
                type = parseDeckTypeValue(value);
            } catch (e) {
                if (e instanceof NscError)
                    errors.push(new NscError(e.code, { ...e.details, line: i + 1 }));
                else throw e;
            }
        } else if (key === "author" || key === "description" || key === "source") {
            try {
                meta[key] = parseDeckMetaValue(key, value);
            } catch (e) {
                if (e instanceof NscError)
                    errors.push(new NscError(e.code, { ...e.details, line: i + 1 }));
                else throw e;
            }
        } else {
            meta.extra[key] = value;
        }
    }
    throw new NscError(ErrorCode.PARSE_UNTERMINATED_FRONTMATTER, { line: startIndex + 1 });
}

/**
 * Parses deck markdown into a DeckDocument.
 * Throws the first NscError; `validate()` collects all line errors.
 */
/** Parses the body after the frontmatter: title line + card lines. */
function collectBody(
    lines: string[],
    start: number
): {
    title: string | null;
    cards: Card[];
    errors: NscError[];
} {
    let title: string | null = null;
    const cards: Card[] = [];
    const errors: NscError[] = [];
    for (let i = start; i < lines.length; i++) {
        const trimmed = lines[i]!.trim();
        if (trimmed.length === 0) continue;
        if (trimmed.startsWith("//")) continue; // full-line comment: skipped
        if (trimmed.startsWith("# ") && title === null && cards.length === 0) {
            title = trimmed.slice(2).trim();
            continue;
        }
        try {
            cards.push(parseCardLine(trimmed, i + 1));
        } catch (e) {
            if (e instanceof NscError) errors.push(e);
            else throw e;
        }
    }
    return { title, cards, errors };
}

/** Reads the optional frontmatter block at `start`; returns where the body begins. */
function readPrologue(
    lines: string[],
    start: number
): {
    type: DeckType | null;
    meta: DeckMeta;
    /** Where the body starts, or null when there is no body (unterminated frontmatter). */
    next: number | null;
    errors: NscError[];
} {
    let i = start;
    while (i < lines.length && lines[i]!.trim().length === 0) i++; // skip leading blanks
    let type: DeckType | null = null;
    const meta = emptyDeckMeta();
    const errors: NscError[] = [];
    if (i < lines.length && lines[i]!.trim() === "---") {
        try {
            const fm = parseFrontmatter(lines, i);
            type = fm.type;
            Object.assign(meta, fm.meta);
            errors.push(...fm.errors);
            i = fm.end + 1;
        } catch (e) {
            if (e instanceof NscError && e.code === ErrorCode.PARSE_UNTERMINATED_FRONTMATTER) {
                // No closing "---": the whole rest is frontmatter, there is no body.
                errors.push(e);
                return { type, meta, next: null, errors };
            }
            throw e;
        }
    }
    return { type, meta, next: i, errors };
}

export function parseCollect(raw: RawMarkdown): { doc: DeckDocument | null; errors: NscError[] } {
    const lines = raw.split(/\r?\n/);
    const prologue = readPrologue(lines, 0);
    const body =
        prologue.next === null
            ? { title: null, cards: [], errors: [] as NscError[] }
            : collectBody(lines, prologue.next);
    const errors = [...prologue.errors, ...body.errors];
    if (prologue.next !== null && body.title === null)
        errors.push(new NscError(ErrorCode.PARSE_MISSING_TITLE));
    if (errors.length > 0) return { doc: null, errors };

    const doc: DeckDocument = {
        title: parseDeckTitle(body.title!),
        type: prologue.type ?? detectDeckType(body.cards.map((c) => plainWithoutHints(c, "front"))),
        meta: prologue.meta,
        cards: body.cards,
    };
    return { doc, errors };
}

/** Throws the first NscError; use validate() to collect all of them. */
export function parse(raw: RawMarkdown): DeckDocument {
    const { doc, errors } = parseCollect(raw);
    if (!doc) throw errors[0]!;
    return doc;
}

/** All parse errors without throwing — for the import preview. */
export function validate(raw: RawMarkdown): NscError[] {
    return parseCollect(raw).errors;
}
