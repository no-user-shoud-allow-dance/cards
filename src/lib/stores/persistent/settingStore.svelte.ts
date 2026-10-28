import { read, write } from "../../storages/localStorage";
import { BaseStore } from "./baseStore";

class SettingStore extends BaseStore {
    pureMode = $state(false);
    /** Google search buttons (help/mnemonic) hidden by the user. On by default. */
    googleDisabled = $state(true);

    protected hydrate(): void {
        const pure = read("pure");
        if (pure !== null) this.pureMode = pure;
        const google = read("google_disabled");
        if (google !== null) this.googleDisabled = google;
        this.persist();
    }

    setPureMode(on: boolean): void {
        this.pureMode = on;
        this.persist();
    }

    setGoogleDisabled(disabled: boolean): void {
        this.googleDisabled = disabled;
        this.persist();
    }

    protected persist(): void {
        write("pure", this.pureMode);
        write("google_disabled", this.googleDisabled);
    }
}

export const settingStore = new SettingStore();
