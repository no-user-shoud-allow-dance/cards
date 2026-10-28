import type { Dialog, DialogOptions } from "../../types";

/**
 * Session-only dialog store. One dialog at a time; open() returns a
 * Promise that resolves with true (confirm) or false (cancel).
 */
class DialogStore {
    dialog = $state<Dialog | null>(null);

    /** Opens a dialog; resolves when the user confirms or cancels. */
    open(options: DialogOptions): Promise<boolean> {
        // Close any existing dialog (resolves its promise with false).
        this.dialog?.resolve(false);
        return new Promise((resolve) => {
            this.dialog = {
                ...options,
                id: crypto.randomUUID(),
                resolve,
            };
        });
    }

    confirm(): void {
        this.dialog?.resolve(true);
        this.dialog = null;
    }

    cancel(): void {
        this.dialog?.resolve(false);
        this.dialog = null;
    }
}

export const dialogStore = new DialogStore();
