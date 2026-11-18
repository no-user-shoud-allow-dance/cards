import { ErrorCode, NscError } from "#lib/core/errors";
import { DECK_TYPE_VALUES, type DeckType } from "#lib/core/deck/document";

/**
 * Branded string aliases for deck identity plus the single place where
 * they are created and validated. Plain strings live only at the edges;
 * inside the domain a raw string where a validated one is required is a
 * compile error.
 */

export type DeckTitle = string & { readonly __brand: "DeckTitle" };
export type FolderName = string & { readonly __brand: "FolderName" };
export type Slug = string & { readonly __brand: "Slug" };

export const TITLE_MAX_LENGTH = 100;
export const FOLDER_MAX_LENGTH = 60;
export const FOLDER_DEFAULT: FolderName = "Eigene" as FolderName;

/**
 * Folders come in two kinds: `simple` folders are ordinary grouping
 * folders (shown as sections), `special` folders act like tags and are
 * written lower-kebab-case with a leading `#` (`#drafts`). Users may
 * not create `#`-prefixed folders — those are reserved for the app.
 */
export type FolderKind = "simple" | "special";

/** `#lower-kebab-case` — the name pattern of special folders. */
export const SPECIAL_FOLDER_PATTERN = /^#[a-z0-9]+(-[a-z0-9]+)*$/;

export function isSpecialFolder(name: string): boolean {
    return name.startsWith("#");
}

export function folderKindOf(name: string): FolderKind {
    return isSpecialFolder(name) ? "special" : "simple";
}

/** The app-defined special folders, built through the checked constructor. */
export const SPECIAL_FOLDERS = {
    drafts: parseFolderName("#drafts", { allowSpecial: true }),
    continueLearning: parseFolderName("#continue-learning", { allowSpecial: true }),
    excludeFromContinue: parseFolderName("#exclude-from-continue-learning", {
        allowSpecial: true,
    }),
    pinned: parseFolderName("#pinned", { allowSpecial: true }),
} as const;

/** Folder every new draft deck (`Draft-{n}`) starts in: the special `#drafts`. */
export const DRAFT_FOLDER: FolderName = SPECIAL_FOLDERS.drafts as FolderName;

/** The number of a draft title ("Draft-3" → 3), or null for other titles. */
export function draftNumberOf(title: string): number | null {
    const match = /^Draft-(\d+)$/.exec(title.trim());
    return match ? Number.parseInt(match[1]!, 10) : null;
}
export const META_AUTHOR_MAX = 80;
export const META_DESCRIPTION_MAX = 300;
export const META_SOURCE_MAX = 120;

/** The optional frontmatter block, parsed and re-serialized losslessly. */
export interface DeckMeta {
    author?: string;
    description?: string;
    source?: string;
    /** Unknown keys preserved verbatim — lossless round-trip. */
    extra: Record<string, string>;
}

export function emptyDeckMeta(): DeckMeta {
    return { extra: {} };
}

/** trim, collapse inner whitespace, non-empty, ≤ 100 chars. */
export function parseDeckTitle(input: string): DeckTitle {
    const title = input.trim().replace(/\s+/g, " ");
    if (title.length === 0) throw new NscError(ErrorCode.TITLE_EMPTY);
    if (title.length > TITLE_MAX_LENGTH) {
        throw new NscError(ErrorCode.TITLE_TOO_LONG, {
            limit: TITLE_MAX_LENGTH,
            length: title.length,
        });
    }
    return title as DeckTitle;
}

/**
 * trim, ≤ 60 chars, no "/" or "\\"; empty input defaults to "Eigene".
 * A leading "#" is rejected unless `allowSpecial` is set (storage
 * restore, app-internal use) — and then it must match the special
 * folder pattern. Users can never create `#` folders.
 */
export function parseFolderName(input: string, opts: { allowSpecial?: boolean } = {}): FolderName {
    const folder = input.trim();
    if (folder.startsWith("#")) {
        if (!opts.allowSpecial) {
            throw new NscError(ErrorCode.FOLDER_RESERVED_PREFIX, { value: folder });
        }
        if (folder.length > FOLDER_MAX_LENGTH || !SPECIAL_FOLDER_PATTERN.test(folder)) {
            throw new NscError(ErrorCode.FOLDER_INVALID, { value: folder });
        }
        return folder as FolderName;
    }
    if (folder.length === 0) return FOLDER_DEFAULT;
    if (folder.includes("/") || folder.includes("\\")) {
        throw new NscError(ErrorCode.FOLDER_INVALID, { value: folder });
    }
    if (folder.length > FOLDER_MAX_LENGTH) {
        throw new NscError(ErrorCode.FOLDER_TOO_LONG, {
            limit: FOLDER_MAX_LENGTH,
            length: folder.length,
        });
    }
    return folder as FolderName;
}

