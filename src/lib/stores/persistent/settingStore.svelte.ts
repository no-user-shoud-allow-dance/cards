import { read, write } from "../../storages/localStorage";
import { LocalStorageStore } from "./localStorageStore";

class SettingStore extends LocalStorageStore {
    pureMode = $state(false);
    /** Google search buttons (help/mnemonic) hidden by the user. On by default. */
    googleDisabled = $state(true);
    /** Mistral API key, stored locally only; reserved for upcoming AI features. */
    mistralApiKey = $state("");

    protected hydrate(): void {
        const pure = read("pure");
        if (pure !== null) this.pureMode = pure;
        const google = read("google_disabled");
        if (google !== null) this.googleDisabled = google;
        const mistralKey = read("mistral_api_key");
        if (mistralKey !== null) this.mistralApiKey = mistralKey;
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

    setMistralApiKey(key: string): void {
        this.mistralApiKey = key;
        this.persist();
    }

    protected persist(): void {
        write("pure", this.pureMode);
        write("google_disabled", this.googleDisabled);
        write("mistral_api_key", this.mistralApiKey);
    }
}

export const settingStore = new SettingStore();
