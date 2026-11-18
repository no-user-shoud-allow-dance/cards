// settingsReady.svelte.ts — layout-owned settings readiness via context.
// The root layout is the single initializer of the settings store: it
// calls settingsStore.init() and flips `ready` once the persisted record
// has been applied. Descendants that read settings depend on that instead
// of racing their own init against the layout's (the privacy toast used
// to show from default values before the settings had loaded).
//
// setContext must run during the layout's component init; descendants
// reach the same reactive object through useSettingsReady().
import { getContext, setContext } from "svelte";

export interface SettingsReady {
    /** Persisted settings have been applied in the browser. */
    ready: boolean;
    /**
     * The page area already shows server-rendered content that must not
     * be swapped for a spinner. True on the server (there is nothing to
     * wait for) and in the browser when SvelteKit hydrates a rendered
     * document; false on a client-only start, which stays behind the
     * loaded-settings gate.
     */
    content: boolean;
}

const KEY = "nsc:settings-ready";

function initialContent(): boolean {
    if (typeof window === "undefined") return true;
    // A non-empty <main> means this load hydrates server-rendered
    // markup: keep it on screen while the settings load.
    return document.querySelector("main")?.firstElementChild !== null;
}

/** Called once by the root layout during component initialization. */
export function provideSettingsReady(): SettingsReady {
    const state = $state({ ready: false, content: initialContent() });
    setContext(KEY, state);
    return state;
}

/**
 * Read by descendants inside the layout tree. Null outside it (tests,
 * stories) — callers must handle that and stay passive until the value
 * arrives.
 */
export function useSettingsReady(): SettingsReady | null {
    return getContext<SettingsReady>(KEY) ?? null;
}
