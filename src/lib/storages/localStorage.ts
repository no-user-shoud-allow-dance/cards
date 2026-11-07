import type { CardStates, PersistedTimerState } from "../types";

/** Key prefix for everything the app writes to localStorage. */
export const PREFIX = "kk_";

/**
 * Schema mapping each storage key (without prefix) to a default value.
 * The type of the default determines both the TypeScript type and the
 * storage format: boolean defaults use "true"/"false" strings;
 * everything else is JSON.
 */
const schema = {
    states: {} as CardStates,
    overview_done: {} as Record<string, boolean>,
    pure: false as boolean,
    google_disabled: true as boolean,
    study_time: {} as Record<string, number>,
    timer_state: {} as Record<string, PersistedTimerState>,
    mistral_api_key: "" as string,
    intro_open: true as boolean,
    privacy_toast_dismissed: false as boolean,
    impersistent_toast_dismissed: false as boolean,
} as const;

type SchemaKey = keyof typeof schema;
type SchemaValue<K extends SchemaKey> = (typeof schema)[K];

/** Reads a value from localStorage by schema key. Returns null if missing or unparseable. */
export function read<K extends SchemaKey>(key: K): SchemaValue<K> | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return null;
        if (typeof schema[key] === "boolean") {
            return (raw === "true") as SchemaValue<K>;
        }
        return JSON.parse(raw) as SchemaValue<K>;
    } catch {
        return null;
    }
}

/** Writes a value to localStorage by schema key. No-op during SSR. */
export function write<K extends SchemaKey>(
    key: K,
    value: SchemaValue<K>,
): void {
    if (typeof window === "undefined") return;
    try {
        if (typeof schema[key] === "boolean") {
            localStorage.setItem(
                PREFIX + key,
                (value as boolean) ? "true" : "false",
            );
        } else {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        }
    } catch {
        /* ignore */
    }
}

/** Removes every key the app wrote (PREFIX-prefixed). No-op during SSR. */
export function clearAll(): void {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
}
