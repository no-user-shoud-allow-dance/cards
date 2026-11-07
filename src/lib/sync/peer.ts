import Peer from "peerjs";
import type { DataConnection } from "peerjs";

import { applySyncPayload, buildSyncPayload } from "./payload";
import { syncStore } from "./store/syncStore.svelte";

/** Peer ID scheme: "nsc-<account-uuid>-<random device suffix>". */
const PEER_PREFIX = "nsc-";

/** Prefix of the tiny QR/paste payload that carries a host's peer ID. */
export const PEER_LINK_PREFIX = "nsc-peer:";

const deviceSuffix = (): string => Math.random().toString(36).slice(2, 6);

/** Maps a PeerJS error type to a German UI message. */
function peerErrorMessage(type: string): string {
    switch (type) {
        case "peer-unavailable":
            return "Das andere Gerät ist nicht erreichbar — läuft dort der Host-Modus?";
        case "network":
        case "server-error":
        case "socket-error":
        case "socket-closed":
            return "Verbindung zum Signalisierungs-Server fehlgeschlagen — bitte Netzwerk prüfen.";
        case "unavailable-id":
            return "Diese Peer-ID ist bereits vergeben — bitte erneut versuchen.";
        default:
            return "Verbindung fehlgeschlagen.";
    }
}

function handlePeerError(err: { type?: string }): void {
    syncStore.status = "error";
    syncStore.error = peerErrorMessage(err.type ?? "unknown");
}

/** Accepts and answers a data connection, but only from the same account UUID. */
function wireConnection(conn: DataConnection): void {
    conn.on("open", () => {
        syncStore.status = "connected";
        syncStore.error = null;
    });
    conn.on("data", (data) => {
        const meta = conn.metadata as { uuid?: string } | undefined;
        if (meta?.uuid !== syncStore.profile.uuid) {
            // Foreign account (e.g. pre-rotation UUID): reject and close.
            conn.close();
            return;
        }
        void (async () => {
            try {
                await applySyncPayload(data as string);
                // Answer with our own payload → two-way sync.
                conn.send(await buildSyncPayload());
            } catch {
                // Malformed/foreign payload — ignore silently, keep channel.
            }
        })();
    });
    conn.on("error", () => handlePeerError({ type: "network" }));
}

/**
 * Host: listen for the other device of the same account. The peer ID
 * (`nsc-<uuid>-<suffix>`) is shown as text and QR for the other device.
 */
export function hostSync(): void {
    syncStore.destroyPeer();
    const peer = new Peer(
        `${PEER_PREFIX}${syncStore.profile.uuid}-${deviceSuffix()}`,
    );
    syncStore.peer = peer;
    syncStore.status = "connecting";
    syncStore.error = null;

    peer.on("open", (id) => {
        syncStore.peerId = id;
        syncStore.status = "hosting";
    });

    peer.on("connection", wireConnection);
    peer.on("error", handlePeerError);
}

/**
 * Join: connect to a host's peer ID (pasted or scanned from its QR).
 * The account UUID travels as connection metadata; the host only
 * accepts data from a matching UUID.
 */
export function joinSync(hostPeerId: string): void {
    const target = hostPeerId.trim().replace(PEER_LINK_PREFIX, "");
    if (!target.startsWith(PEER_PREFIX)) {
        syncStore.status = "error";
        syncStore.error = "Ungültige Peer-ID — sie beginnt mit „nsc-“.";
        return;
    }

    syncStore.destroyPeer();
    const peer = new Peer();
    syncStore.peer = peer;
    syncStore.status = "connecting";
    syncStore.error = null;

    peer.on("open", () => {
        const conn = peer.connect(target, {
            reliable: true,
            metadata: { uuid: syncStore.profile.uuid },
        });
        conn.on("open", async () => {
            syncStore.status = "connected";
            syncStore.error = null;
            try {
                conn.send(await buildSyncPayload()); // send ours first
            } catch {
                // send failure — the host's answer may still arrive
            }
        });
        conn.on("data", (data) => {
            void applySyncPayload(data as string).catch(() => {
                // malformed/foreign payload — ignore
            });
        });
        conn.on("error", () => handlePeerError({ type: "network" }));
    });

    peer.on("error", handlePeerError);
}
