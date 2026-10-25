import { BOX_COUNT } from '../utils/types';
import type { CardState, CardStates } from '../utils/types';

class CardStore {
  states = $state<CardStates>({});
  pureMode = $state(false);
  overviewDone = $state<Record<string, boolean>>({});
  /** Per-deck milestone: every card has reached box 2 (celebrated once). */
  box2Done = $state<Record<string, boolean>>({});
  #loaded = false;

  init(): void {
    if (typeof window === 'undefined' || this.#loaded) return;
    this.#loaded = true;
    try {
      const rawStates = localStorage.getItem('kk_states');
      if (rawStates) this.states = JSON.parse(rawStates);

      const rawPure = localStorage.getItem('kk_pure');
      if (rawPure) this.pureMode = rawPure === 'true';

      const rawOverview = localStorage.getItem('kk_overview_done');
      if (rawOverview) this.overviewDone = JSON.parse(rawOverview);

      const rawBox2 = localStorage.getItem('kk_box2_done');
      if (rawBox2) this.box2Done = JSON.parse(rawBox2);
    } catch {
      /* ignore */
    }
  }

  boxOf(cardId: string): number {
    return this.states[cardId]?.box ?? 1;
  }

  isOverviewDone(slug: string): boolean {
    return this.overviewDone[slug] ?? false;
  }

  markOverviewDone(slug: string): void {
    this.overviewDone = { ...this.overviewDone, [slug]: true };
    this.#persist();
  }

  resetOverview(slug: string): void {
    const next = { ...this.overviewDone };
    delete next[slug];
    this.overviewDone = next;
    this.#persist();
  }

  isBox2Done(slug: string): boolean {
    return this.box2Done[slug] ?? false;
  }

  markBox2Done(slug: string): void {
    this.box2Done = { ...this.box2Done, [slug]: true };
    this.#persist();
  }

  // Re-arm the box-2 milestone so a progress reset can celebrate again.
  resetBox2Done(slug: string): void {
    const next = { ...this.box2Done };
    delete next[slug];
    this.box2Done = next;
    this.#persist();
  }

  answer(cardId: string, correct: boolean): void {
    const prev = this.states[cardId];
    const prevBox = prev?.box ?? 1;
    this.states = {
      ...this.states,
      [cardId]: {
        box: correct ? Math.min(BOX_COUNT, prevBox + 1) : 1,
        lastSeen: Date.now()
      }
    };
    this.#persist();
  }

  restore(cardId: string, prev: CardState | null): void {
    const next = { ...this.states };
    if (prev) next[cardId] = prev;
    else delete next[cardId];
    this.states = next;
    this.#persist();
  }

  resetCards(cardIds: string[], slug?: string): void {
    const next = { ...this.states };
    for (const id of cardIds) delete next[id];
    this.states = next;
    if (slug) {
      const nextOverview = { ...this.overviewDone };
      delete nextOverview[slug];
      this.overviewDone = nextOverview;
    }
    this.#persist();
  }

  setPureMode(on: boolean): void {
    this.pureMode = on;
    this.#persist();
  }

  #persist(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kk_states', JSON.stringify(this.states));
    localStorage.setItem('kk_pure', this.pureMode ? 'true' : 'false');
    localStorage.setItem('kk_overview_done', JSON.stringify(this.overviewDone));
    localStorage.setItem('kk_box2_done', JSON.stringify(this.box2Done));
  }
}

export const cardStore = new CardStore();
