/** Persisted countdown timer state for a deck (localStorage). */
export interface PersistedTimerState {
    durationMs: number | null;
    remainingMs: number | null;
    finishedAt: number | null;
    okReadyAt: number | null;
}
