// Countdown timer state per deck, persisted so it survives leaving
// and re-entering the learn mode.

export interface PersistedTimerState {
  durationMs: number | null;
  remainingMs: number | null;
  finishedAt: number | null;
  okReadyAt: number | null;
}

class TimerStateStore {
  states = $state<Record<string, PersistedTimerState>>({});
  #loaded = false;

  init(): void {
    if (typeof window === 'undefined' || this.#loaded) return;
    this.#loaded = true;
    try {
      const raw = localStorage.getItem('kk_timer_state');
      if (raw) this.states = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }

  load(slug: string): PersistedTimerState | null {
    return this.states[slug] ?? null;
  }

  has(slug: string): boolean {
    return this.states[slug] !== undefined;
  }

  save(slug: string, state: PersistedTimerState): void {
    const empty =
      state.durationMs === null &&
      state.remainingMs === null &&
      state.finishedAt === null &&
      state.okReadyAt === null;

    const next = { ...this.states };
    if (empty) delete next[slug];
    else next[slug] = state;
    this.states = next;
    this.#persist();
  }

  reset(slug: string): void {
    const next = { ...this.states };
    delete next[slug];
    this.states = next;
    this.#persist();
  }

  #persist(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kk_timer_state', JSON.stringify(this.states));
  }
}

export const timerStateStore = new TimerStateStore();
