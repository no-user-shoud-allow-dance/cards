/**
 * Share-link size limits and the native share sheet. The link protocol
 * itself — path links `/c/…`, `/p/…`, `/t/…`, `/s/…` and encrypted
 * server links `/k/{id}.{key}` — lives in core/share/links.ts.
 */

/**
 * Approximate URL length above which a QR code can no longer hold the
 * link: byte-mode capacity at error-correction level M is ~2331 bytes
 * (version 40), plus the origin and path prefix. Above this the QR
 * rendering fails with "code length overflow" — warn beforehand.
 */
export const SHARE_QR_LIMIT = 2_200;

/**
 * Below this link length (half of the max QR capacity) a deck is "too
 * small" for a server link: the QR code holds it comfortably, so the
 * server-link option is disabled on the export page. Above it the user
 * may freely choose between QR and server link.
 */
export const SERVER_LINK_MIN_LENGTH = SHARE_QR_LIMIT / 2;

/** Whether the Web Share API (native share sheet) is available. */
export function canNativeShare(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Opens the native share sheet (Android/iOS). Resolves true when the
 * sheet was shown — a user dismissal (AbortError) counts as shown — and
 * false when sharing is unsupported or failed.
 */
export async function nativeShare(data: {
    title: string;
    url?: string;
    text?: string;
}): Promise<boolean> {
    if (!canNativeShare()) return false;
    try {
        await navigator.share(data);
        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return true;
        }
        return false;
    }
}
