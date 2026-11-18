import Peer from "peerjs";
import type { DataConnection } from "peerjs";

import { errorMessage, SYNC } from "#messages/locale.svelte";
import { isNscError } from "#lib/core/errors";
import { makeDeckEntry } from "#lib/repositories/decksRepository";
import { deckStore } from "#lib/state/decks.svelte";
import { learningStore } from "#lib/state/learning.svelte";
import { toastStore } from "#lib/state/toasts.svelte";
import { decodeFullSync, encodeFullSync, type FullSyncItem } from "#lib/sync/protocol";
import { applyRemoteDecks, localHash } from "#lib/sync/merge";
import { syncStore } from "#lib/sync/store.svelte";

/**
 * PeerJS wiring only. No named rooms: the host's peer ID IS the room
 * identifier and the trust anchor. PeerId is built from
 * crypto.getRandomValues (12 base-36 chars after the "nsc-" prefix) —
 * whoever holds the ID is the trust anchor. The pairing payload (the
 * bare peer ID, base64url-encoded) travels via the `s` route.
 */
export type PeerId = string & { readonly __brand: "PeerId" };

export const PEER_PREFIX = "nsc-";

const PEER_ID_PATTERN = /^nsc-[a-z0-9]{12}$/;

/** The one checked constructor of PeerId. */
export function makePeerId(value: string): PeerId {
    if (!PEER_ID_PATTERN.test(value)) {
        throw new Error(`invalid peer id: ${value}`);
    }
    return value as PeerId;
}

/** Fresh host peer ID from crypto.getRandomValues (base-36, unpredictable). */
export function generatePeerId(): PeerId {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    let out = PEER_PREFIX;
    for (const b of bytes) out += (b % 36).toString(36);
    return makePeerId(out);
}

/** The one checked normalizer of PeerId input. */
export function normalizePeerId(input: string): PeerId {
    return makePeerId(input.trim());
}

function log(msg: string, ...args: unknown[]): void {
    const line = `[sync] ${msg}${args.length ? " " + args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") : ""}`;
    console.log(line);
    syncStore.addLog(line);
}

function peerErrorMessage(type: string | undefined): string {
    switch (type) {
        case "peer-unavailable":
            return SYNC.peerUnreachable;
        case "network":
        case "server-error":
        case "socket-error":
        case "socket-closed":
            return SYNC.signalingFailed;
        case "unavailable-id":
            return SYNC.idTaken;
        default:
            return SYNC.connectionFailed;
    }
}

function handlePeerError(err: { type?: string }): void {
    log("peer error:", err.type ?? "unknown");
    syncStore.status = "error";
    syncStore.error = peerErrorMessage(err.type);
}

async function localFullSync(): Promise<string> {
    await deckStore.init();
    await learningStore.init();
    // Wire items are keyed by content hash (peer matching); the local
    // state lookup is slug-keyed.
    const items: FullSyncItem[] = deckStore.entries.map((entry) => ({
        hash: localHash(entry),
        entry,
        state: learningStore.states[entry.slug as string] ?? null,
    }));
    return encodeFullSync(items);
}

async function applyRemotePayload(data: string): Promise<void> {
    const decoded = decodeFullSync(data); // throws NscError on bad payloads
    await deckStore.init();
    await learningStore.init();
    const local: FullSyncItem[] = deckStore.entries.map((entry) => {
        const hash = localHash(entry);
        return { hash, entry, state: learningStore.states[entry.slug as string] ?? null };
    });
    const result = applyRemoteDecks(local, decoded, (doc) => makeDeckEntry(doc));
    for (const item of result.items) {
        const existing = deckStore.entries.find((e) => localHash(e) === item.hash);
        if (!existing) await deckStore.put(item.entry);
        if (item.state) {
            const slug = (existing ?? item.entry).slug as string;
            await learningStore.mergeRemote(slug, item.state);
        }
    }
    await deckStore.refresh();
    log(SYNC.applied(result.added, result.merged));
    toastStore.success(result.added === 1 ? SYNC.doneOne : SYNC.doneMany(result.added));
}

function wireConnection(conn: DataConnection, _isHost: boolean): void {
    conn.on("data", (data) => {
        void applyRemotePayload(data as string).catch((e: unknown) => {
            log("apply failed:", isNscError(e) ? errorMessage(e.code) : String(e));
            syncStore.status = "error";
            syncStore.error = isNscError(e) ? errorMessage(e.code) : SYNC.packageInvalid;
        });
    });
    conn.on("open", () => {
        syncStore.status = "connected";
        // Each side sends exactly one message on open: the full-sync payload.
        void localFullSync().then((payload) => conn.send(payload));
    });
    conn.on("close", () => {
        log("connection closed");
    });
    conn.on("error", (err) => handlePeerError({ type: (err as { type?: string }).type }));
}

/** Opens the host side: the peer ID is the room; QR/paste carries it via the `s` route. */
export function hostSync(): void {
    syncStore.destroyPeer();
    const peerId = generatePeerId();
    const peer = new Peer(peerId);
    syncStore.peer = peer;
    syncStore.peerId = peerId;
    syncStore.status = "hosting";
    syncStore.error = null;
    log("hosting as", peerId);
    peer.on("connection", (conn) => {
        log("incoming connection");
        wireConnection(conn, true);
    });
    peer.on("error", handlePeerError);
}

/** Joins the host identified by the peer ID. */
export function joinSync(hostPeerId: string): void {
    syncStore.destroyPeer();
    let target: PeerId;
    try {
        target = normalizePeerId(hostPeerId);
    } catch {
        syncStore.status = "error";
        syncStore.error = SYNC.invalidPeerId;
        return;
    }
    const peer = new Peer();
    syncStore.peer = peer;
    syncStore.status = "connecting";
    syncStore.error = null;
    log("joining", target);
    peer.on("open", () => {
        const conn = peer.connect(target, { reliable: true });
        wireConnection(conn, false);
    });
    peer.on("error", handlePeerError);
}
