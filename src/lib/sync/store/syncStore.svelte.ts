import { read, write } from "../../storages/localStorage";
import { LocalStorageStore } from "../../stores/persistent/localStorageStore";
import type { Profile } from "../../types";

/**
 * The local serverless profile ("account"): a rotatable account UUID —
 * persisted in localStorage, never sent anywhere. "Deleting the account"
 * means clearing the site data.
 */
class SyncStore extends LocalStorageStore {
    profile = $state<Profile>({
        createdAt: 0,
        uuid: "",
    });

    protected hydrate(): void {
        const stored = read("profile");
        if (stored && typeof stored.uuid === "string" && stored.uuid) {
            this.profile = stored;
        } else {
            this.profile = {
                createdAt: Date.now(),
                uuid: crypto.randomUUID(),
            };
            this.persist();
        }
    }

    /**
     * Rotates the account UUID: new identity. Pairings with other devices
     * (once sync ships) have to be re-established afterwards.
     */
    rotateUuid(): void {
        this.profile = { ...this.profile, uuid: crypto.randomUUID() };
        this.persist();
    }

    protected persist(): void {
        write("profile", this.profile);
    }
}

export const syncStore = new SyncStore();
