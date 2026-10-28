export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    /** Auto-dismiss after this many ms; 0 = sticky. */
    durationMs: number;
}

export interface DialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export interface Dialog extends DialogOptions {
    id: string;
    resolve: (confirmed: boolean) => void;
}
