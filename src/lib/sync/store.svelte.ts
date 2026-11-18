import type Peer from "peerjs";
import { getLocale } from "#messages/locale.svelte";

/** Connection state of the PeerJS device-to-device sync. */
export type SyncStatus = "idle" | "hosting" | "connecting" | "connected" | "error";

/**
 * Sync UI state (hosting/joining/connected/error + log). Nothing here is
 * persisted — the host's peer ID is per-session and is the only sync
 * identity. The Peer instance itself is deliberately NOT $state — PeerJS
 * manages its own events and internal state.
 */
class SyncStore {
    /** Our peer ID while hosting (e.g. "nsc-x7…"); null otherwise. */
    peerId = $state<string | null>(null);

    status = $state<SyncStatus>("idle");

    /** German error message of the last failed connection, if any. */
    error = $state<string | null>(null);

    /** The live PeerJS instance; not reactive on purpose. */
    peer: Peer | null = null;

    /** Ring buffer of the last sync log lines (also written to the console). */
    logs = $state<string[]>([]);

    addLog(line: string): void {
        const time = new Date().toLocaleTimeString(getLocale() === "de" ? "de-DE" : "en-GB");
        this.logs = [...this.logs.slice(-199), `${time} ${line}`];
    }

    /** Tears down the peer connection and resets the sync state. */
    destroyPeer(): void {
        this.peer?.destroy();
        this.peer = null;
        this.peerId = null;
        this.status = "idle";
        this.error = null;
        this.logs = [];
    }
}

export const syncStore = new SyncStore();
