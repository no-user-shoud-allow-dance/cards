export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    /** Auto-dismiss after this many ms; 0 = sticky. */
    durationMs: number;
    /** Optional bold title above the message. */
    title?: string;
    /** Label for an optional action button. */
    actionLabel?: string;
    /** Called when the action button is clicked. */
    onAction?: () => void;
    /** Called when the toast is dismissed (X button or auto-dismiss). */
    onDismiss?: () => void;
}

export type DialogType =
    | "surface"
    | "soft"
    | "primary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "overview";

export interface DialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Background color variant. */
    bg?: DialogType;
    /** Called when the user confirms. */
    onConfirm?: () => void;
    /** Called when the user cancels or dismisses. */
    onCancel?: () => void;
}

export interface Dialog extends DialogOptions {
    id: string;
    resolve: (confirmed: boolean) => void;
}
