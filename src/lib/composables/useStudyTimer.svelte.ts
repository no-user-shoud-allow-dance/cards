import { onMount } from "svelte";
import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
import { timerStateStore } from "#lib/stores/persistent/timerStateStore.svelte";

export const TIMER_PRESETS = [
    { label: "10 Sekunden", ms: 10_000 },
    { label: "5 Minuten", ms: 5 * 60_000 },
    { label: "10 Minuten", ms: 10 * 60_000 },
    { label: "15 Minuten", ms: 15 * 60_000 },
    { label: "30 Minuten", ms: 30 * 60_000 },
    { label: "1 Stunde", ms: 60 * 60_000 },
] as const;

// The timer only runs while the user is active; after this much time
// without a learning action it pauses and waits for new activity.
const INACTIVITY_LIMIT_MS = 60_000;

// After the countdown finishes, the OK button stays disabled for a
// fraction of the timer's duration.
const OK_COOLDOWN_RATIO = 1 / 6;

const TICK_MS = 250;
const FLUSH_EVERY_MS = 2_000;

// After the window regains focus, wait this long before resuming.
const RESUME_DELAY_MS = 300;

// The override prompt on the break dialog's OK button expires after
// this long without interaction.
const OVERRIDE_WINDOW_MS = 5_000;

interface CramSessionLike {
    toggleFlip: () => void;
    answer: (correct: boolean) => void;
    openHelpSearch: () => void;
    openMnemonicSearch: () => void;
    handleKeydown: (event: KeyboardEvent) => void;
    readonly finished: boolean;
}

// Mirrors the action keys handled by the cram session keyboard controls,
// so keyboard-driven flips/answers/help/mnemonics also count as activity.
function isActionKey(event: KeyboardEvent): boolean {
    const target = event.target;
    if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
    ) {
        return false;
    }

    if (event.code === "Space") {
        if (target instanceof HTMLElement && target.closest("button, a")) {
            return false;
        }
        return true;
    }

    return ["w", "r", "h", "m"].includes(event.key.toLowerCase());
}

