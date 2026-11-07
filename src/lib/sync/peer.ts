import Peer from "peerjs";
import type { DataConnection } from "peerjs";

import { applySyncPayload, buildSyncPayload } from "./payload";
import { syncStore } from "./store/syncStore.svelte";
import { toastStore } from "../stores/session/toastStore.svelte";

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
    console.error("[sync] peer error:", err.type ?? "unknown");
    syncStore.status = "error";
    syncStore.error = peerErrorMessage(err.type ?? "unknown");
}

/** German success toast + log after a payload was merged. */
function reportSyncSuccess(result: {
    decksAdded: number;
    progressApplied: number;
}): void {
    console.log("[sync] applied payload:", result);
    const decks =
        result.decksAdded === 1
            ? "1 neuer Stapel"
            : `${result.decksAdded} neue Stapel`;
    const progress =
        result.progressApplied === 1
            ? "1 Fortschritts-Eintrag"
            : `${result.progressApplied} Fortschritts-Einträge`;
    toastStore.success(
        `Synchronisation erfolgreich — ${decks}, ${progress} übernommen.`,
    );
}

/** Accepts and answers a data connection, but only from the same account UUID. */
function wireConnection(conn: DataConnection): void {
    conn.on("open", () => {
        console.log("[sync] connection open, peer:", conn.peer);
        syncStore.status = "connected";
        syncStore.error = null;
    });
    conn.on("data", (data) => {
        const meta = conn.metadata as { uuid?: string } | undefined;
        if (meta?.uuid !== syncStore.profile.uuid) {
            // Foreign account (e.g. pre-rotation UUID): reject and close.
            console.warn("[sync] rejected payload from foreign account UUID");
            conn.close();
            return;
        }
        void (async () => {
            try {
                console.log("[sync] received payload, applying …");
                const result = await applySyncPayload(data as string);
                reportSyncSuccess(result);
                // Answer with our own payload → two-way sync.
                conn.send(await buildSyncPayload());
                console.log("[sync] sent own payload back");
            } catch (err) {
                console.error("[sync] could not apply payload:", err);
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
        console.log("[sync] hosting as", id);
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
        console.log("[sync] joining", target);
        const conn = peer.connect(target, {
            reliable: true,
            metadata: { uuid: syncStore.profile.uuid },
        });
        conn.on("open", async () => {
            console.log("[sync] connection open, peer:", conn.peer);
            syncStore.status = "connected";
            syncStore.error = null;
            try {
                conn.send(await buildSyncPayload()); // send ours first
                console.log("[sync] sent own payload");
            } catch {
                // send failure — the host's answer may still arrive
                console.error("[sync] could not send own payload");
            }
        });
        conn.on("data", (data) => {
            void applySyncPayload(data as string)
                .then((result) => reportSyncSuccess(result))
                .catch((err) => {
                    console.error("[sync] could not apply payload:", err);
                });
        });
        conn.on("error", () => handlePeerError({ type: "network" }));
    });

    peer.on("error", handlePeerError);
}
