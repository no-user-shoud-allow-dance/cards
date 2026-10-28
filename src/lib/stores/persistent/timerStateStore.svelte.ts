// Countdown timer state per deck, persisted so it survives leaving
// and re-entering the learn mode.

import type { PersistedTimerState } from "../../types";
import { read, write } from "../../storages/localStorage";
import { BaseStore } from "./baseStore";

class TimerStateStore extends BaseStore {
  states = $state<Record<string, PersistedTimerState>>({});

  protected hydrate(): void {
    const states = read('timer_state');
    if (states) this.states = states;
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
    this.persist();
  }

  reset(slug: string): void {
    const next = { ...this.states };
    delete next[slug];
    this.states = next;
    this.persist();
  }

  protected persist(): void {
    write('timer_state', this.states);
  }
}

export const timerStateStore = new TimerStateStore();
