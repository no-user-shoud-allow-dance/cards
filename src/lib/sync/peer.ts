import Peer from "peerjs";
import type { DataConnection } from "peerjs";

import { applySyncPayload, buildSyncPayload } from "./payload";
import { syncStore } from "./store/syncStore.svelte";
import { toastStore } from "../stores/session/toastStore.svelte";

/**
 * Peer ID scheme: "nsc-<random>" — the peer ID itself is the shared
 * secret, exchanged via QR/paste. There is no account UUID: it would be
 * embedded in the peer ID anyway, so it could not add any secrecy
 * beyond the peer ID. Trust boundary: whoever holds the peer ID.
 */
const PEER_PREFIX = "nsc-";

/** Prefix of the tiny QR/paste payload that carries a host's peer ID. */
export const PEER_LINK_PREFIX = "nsc-peer:";

const deviceSuffix = (): string =>
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

/** Log helpers: console AND the sync card's log textarea (via syncStore). */
function fmtArgs(args: unknown[]): string {
    return args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ");
}

function syncLog(msg: string, ...args: unknown[]): void {
    console.log("[sync]", msg, ...args);
    syncStore.addLog(`[sync] ${msg}${args.length ? " " + fmtArgs(args) : ""}`);
}

function syncWarn(msg: string, ...args: unknown[]): void {
    console.warn("[sync]", msg, ...args);
    syncStore.addLog(`[sync] ${msg}${args.length ? " " + fmtArgs(args) : ""}`);
}

function syncError(msg: string, ...args: unknown[]): void {
    console.error("[sync]", msg, ...args);
    syncStore.addLog(`[sync] ${msg}${args.length ? " " + fmtArgs(args) : ""}`);
}

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
    syncError("peer error:", err.type ?? "unknown");
    syncStore.status = "error";
    syncStore.error = peerErrorMessage(err.type ?? "unknown");
}

/** German success toast + log after a payload was merged. */
function reportSyncSuccess(result: {
    decksAdded: number;
    progressApplied: number;
}): void {
    syncLog("applied payload:", result);
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

/**
 * Accepts and answers a data connection. The peer ID is the trust
 * anchor, so every connection to our (unguessable) host ID is accepted.
 */
function wireConnection(conn: DataConnection): void {
    conn.on("open", () => {
        syncLog("connection open, peer:", conn.peer);
        syncStore.status = "connected";
        syncStore.error = null;
    });
    conn.on("data", (data) => {
        void (async () => {
            try {
                syncLog("received payload, applying …");
                const result = await applySyncPayload(data as string);
                reportSyncSuccess(result);
                // Answer with our own payload → two-way sync.
                conn.send(await buildSyncPayload());
                syncLog("sent own payload back");
            } catch (err) {
                syncError("could not apply payload:", err);
            }
        })();
    });
    conn.on("close", () => {
        syncLog("connection closed — tschüss!");
        if (syncStore.status === "connected") {
            // Back to hosting (host side) or idle (joiner side).
            syncStore.status = syncStore.peerId ? "hosting" : "idle";
        }
    });
    conn.on("error", () => handlePeerError({ type: "network" }));
}

/**
 * Host: listen for the other device. The peer ID ("nsc-<random>") is
 * shown as text and QR for the other device.
 */
export function hostSync(): void {
    syncStore.destroyPeer();
    const peer = new Peer(`${PEER_PREFIX}${deviceSuffix()}`);
    syncStore.peer = peer;
    syncStore.status = "connecting";
    syncStore.error = null;

    peer.on("open", (id) => {
        syncLog("hosting as", id);
        syncStore.peerId = id;
        syncStore.status = "hosting";
    });

    peer.on("connection", wireConnection);
    peer.on("error", handlePeerError);
}

/**
 * Join: connect to a host's peer ID (pasted or scanned from its QR).
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
        syncLog("joining", target);
        const conn = peer.connect(target, { reliable: true });
        conn.on("open", async () => {
            syncLog("connection open, peer:", conn.peer);
            syncStore.status = "connected";
            syncStore.error = null;
            try {
                conn.send(await buildSyncPayload()); // send ours first
                syncLog("sent own payload");
            } catch {
                // send failure — the host's answer may still arrive
                syncError("could not send own payload");
            }
        });
        conn.on("data", (data) => {
            void applySyncPayload(data as string)
                .then((result) => reportSyncSuccess(result))
                .catch((err) => {
                    syncError("could not apply payload:", err);
                });
        });
        conn.on("close", () => {
            syncLog("connection closed — tschüss!");
            if (syncStore.status === "connected") syncStore.status = "idle";
        });
        conn.on("error", () => handlePeerError({ type: "network" }));
    });

    peer.on("error", handlePeerError);
}
