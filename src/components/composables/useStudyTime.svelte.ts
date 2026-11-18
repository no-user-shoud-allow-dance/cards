import { onMount } from "svelte";
import { decks } from "#components/model/decks.svelte";
import { isActionKey } from "#components/model/studyActions";

// Only active time counts as learning time; after this much time
// without a learning action the stretch ends and waits for new activity.
const INACTIVITY_LIMIT_MS = 60_000;

const TICK_MS = 250;
const FLUSH_EVERY_MS = 2_000;

// After the window regains focus, wait this long before resuming.
const RESUME_DELAY_MS = 300;

interface CramSessionLike {
    toggleFlip: () => void;
    answer: (correct: boolean) => void;
    openHelpSearch: () => void;
    openMnemonicSearch: () => void;
    handleKeydown: (event: KeyboardEvent) => void;
    readonly finished: boolean;
}

export function useStudyTime(getSlug: () => string) {
    // Reactive deck slug: the page component can be reused for another
    // deck, so the slug is read lazily.
    const slug = $derived(getSlug());

    // Current active stretch: [activeSince, activeUntil]. Opening the
    // page counts as activity; each learning action extends the stretch.
    let activeSince = $state(0);
    let activeUntil = $state(0);

    // Active learning time of this page visit not yet persisted.
    let pendingMs = $state(0);

    // Time pauses while the window is unfocused or the session is
    // finished. `pausedAt` is the start of the ongoing pause; completed
    // pauses are kept in `blockedIntervals` until the tick has processed
    // them.
    let windowBlurred = $state(typeof document !== "undefined" && !document.hasFocus());
    let pausedAt = $state<number | null>(null);
    const blockedIntervals: Array<[number, number]> = [];

    let lastTickAt = 0;
    let observed: CramSessionLike | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    // True once the cram session is complete (success screen). The read
    // goes through a function because `observed` is assigned later, in
    // observe().
    function readSessionFinished(): boolean {
        return observed?.finished ?? false;
    }

    const sessionFinished = $derived(readSessionFinished());

    function notifyActivity(): void {
        const t = Date.now();
        if (t > activeUntil) activeSince = t;
        activeUntil = t + INACTIVITY_LIMIT_MS;
    }

    // Pause/resume when the window focus changes. A finished session
    // keeps the pause for good — focus events won't lift it.
    function updatePause(): void {
        const t = Date.now();
        const shouldPause = sessionFinished || windowBlurred;
        if (shouldPause && pausedAt === null) {
            pausedAt = t;
        } else if (!shouldPause && pausedAt !== null) {
            blockedIntervals.push([pausedAt, t]);
            pausedAt = null;
        }
    }

    function setWindowBlurred(value: boolean): void {
        windowBlurred = value;
        updatePause();
    }

    function flush(): void {
        if (pendingMs <= 0) return;
        decks.addStudyTime(slug, pendingMs);
        pendingMs = 0;
    }

    function tick(): void {
        const t = Date.now();

        // Session complete: stop counting from here on. The pause starts
        // now and updatePause keeps it (focus events won't lift it).
        if (sessionFinished && pausedAt === null) pausedAt = t;

        // Countable time in this tick window: the part inside the current
        // active stretch, minus paused stretches (window unfocused or
        // session finished) that fall inside that stretch.
        let counted = Math.max(0, Math.min(t, activeUntil) - Math.max(lastTickAt, activeSince));
        for (const [pausedStart, pausedEnd] of blockedIntervals) {
            counted -= Math.max(
                0,
                Math.min(t, activeUntil, pausedEnd) - Math.max(lastTickAt, activeSince, pausedStart)
            );
        }
        if (pausedAt !== null) {
            counted -= Math.max(
                0,
                Math.min(t, activeUntil) - Math.max(lastTickAt, activeSince, pausedAt)
            );
        }
        counted = Math.max(0, counted);

        // Drop pause intervals this window has fully processed.
        while (blockedIntervals.length > 0 && blockedIntervals[0][1] <= t) {
            blockedIntervals.shift();
        }

        lastTickAt = t;

        if (counted > 0) {
            pendingMs += counted;
            if (pendingMs >= FLUSH_EVERY_MS) flush();
        }

        // Once the session is complete, keep the stored total exact.
        if (sessionFinished) flush();
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
    }

    onMount(() => {
        const t = Date.now();
        lastTickAt = t;

        notifyActivity();
        updatePause();
        const interval = setInterval(tick, TICK_MS);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("blur", onWindowBlur);
        window.addEventListener("focus", onWindowFocus);

        return () => {
            clearInterval(interval);
            if (resumeTimeout !== null) clearTimeout(resumeTimeout);
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("blur", onWindowBlur);
            window.removeEventListener("focus", onWindowFocus);
            flush();
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
        observe,
        notifyActivity,
    };
}

export type StudyTime = ReturnType<typeof useStudyTime>;
