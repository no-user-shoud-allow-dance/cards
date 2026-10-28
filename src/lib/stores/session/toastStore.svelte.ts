import type { Toast, ToastType } from "../../types";

const DEFAULT_DURATION_MS = 4000;

interface ToastOptions {
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss?: () => void;
}

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
        options?: ToastOptions,
    ): string {
        const id = crypto.randomUUID();
        const toast: Toast = {
            id,
            message,
            type,
            durationMs,
            title: options?.title,
            actionLabel: options?.actionLabel,
            onAction: options?.onAction,
            onDismiss: options?.onDismiss,
        };
        this.toasts = [...this.toasts, toast];
        if (durationMs > 0 && typeof window !== "undefined") {
            setTimeout(() => this.dismiss(id), durationMs);
        }
        return id;
    }

    /** Convenience: success toast (auto-dismiss 3 s). */
    success(message: string, durationMs = 3000): string {
        return this.show(message, "success", durationMs);
    }

    /** Convenience: warning toast (auto-dismiss 5 s). */
    warning(message: string, durationMs = 5000): string {
        return this.show(message, "warning", durationMs);
    }

    /** Convenience: error toast (sticky by default). */
    error(message: string, durationMs = 0): string {
        return this.show(message, "error", durationMs);
    }

    dismiss(id: string): void {
        const toast = this.toasts.find((t) => t.id === id);
        this.toasts = this.toasts.filter((t) => t.id !== id);
        toast?.onDismiss?.();
    }

    clear(): void {
        this.toasts = [];
    }
}

export const toastStore = new ToastStore();
