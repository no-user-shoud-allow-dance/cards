import type { Toast, ToastType } from "../../types";

const DEFAULT_DURATION_MS = 4000;

/**
 * Session-only toast notifications. Not persisted — toasts live and
 * die within a single page session.
 */
class ToastStore {
    toasts = $state<Toast[]>([]);

    /** Shows a toast; auto-dismisses after durationMs (0 = sticky). */
    show(
        message: string,
        type: ToastType = "info",
        durationMs: number = DEFAULT_DURATION_MS,
    ): void {
        const id = crypto.randomUUID();
        const toast: Toast = { id, message, type, durationMs };
        this.toasts = [...this.toasts, toast];
        if (durationMs > 0 && typeof window !== "undefined") {
            setTimeout(() => this.dismiss(id), durationMs);
        }
    }

    dismiss(id: string): void {
        this.toasts = this.toasts.filter((t) => t.id !== id);
    }

    clear(): void {
        this.toasts = [];
    }
}

export const toastStore = new ToastStore();
