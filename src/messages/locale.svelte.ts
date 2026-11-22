import { isNscError, type ErrorCode as ErrorCodeType } from "#lib/core/errors";
import type { Locale } from "#lib/repositories/settingsRepository";
import { de } from "./languages/de";
import { en } from "./languages/en";
import { type Messages } from "./messages";

/**
 * The reactive locale accessor. Static `import { UI } from "#messages/languages/de"`
 * cannot react to a language switch, so every import site uses this
 * module instead. Svelte forbids exporting `$derived` from a module, so
 * each section is a stable facade object whose property reads resolve
 * through the current locale — reading them in a template/$derived is
 * reactive because the underlying `current` is `$state`. The settings
 * store pushes locale changes here via `setMessagesLocale` (state →
 * messages direction, like toasts).
 */

const MESSAGES: Record<Locale, Messages> = { de, en };

let current = $state<Locale>("de");

export function getLocale(): Locale {
    return current;
}

/** Called by the settings store whenever the persisted locale changes. */
export function setMessagesLocale(locale: Locale): void {
    current = locale;
}

/** A section facade: every property read resolves in the current locale. */
function reactiveSection<K extends keyof Messages>(key: K): Messages[K] {
    return new Proxy({} as Messages[K], {
        get: (_target, prop) => Reflect.get(MESSAGES[current][key], prop),
    });
}

/** Normative UI wording in the current locale (reactive). */
export const UI = reactiveSection("UI");
export const MIGRATION = reactiveSection("MIGRATION");
export const SYNC = reactiveSection("SYNC");
export const SHARE = reactiveSection("SHARE");

/** Maps an error code to its sentence in the current locale. */
export function errorMessage(code: ErrorCodeType): string {
    return MESSAGES[current].errors[code] ?? String(code);
}

/**
 * The one-call mapping for catch sites: an `NscError` goes through the
 * code table, anything else gets the generic link fallback.
 */
export function messageOf(error: unknown): string {
    return isNscError(error) ? errorMessage(error.code) : MESSAGES[current].SHARE.linkDamaged;
}
