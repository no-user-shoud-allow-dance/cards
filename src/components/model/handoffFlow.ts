import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { STORAGE, core } from "#lib";

/**
 * The (protocols) hand-off: every share/sync link resolves here, is
 * decoded and validated via core/share/links.ts, and the result is
 * written to the sessionStorage hand-off key from the central storage
 * map (`STORAGE.sessionStorage.importHandoff`; read once, then
 * cleared) before redirecting to the consuming flow. No consumer route
 * parses URLs or anchors — one input source.
 */

export interface ImportRecord {
    kind: "c" | "p" | "t" | "s" | "k";
    /** For c/p/t: the validated body object. For k: raw deck markdown. */
    body?: unknown;
    /** For s: the bare peer ID (the `nsc-` prefix is re-added on decode). */
    peerId?: string;
}

function stash(record: ImportRecord): void {
    sessionStorage.setItem(STORAGE.sessionStorage.importHandoff, JSON.stringify(record));
}

/** Decodes a c/p/t payload param and hands it to the import flow. */
export async function handOffPayload(letter: "c" | "p" | "t", payload: string): Promise<void> {
    const link = await core.parseLink(`/${letter}/${payload}`);
    if (link.kind !== letter) throw new Error(`expected ${letter} link`);
    stash({ kind: letter, body: link.body });
    await goto(resolve("/(io)/import"));
}

/** Decodes an s payload param and stashes the bare peer ID for pairing. */
export async function handOffPairing(payload: string): Promise<string> {
    const link = await core.parseLink(`/s/${payload}`);
    if (link.kind !== "s") throw new Error("expected s link");
    stash({ kind: "s", peerId: link.peerId });
    return link.peerId;
}

/** Stashes decrypted k server-link markdown as a c-kind import record. */
export function handOffMarkdown(markdown: string): void {
    stash({ kind: "k", body: { c: markdown } });
}

export async function goToImport(): Promise<void> {
    await goto(resolve("/(io)/import"));
}

export async function goToAccount(): Promise<void> {
    await goto(resolve("/account"));
}
