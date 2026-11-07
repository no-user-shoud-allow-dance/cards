import type Peer from "peerjs";

import { read, write } from "../../storages/localStorage";

import { LocalStorageStore } from "../../stores/persistent/localStorageStore";

import type { Profile } from "../../types";

/** Connection state of the PeerJS device-to-device sync. */
export type SyncStatus =
    | "idle"
    | "hosting"
    | "connecting"
    | "connected"
    | "error";

/**
 * The local serverless profile ("account"): a rotatable account UUID —
 * persisted in localStorage, never sent anywhere. "Deleting the account"
 * means clearing the site data.
 *
 * Also holds the live PeerJS sync state (peer instance, peer ID, status).
 * The Peer instance itself is deliberately NOT $state — PeerJS manages
 * its own events and internal state.
 */
class SyncStore extends LocalStorageStore {
    profile = $state<Profile>({
        createdAt: 0,
        uuid: "",
    });

    /** Our peer ID while hosting (e.g. "nsc-<uuid>-ab12"); null otherwise. */
    peerId = $state<string | null>(null);

    status = $state<SyncStatus>("idle");

    /** German error message of the last failed connection, if any. */
    error = $state<string | null>(null);

    /** The live PeerJS instance; not reactive on purpose. */
    peer: Peer | null = null;

    protected hydrate(): void {
        const stored = read("profile");
        if (stored && typeof stored.uuid === "string" && stored.uuid) {
            this.profile = stored;
        } else {
            this.profile = {
                createdAt: Date.now(),
                uuid: crypto.randomUUID(),
            };
            this.persist();
        }
    }

    /**
     * Rotates the account UUID: new identity, new peer IDs. The peer is
     * destroyed and pairings with other devices have to be re-established.
     */
    rotateUuid(): void {
        this.destroyPeer();
        this.profile = { ...this.profile, uuid: crypto.randomUUID() };
        this.persist();
    }

    /** Tears down the peer connection and resets the sync state. */
    destroyPeer(): void {
        this.peer?.destroy();
        this.peer = null;
        this.peerId = null;
        this.status = "idle";
        this.error = null;
    }

    protected persist(): void {
        write("profile", this.profile);
    }
}

export const syncStore = new SyncStore();