/** The first simple folder of a deck, or null when it has only special ones. */
export function firstSimpleFolder(folders: readonly string[]): FolderName | null {
    return (folders.find((f) => !isSpecialFolder(f)) as FolderName | undefined) ?? null;
}

/**
 * Replaces all simple folders with `name` (user input, parsed); special
 * folders are kept except those in `drop` (e.g. `#drafts` after the
 * first save).
 */
export function withSimpleFolder(
    folders: readonly FolderName[],
    name: string,
    drop: readonly FolderName[] = []
): FolderName[] {
    const kept = folders.filter((f) => isSpecialFolder(f) && !drop.includes(f));
    return [...kept, parseFolderName(name)];
}

/**
 * Toggles one special folder (`#pinned`, `#exclude-from-continue-learning`,
 * …) on a folder list: present → removed, absent → appended. Pure and
 * idempotent; simple folders keep their relative order and stay before
 * the special ones. Only special folders may be toggled — passing a
 * simple name is a FOLDER_RESERVED_PREFIX error.
 */
export function toggleSpecialFolder(
    folders: readonly FolderName[],
    special: FolderName
): FolderName[] {
    if (!isSpecialFolder(special)) {
        throw new NscError(ErrorCode.FOLDER_RESERVED_PREFIX, { value: special });
    }
    const rest = folders.filter((f) => f !== special);
    const next = folders.includes(special) ? rest : [...rest, special];
    return [...next.filter((f) => !isSpecialFolder(f)), ...next.filter((f) => isSpecialFolder(f))];
}

/**
 * Trims and caps one frontmatter value. Known keys land in their typed
 * field; unknown keys go to `extra` untouched. `type` is not a meta key —
 * it is parsed separately into `DeckDocument.type`.
 */
export function parseDeckMetaValue(key: string, value: string): string {
    const trimmed = value.trim();
    const cap =
        key === "author"
            ? META_AUTHOR_MAX
            : key === "description"
              ? META_DESCRIPTION_MAX
              : key === "source"
                ? META_SOURCE_MAX
                : 0;
    if (cap > 0 && trimmed.length > cap) {
        throw new NscError(ErrorCode.META_VALUE_TOO_LONG, {
            key,
            limit: cap,
            length: trimmed.length,
        });
    }
    return trimmed;
}

/** Validates a deck-type frontmatter value; unknown values are a hard error. */
export function parseDeckTypeValue(value: string): DeckType {
    const normalized = value.trim().toLowerCase();
    if ((DECK_TYPE_VALUES as readonly string[]).includes(normalized)) {
        return normalized as DeckType;
    }
    throw new NscError(ErrorCode.PARSE_UNKNOWN_DECK_TYPE, { value });
}

/** `/^[0-9a-f]{16}-[a-z0-9]{4}$/` — hash + suffix, only via makeSlug(). */
export function isSlug(s: string): boolean {
    return /^[0-9a-f]{16}-[a-z0-9]{4}$/.test(s);
}

export function makeSlug(hash16: string, suffix: string): Slug {
    const slug = `${hash16}-${suffix}`;
    if (!isSlug(slug)) throw new NscError(ErrorCode.SLUG_INVALID, { slug });
    return slug as Slug;
}

/** Random 4-char base36 suffix for a slug. */
export function randomSlugSuffix(random: () => number = Math.random): string {
    let out = "";
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 4; i++) {
        out += alphabet[Math.floor(random() * alphabet.length)]!;
    }
    return out;
}

const GREEK_CHAR = /[\u0370-\u03ff\u1f00-\u1fff]/;
const LATIN_MACRON = /[āēīōū]/i;
const LATIN_ENDING = /\b\w+(?:us|um|is|ae|am|em|or|os|as|es|a|orum|arum|are|ere|ire)\b/i;

/**
 * Auto-detects the deck type from card fronts (plain text, hints already
 * removed): Greek by script, Latin by macrons or typical endings on most
 * prompts, English as the default. The result is a guess — the frontmatter
 * `type:` key overrides it.
 */
export function detectDeckType(frontsPlain: string[]): DeckType {
    if (frontsPlain.length === 0) return "english";
    const greek = frontsPlain.filter((p) => GREEK_CHAR.test(p)).length;
    if (greek / frontsPlain.length >= 0.25) return "greek";
    const latin = frontsPlain.filter((p) => LATIN_MACRON.test(p) || LATIN_ENDING.test(p)).length;
    if (latin / frontsPlain.length >= 0.5) return "latin";
    return "english";
}
