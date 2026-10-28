import { BOX_COUNT } from "../../types";
import type { CardState, CardStates } from "../../types";
import { read, write } from "../../storages/localStorage";
import { BaseStore } from "./baseStore";

class CardStore extends BaseStore {
    states = $state<CardStates>({});
    overviewDone = $state<Record<string, boolean>>({});

    protected hydrate(): void {
        const states = read("states");
        if (states) this.states = states;
        const overview = read("overview_done");
        if (overview) this.overviewDone = overview;
    }

    boxOf(cardId: string): number {
        return this.states[cardId]?.box ?? 1;
    }

    isOverviewDone(slug: string): boolean {
        return this.overviewDone[slug] ?? false;
    }

    markOverviewDone(slug: string): void {
        this.overviewDone = { ...this.overviewDone, [slug]: true };
        this.persist();
    }

    resetOverview(slug: string): void {
        const next = { ...this.overviewDone };
        delete next[slug];
        this.overviewDone = next;
        this.persist();
    }

    answer(cardId: string, correct: boolean): void {
        const prev = this.states[cardId];
        const prevBox = prev?.box ?? 1;
        this.states = {
            ...this.states,
            [cardId]: {
                box: correct ? Math.min(BOX_COUNT, prevBox + 1) : 1,
                lastSeen: Date.now(),
            },
        };
        this.persist();
    }

    restore(cardId: string, prev: CardState | null): void {
        const next = { ...this.states };
        if (prev) next[cardId] = prev;
        else delete next[cardId];
        this.states = next;
        this.persist();
    }

    /**
     * Merges synced progress into the local states. Per card the higher
     * box wins, so syncing never regresses a card. A synced box of 1 on a
     * card without local state is skipped: box 1 is the default, and
     * writing it would fake "has progress" for the deck.
     */
    mergeProgress(synced: CardStates): void {
        let changed = false;
        const next = { ...this.states };
        for (const [cardId, incoming] of Object.entries(synced)) {
            const prev = next[cardId];
            const box = Math.max(prev?.box ?? 1, incoming.box);
            if (!prev && box <= 1) continue;
            next[cardId] = {
                box,
                lastSeen: Math.max(prev?.lastSeen ?? 0, incoming.lastSeen),
            };
            changed = true;
        }
        if (!changed) return;
        this.states = next;
        this.persist();
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
        this.persist();
    }

    protected persist(): void {
        write("states", this.states);
        write("overview_done", this.overviewDone);
    }
}

export const cardStore = new CardStore();