export function useStudyTimer(getSlug: () => string) {
    studyTimeStore.init();
    timerStateStore.init();

    // Reactive deck slug: the page component can be reused for another
    // deck, so the slug is read lazily.
    const slug = $derived(getSlug());

    // Wall clock, advanced by the tick interval; 0 until mounted so
    // server and first client render agree.
    let now = $state(0);

    // Current active stretch: [activeSince, activeUntil]. Opening the
    // page counts as activity; each learning action extends the stretch.
    let activeSince = $state(0);
    let activeUntil = $state(0);

    let durationMs = $state<number | null>(null);
    let remainingMs = $state<number | null>(null);
    let finishedAt = $state<number | null>(null);
    let okReadyAt = $state<number | null>(null);
    let overrideOffered = $state(false);

    // Active learning time of this page visit not yet persisted.
    let pendingMs = $state(0);

    let menuOpen = $state(false);

    // Timing also pauses while the window is unfocused or the timer
    // settings menu is open. `pausedAt` is the start of the ongoing
    // pause; completed pauses are kept in `blockedIntervals` until the
    // tick has processed them.
    let windowBlurred = $state(
        typeof document !== "undefined" && !document.hasFocus(),
    );
    let pausedAt = $state<number | null>(null);
    const blockedIntervals: Array<[number, number]> = [];

    let lastTickAt = 0;
    let observed: CramSessionLike | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;
    let overrideTimeout: ReturnType<typeof setTimeout> | null = null;

    const running = $derived(
        durationMs !== null && remainingMs !== null && finishedAt === null,
    );

    const active = $derived(now > 0 && now <= activeUntil);

    const paused = $derived(running && (!active || pausedAt !== null));

    // True once the cram session is complete (success screen). The read
    // goes through a function because `observed` is assigned later, in
    // observe().
    function readSessionFinished(): boolean {
        return observed?.finished ?? false;
    }

    const sessionFinished = $derived(readSessionFinished());

    // The interface blurs whenever timing is paused — break dialog open,
    // window unfocused or settings menu open, or the inactivity limit
    // hit — regardless of whether a countdown is set. The success screen
    // is exempt: the timer is stopped there, but it stays readable.
    const interfaceBlurred = $derived(
        finishedAt !== null ||
            (!sessionFinished && (pausedAt !== null || (now > 0 && !active))),
    );

    const okEnabled = $derived(okReadyAt !== null && now >= okReadyAt);

    const okRemainingMs = $derived(
        okReadyAt !== null ? Math.max(0, okReadyAt - now) : 0,
    );

    // Cooldown progress 0..1: 0 when the timer just finished, 1 when
    // the OK button becomes available. Used by the break dialog's red
    // timer arc.
    const okProgress = $derived.by(() => {
        if (finishedAt === null || okReadyAt === null) return 0;
        const total = okReadyAt - finishedAt;
        if (total <= 0) return 1;
        return Math.min(1, Math.max(0, 1 - okRemainingMs / total));
    });

    // Total learning time for this deck: persisted past sessions plus
    // the still-unflushed active time of the current visit.
    const totalMs = $derived(studyTimeStore.get(slug) + pendingMs);

    function notifyActivity(): void {
        const t = Date.now();
        if (t > activeUntil) activeSince = t;
        activeUntil = t + INACTIVITY_LIMIT_MS;
    }

    // Pause/resume timing when the window focus or the settings menu
    // changes. Pause stretches are recorded so the tick can exclude them.
    // A finished session keeps the timer stopped for good.
    function updatePause(): void {
        const t = Date.now();
        const shouldPause = sessionFinished || windowBlurred || menuOpen;
        if (shouldPause && pausedAt === null) {
            pausedAt = t;
        } else if (!shouldPause && pausedAt !== null) {
            blockedIntervals.push([pausedAt, t]);
            pausedAt = null;
        }
    }

    function setMenuOpen(value: boolean): void {
        menuOpen = value;
        updatePause();
    }

    function setWindowBlurred(value: boolean): void {
        windowBlurred = value;
        updatePause();
    }

    function flush(): void {
        if (pendingMs <= 0) return;
        studyTimeStore.add(slug, pendingMs);
        pendingMs = 0;
    }

    // Persist the countdown so it survives leaving and re-entering
    // the learn mode.
    function saveState(): void {
        timerStateStore.save(slug, {
            durationMs,
            remainingMs,
            finishedAt,
            okReadyAt,
        });
    }

    function tick(): void {
        const t = Date.now();

        // Session complete: stop the timer. The pause starts here and
        // updatePause keeps it (menu/focus events won't lift it).
        if (sessionFinished && pausedAt === null) pausedAt = t;

        // Countable time in this tick window: the part inside the current
        // active stretch, minus paused stretches (window unfocused or the
        // settings menu open) that fall inside that stretch.
        let counted = Math.max(
            0,
            Math.min(t, activeUntil) - Math.max(lastTickAt, activeSince),
        );
        for (const [pausedStart, pausedEnd] of blockedIntervals) {
            counted -= Math.max(
                0,
                Math.min(t, activeUntil, pausedEnd) -
                    Math.max(lastTickAt, activeSince, pausedStart),
            );
        }
        if (pausedAt !== null) {
            counted -= Math.max(
                0,
                Math.min(t, activeUntil) -
                    Math.max(lastTickAt, activeSince, pausedAt),
            );
        }
        counted = Math.max(0, counted);

        // Drop pause intervals this window has fully processed.
        while (blockedIntervals.length > 0 && blockedIntervals[0][1] <= t) {
            blockedIntervals.shift();
        }

        lastTickAt = t;
        now = t;

        if (counted > 0) {
            pendingMs += counted;

            if (running) {
                remainingMs = Math.max(0, (remainingMs ?? 0) - counted);
                if (remainingMs === 0) {
                    finishedAt = t;
                    okReadyAt = t + (durationMs ?? 0) * OK_COOLDOWN_RATIO;
                    saveState();
                }
            }

            if (pendingMs >= FLUSH_EVERY_MS) {
                flush();
                saveState();
            }
        }

        // Once the session is complete, keep the stored total exact.
        if (sessionFinished) flush();
    }

    function setPreset(ms: number): void {
        durationMs = ms;
        remainingMs = ms;
        finishedAt = null;
        okReadyAt = null;
        resetOverride();
        notifyActivity();
        setMenuOpen(false);
        saveState();
    }

    function stop(): void {
        durationMs = null;
        remainingMs = null;
        finishedAt = null;
        okReadyAt = null;
        resetOverride();
        setMenuOpen(false);
        saveState();
    }

    // Double click on the disabled OK button: offer the override for a
    // limited window. Accepting it skips the remaining cooldown.
    function offerOverride(): void {
        if (finishedAt === null || okEnabled) return;
        overrideOffered = true;
        if (overrideTimeout !== null) clearTimeout(overrideTimeout);
        overrideTimeout = setTimeout(() => {
            overrideTimeout = null;
            overrideOffered = false;
        }, OVERRIDE_WINDOW_MS);
    }

    function resetOverride(): void {
        overrideOffered = false;
        if (overrideTimeout !== null) {
            clearTimeout(overrideTimeout);
            overrideTimeout = null;
        }
    }

    // OK on the "time is up" dialog: restart the countdown with the
    // duration that just finished. With the override offered, the
    // remaining cooldown is skipped.
    function acknowledge(): void {
        if (finishedAt === null) return;
        if (!okEnabled && !overrideOffered) return;
        finishedAt = null;
        okReadyAt = null;
        resetOverride();
        if (durationMs !== null) remainingMs = durationMs;
        notifyActivity();
        saveState();
    }

    // Wrap the session's learning actions (flip, answer, help, mnemonic)
    // so every one of them — mouse or keyboard — resets the inactivity
    // pause.
    function observe(session: CramSessionLike): void {
        observed = session;

        const wrap =
            <A extends unknown[], R>(fn: (...args: A) => R) =>
            (...args: A): R => {
                notifyActivity();
                return fn(...args);
            };

        session.toggleFlip = wrap(session.toggleFlip);
        session.answer = wrap(session.answer);
        session.openHelpSearch = wrap(session.openHelpSearch);
        session.openMnemonicSearch = wrap(session.openMnemonicSearch);

        const keydown = session.handleKeydown;
        session.handleKeydown = (event: KeyboardEvent): void => {
            if (isActionKey(event)) notifyActivity();
            keydown(event);
        };
    }

    function onPageHide(): void {
        flush();
        saveState();
    }

    onMount(() => {
        const t = Date.now();
        now = t;
        lastTickAt = t;

        // Restore the countdown persisted from a previous visit.
        const persisted = timerStateStore.load(slug);
        if (persisted) {
            durationMs = persisted.durationMs;
            remainingMs = persisted.remainingMs;
            finishedAt = persisted.finishedAt;
            okReadyAt = persisted.okReadyAt;
        }

        notifyActivity();
        updatePause();
        const interval = setInterval(tick, TICK_MS);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("blur", onWindowBlur);
        window.addEventListener("focus", onWindowFocus);

        return () => {
            clearInterval(interval);
            if (resumeTimeout !== null) clearTimeout(resumeTimeout);
            resetOverride();
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("blur", onWindowBlur);
            window.removeEventListener("focus", onWindowFocus);
            flush();
            saveState();
        };
    });

    function onWindowBlur(): void {
        // Cancel a pending resume; the pause simply continues.
        if (resumeTimeout !== null) {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
        }
        setWindowBlurred(true);
    }

    function onWindowFocus(): void {
        // Resume only after a short delay once the window regains focus.
        if (resumeTimeout !== null) return;
        resumeTimeout = setTimeout(() => {
            resumeTimeout = null;
            setWindowBlurred(false);
        }, RESUME_DELAY_MS);
    }

    return {
        get now() {
            return now;
        },
        get durationMs() {
            return durationMs;
        },
        get remainingMs() {
            return remainingMs;
        },
        get running() {
            return running;
        },
        get active() {
            return active;
        },
        get paused() {
            return paused;
        },
        get interfaceBlurred() {
            return interfaceBlurred;
        },
        get finishedAt() {
            return finishedAt;
        },
        get okEnabled() {
            return okEnabled;
        },
        get okRemainingMs() {
            return okRemainingMs;
        },
        get okProgress() {
            return okProgress;
        },
        get overrideOffered() {
            return overrideOffered;
        },
        get menuOpen() {
            return menuOpen;
        },
        set menuOpen(value: boolean) {
            setMenuOpen(value);
        },
        get totalMs() {
            return totalMs;
        },
        observe,
        notifyActivity,
        setPreset,
        stop,
        acknowledge,
        offerOverride,
    };
}

export type StudyTimer = ReturnType<typeof useStudyTimer>;
