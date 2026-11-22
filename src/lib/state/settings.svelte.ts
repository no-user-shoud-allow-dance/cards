import {
    createSettingsRepository,
    defaultSettings,
    type Locale,
    type PrintOptionsRecord,
    type Settings,
    type SettingsRepository,
    type Theme,
} from "#lib/repositories/settingsRepository";
import { setMessagesLocale } from "#messages/locale.svelte";

/**
 * Persistent user settings (pure mode, theme, privacy toggles, API key,
 * print options, locale). Thin store over the settings
 * repository — the versioned record (under kk-settings) lives in the
 * repository; this store only mirrors it into reactive fields.
 */
class SettingsStore {
    pureMode = $state(false);
    theme = $state<Theme>("system");
    mistralApiKey = $state("");
    privacyToastDismissed = $state(false);
    impersistentToastDismissed = $state(false);
    printOptions = $state<PrintOptionsRecord>(defaultSettings().printOptions);
    locale = $state<Locale>("de");
    #repo: SettingsRepository | null = null;
    #ready: Promise<void> | null = null;

    async init(): Promise<void> {
        this.#ready ??= this.#load();
        return this.#ready;
    }

    async #load(): Promise<void> {
        this.#repo = await createSettingsRepository();
        this.#apply(await this.#repo.get());
    }

    #apply(s: Settings): void {
        this.pureMode = s.pureMode;
        this.theme = s.theme;
        this.mistralApiKey = s.mistralApiKey;
        this.privacyToastDismissed = s.privacyToastDismissed;
        this.impersistentToastDismissed = s.impersistentToastDismissed;
        this.printOptions = s.printOptions;
        this.locale = s.locale;
        // The messages module keeps its own reactive locale copy.
        setMessagesLocale(s.locale);
    }

    #current(): Settings {
        return {
            pureMode: this.pureMode,
            theme: this.theme,
            mistralApiKey: this.mistralApiKey,
            privacyToastDismissed: this.privacyToastDismissed,
            impersistentToastDismissed: this.impersistentToastDismissed,
            printOptions: this.printOptions,
            locale: this.locale,
        };
    }

    async #save(): Promise<void> {
        if (!this.#repo) return;
        await this.#repo.put(this.#current());
    }

    /** The one setter shape: init, apply the patch, persist. */
    async #update(patch: Partial<Settings>): Promise<void> {
        await this.init();
        Object.assign(this, patch);
        await this.#save();
    }

    setPureMode(value: boolean): Promise<void> {
        return this.#update({ pureMode: value });
    }

    setTheme(value: Theme): Promise<void> {
        return this.#update({ theme: value });
    }

    setMistralApiKey(key: string): Promise<void> {
        return this.#update({ mistralApiKey: key });
    }

    setPrivacyToastDismissed(dismissed: boolean): Promise<void> {
        return this.#update({ privacyToastDismissed: dismissed });
    }

    setImpersistentToastDismissed(dismissed: boolean): Promise<void> {
        return this.#update({ impersistentToastDismissed: dismissed });
    }

    /** Replaces the whole print options object (persisted in the settings record). */
    setPrintOptions(options: PrintOptionsRecord): Promise<void> {
        return this.#update({ printOptions: options });
    }

    /** UI language; also switches the messages module immediately. */
    async setLocale(locale: Locale): Promise<void> {
        setMessagesLocale(locale);
        await this.#update({ locale });
    }

    /** Deletes the persisted record and resets all fields to defaults. */
    async resetAll(): Promise<void> {
        await this.init();
        await this.#repo?.remove();
        this.#apply(defaultSettings());
    }
}

export const settingsStore = new SettingsStore();
