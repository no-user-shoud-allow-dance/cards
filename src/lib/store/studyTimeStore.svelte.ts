// Total active learning time per deck, persisted across sessions.

class StudyTimeStore {
  times = $state<Record<string, number>>({});
  #loaded = false;

  init(): void {
    if (typeof window === 'undefined' || this.#loaded) return;
    this.#loaded = true;
    try {
      const raw = localStorage.getItem('kk_study_time');
      if (raw) this.times = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }

  get(slug: string): number {
    return this.times[slug] ?? 0;
  }

  add(slug: string, ms: number): void {
    if (ms <= 0) return;
    this.times = { ...this.times, [slug]: (this.times[slug] ?? 0) + ms };
    this.#persist();
  }

  reset(slug: string): void {
    const next = { ...this.times };
    delete next[slug];
    this.times = next;
    this.#persist();
  }

  #persist(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kk_study_time', JSON.stringify(this.times));
  }
}

export const studyTimeStore = new StudyTimeStore();
