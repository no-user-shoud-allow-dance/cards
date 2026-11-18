import { STYLES, type Style } from "#lib/core/deck/document";
import { smallEngine } from "#lib/storage/detect";
import { readJson, writeJson } from "#lib/storage/engine";
import { STORAGE } from "#lib/storage/keys";

/**
 * Settings repository — ONE versioned JSON record under
 * kk-settings. The record contract lives here, including the print
 * options object; the store above only sees the Settings model.
 * Records of a wrong shape are rejected → defaults (no migration);
 * older records that merely lack newer fields are bumped with defaults.
 */

export type Theme = "system" | "light" | "dark";

/** UI language. The messages layer keeps its own identical union (type-only). */
export type Locale = "de" | "en";

/** The print options of /print/[slug], persisted inside the settings record. */
export interface PrintOptionsRecord {
    /** Exclude mooned (trailing `*`) cards. */
    hideMooned: boolean;
    /** Tags whose cards are excluded from the printout. */
    hiddenTags: string[];
    /** Add the context (`::`) field as a column. */
    showContext: boolean;
    /** Render each card's image. */
    showImages: boolean;
    /** Render the `#tag` markers under the front side. */
    showTags: boolean;
    /** Render the "Nr." column. */
    showNumbers: boolean;
    /** Render the table header row (Vorderseite / Rückseite / …). */
    showHeader: boolean;
    /** Print the deck title above the table. */
    showTitle: boolean;
    /** Alternating row colors (zebra) — never on the learning space. */
    zebraRows: boolean;
    /**
     * Paper learning (Lernpapier): each card row gets an empty right cell
     * (50 % width) as writing space, split from the card half by a line.
     */
    paperRows: boolean;
    /** Render the table's border and splitter lines. */
    showBorders: boolean;
    /** Watermark on every printed page: favicon + "NSC", bottom left. */
    showWatermark: boolean;
    /** Master switch for inline formatting. */
    renderStyles: boolean;
    /** Styles still rendered when `renderStyles` is on (all by default). */
    enabledStyles: Style[];
}

export function defaultPrintOptionsRecord(): PrintOptionsRecord {
    return {
        hideMooned: false,
        hiddenTags: [],
        showContext: false,
        showImages: false,
        showTags: true,
        showNumbers: true,
        showHeader: true,
        showTitle: true,
        zebraRows: false,
        paperRows: false,
        showBorders: true,
        showWatermark: true,
        renderStyles: true,
        enabledStyles: [...STYLES],
    };
}

const PRINT_BOOLEAN_KEYS = [
    "hideMooned",
    "showContext",
    "showImages",
    "showTags",
    "showNumbers",
    "showHeader",
    "showTitle",
    "zebraRows",
    "paperRows",
    "showBorders",
    "showWatermark",
    "renderStyles",
] as const;

/** Coerces an unknown parsed value into a valid PrintOptionsRecord. */
export function normalizePrintOptions(input: unknown): PrintOptionsRecord {
    const out = defaultPrintOptionsRecord();
    if (typeof input !== "object" || input === null) return out;
    const rec = input as Record<string, unknown>;
    for (const key of PRINT_BOOLEAN_KEYS) {
        if (typeof rec[key] === "boolean") out[key] = rec[key];
    }
    if (Array.isArray(rec.hiddenTags)) {
        out.hiddenTags = rec.hiddenTags.filter((t): t is string => typeof t === "string");
    }
    if (Array.isArray(rec.enabledStyles)) {
        out.enabledStyles = rec.enabledStyles.filter((s): s is Style =>
            (STYLES as readonly string[]).includes(s as string)
        );
    }
    return out;
}

/** The settings model the store mirrors; persisted as record. */
export interface Settings {
    pureMode: boolean;
    theme: Theme;
    /** Mistral API key, stored locally only; reserved for upcoming AI features. */
    mistralApiKey: string;
    privacyToastDismissed: boolean;
    impersistentToastDismissed: boolean;
    /** Print options of /print/[slug] — kept as one object. */
    printOptions: PrintOptionsRecord;
    /** UI language (default German). */
    locale: Locale;
}

export function defaultSettings(): Settings {
    return {
        pureMode: false,
        theme: "system",
        mistralApiKey: "",
        privacyToastDismissed: false,
        impersistentToastDismissed: false,
        printOptions: defaultPrintOptionsRecord(),
        locale: "de",
    };
}

function isTheme(value: unknown): value is Theme {
    return value === "light" || value === "dark" || value === "system";
}

function isLocale(value: unknown): value is Locale {
    return value === "de" || value === "en";
}

/**
 * Accepts the current record shape AND older records without the newer
 * fields (`locale`) — normalizeSettings fills those with defaults, so
 * old records bump non-destructively. (A stale `pureModeBySlug` of the
 * pre-2.0 format is simply ignored.)
 */
function isSettingsRecord(value: unknown): value is Settings {
    if (typeof value !== "object" || value === null) return false;
    const r = value as Record<string, unknown>;
    return (
        typeof r.pureMode === "boolean" &&
        typeof r.theme === "string" &&
        typeof r.mistralApiKey === "string" &&
        typeof r.privacyToastDismissed === "boolean" &&
        typeof r.impersistentToastDismissed === "boolean" &&
        typeof r.printOptions === "object" &&
        r.printOptions !== null
    );
}

/** Field-wise coercion into a valid Settings (bad or missing values → defaults). */
function normalizeSettings(record: unknown): Settings {
    const r = (typeof record === "object" && record !== null ? record : {}) as Record<
        string,
        unknown
    >;
    return {
        pureMode: r.pureMode === true,
        theme: isTheme(r.theme) ? r.theme : "system",
        mistralApiKey: typeof r.mistralApiKey === "string" ? r.mistralApiKey : "",
        privacyToastDismissed: r.privacyToastDismissed === true,
        impersistentToastDismissed: r.impersistentToastDismissed === true,
        printOptions: normalizePrintOptions(r.printOptions),
        locale: isLocale(r.locale) ? r.locale : "de",
    };
}

export interface SettingsRepository {
    /** The persisted settings; defaults when missing, corrupt, or an old version. */
    get(): Promise<Settings>;
    put(settings: Settings): Promise<void>;
    /** Deletes the record (the store then resets to defaults). */
    remove(): Promise<void>;
}

/** Settings are one small record, so the repository picks a small engine itself. */
export async function createSettingsRepository(): Promise<SettingsRepository> {
    const engine = await smallEngine();
    const key = STORAGE.localStorage.settings;
    return {
        async get() {
            const value = await readJson(engine, key);
            return isSettingsRecord(value) ? normalizeSettings(value) : defaultSettings();
        },
        async put(settings) {
            await writeJson(engine, key, settings);
        },
        async remove() {
            await engine.delete(key);
        },
    };
}
