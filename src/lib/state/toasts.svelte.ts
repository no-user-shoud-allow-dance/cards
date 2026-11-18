import { errorMessage } from "#messages/locale.svelte";
import type { ErrorCode } from "#lib/core/errors";

export type { ErrorCode };

/**
 * Transient messages (success/error). Not persisted; lives only for the
 * session. Text comes from messages/languages/de.ts — never hard-coded German.
 */

export type ToastKind = "info" | "success" | "warning" | "error";

export interface Toast {
    id: number;
    text: string;
    kind: ToastKind;
    /** Auto-dismiss after this many ms; 0 = sticky. */
    durationMs: number;
    /** Optional bold title above the text. */
    title?: string;
    /** Label for an optional action button. */
    actionLabel?: string;
    /** Called when the action button is clicked. */
    onAction?: () => void;
    /** Called when the toast is dismissed (X button or auto-dismiss). */
    onDismiss?: () => void;
}

export interface ToastOptions {
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss?: () => void;
}

const DEFAULT_DURATION_MS = 4000;

class ToastStore {
    list = $state<Toast[]>([]);
    #nextId = 1;

    /** Shows a toast; auto-dismisses after durationMs (0 = sticky). */
    show(
        text: string,
        kind: ToastKind = "info",
        durationMs: number = DEFAULT_DURATION_MS,
        options?: ToastOptions
    ): number {
        const id = this.#nextId++;
        this.list = [...this.list, { id, text, kind, durationMs, ...options }];
        if (durationMs > 0 && typeof window !== "undefined") {
            setTimeout(() => this.dismiss(id), durationMs);
        }
        return id;
    }

    /** Convenience: success toast (auto-dismiss 3 s). */
    success(text: string, durationMs = 3000): number {
        return this.show(text, "success", durationMs);
    }

    /** Convenience: warning toast (auto-dismiss 5 s). */
    warning(text: string, durationMs = 5000): number {
        return this.show(text, "warning", durationMs);
    }

    /** Convenience: error toast (sticky by default). */
    error(text: string, durationMs = 0): number {
        return this.show(text, "error", durationMs);
    }

    /** Convenience: renders an error code through messages/languages/de.ts. */
    errorCode(code: ErrorCode): void {
        this.error(errorMessage(code));
    }

    dismiss(id: number): void {
        const toast = this.list.find((t) => t.id === id);
        this.list = this.list.filter((t) => t.id !== id);
        toast?.onDismiss?.();
    }

    clear(): void {
        this.list = [];
    }
}

export const toastStore = new ToastStore();
