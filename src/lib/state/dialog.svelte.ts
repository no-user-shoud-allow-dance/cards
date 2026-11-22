/**
 * Session-only dialog store — one dialog at a time; open() returns a
 * Promise that resolves with true (confirm) or false (cancel). Not
 * persisted — dialogs live and die within a single page session.
 */

export type DialogType =
    | "surface"
    | "soft"
    | "primary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "overview"
    | "tertiary";

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

class DialogStore {
    dialog = $state<Dialog | null>(null);

    /** Opens a dialog; resolves when the user confirms or cancels. */
    open(options: DialogOptions): Promise<boolean> {
        // Close any existing dialog (resolves its promise with false).
        this.dialog?.resolve(false);
        this.dialog?.onCancel?.();
        return new Promise((resolve) => {
            this.dialog = {
                ...options,
                id: crypto.randomUUID(),
                resolve,
            };
        });
    }

    /** Confirms the active dialog (resolves promise with true). */
    confirm(): void {
        this.dialog?.resolve(true);
        this.dialog?.onConfirm?.();
        this.dialog = null;
    }

    /** Cancels the active dialog (resolves promise with false). */
    cancel(): void {
        this.dialog?.resolve(false);
        this.dialog?.onCancel?.();
        this.dialog = null;
    }
}

export const dialogStore = new DialogStore();
