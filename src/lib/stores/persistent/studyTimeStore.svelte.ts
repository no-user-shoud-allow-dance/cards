// Total active learning time per deck, persisted across sessions.

import { read, write } from "../../storages/localStorage";
import { BaseStore } from "./baseStore";

class StudyTimeStore extends BaseStore {
    times = $state<Record<string, number>>({});

    protected hydrate(): void {
        const times = read("study_time");
        if (times) this.times = times;
    }

    get(slug: string): number {
        return this.times[slug] ?? 0;
    }

    add(slug: string, ms: number): void {
        if (ms <= 0) return;
        this.times = { ...this.times, [slug]: (this.times[slug] ?? 0) + ms };
        this.persist();
    }

    /** Sets the total study time absolutely (used when syncing progress). */
    set(slug: string, ms: number): void {
        if (ms <= 0) return;
        this.times = { ...this.times, [slug]: ms };
        this.persist();
    }

    reset(slug: string): void {
        const next = { ...this.times };
        delete next[slug];
        this.times = next;
        this.persist();
    }

    protected persist(): void {
        write("study_time", this.times);
    }
}

export const studyTimeStore = new StudyTimeStore();
