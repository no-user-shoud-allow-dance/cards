<script lang="ts">
    import { slide } from "svelte/transition";
    import { DECK_TYPES } from "#lib/decks/deckTypes";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { countCards } from "#lib/utils/pure";
    import type { DeckType } from "#lib/utils/types";

    const typeOptions = Object.entries(DECK_TYPES) as [
        DeckType,
        (typeof DECK_TYPES)[DeckType],
    ][];

    let open = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let name = $state("");
    let folder = $state("Eigene");
    let deckType = $state<DeckType>("latin");
    let error = $state<string | null>(null);
    let result = $state<string | null>(null);
    let warnings = $state<string[] | null>(null);
    let busy = $state(false);

    function onFileChange(event: Event): void {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        if (file && !name.trim()) {
            name = file.name.replace(/\.md$/i, "");
        }
        error = null;
        result = null;
        warnings = null;
    }

    async function onSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = null;
        result = null;
        warnings = null;

        const file = fileInput?.files?.[0];
        if (!file) {
            error = "Bitte wähle eine .md-Datei aus.";
            return;
        }
        if (!name.trim()) {
            error = "Bitte gib einen Namen für den Stapel ein.";
            return;
        }

        busy = true;
        try {
            const raw = await file.text();
            const added = await userDecks.add(raw, name, folder, deckType);
            result = `„${added.deck.name}" hochgeladen — ${countCards(added.cardCount)}.`;
            warnings = added.errors.length > 0 ? added.errors : null;
            name = "";
            if (fileInput) fileInput.value = "";
        } catch {
            error = "Die Datei konnte nicht gelesen werden.";
        } finally {
            busy = false;
        }
    }
</script>

<section class="upload" aria-label="Stapel hochladen">
    <div class="upload-box">
        <button
            type="button"
            class="upload-header"
            class:upload-header--open={open}
            aria-expanded={open}
            onclick={() => (open = !open)}
        >
            <span class="upload-title">Stapel hochladen</span>
            <span class="upload-chevron" class:open aria-hidden="true">▾</span>
        </button>
        {#if open}
            <form
                class="upload-body"
                onsubmit={onSubmit}
                transition:slide={{ duration: 200 }}
            >
                <div class="field">
                    <label for="upload-file">Datei (.md)</label>
                    <input
                        id="upload-file"
                        type="file"
                        accept=".md,text/markdown"
                        bind:this={fileInput}
                        onchange={onFileChange}
                    />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="upload-name">Name</label>
                        <input
                            id="upload-name"
                            type="text"
                            bind:value={name}
                            placeholder="z. B. Lektion 22"
                        />
                    </div>
                    <div class="field">
                        <label for="upload-folder">Ordner</label>
                        <input id="upload-folder" type="text" bind:value={folder} />
                    </div>
                    <div class="field">
                        <label for="upload-type">Typ</label>
                        <select
                            id="upload-type"
                            value={deckType}
                            onchange={(event) =>
                                (deckType = (event.currentTarget as HTMLSelectElement)
                                    .value as DeckType)}
                        >
                            {#each typeOptions as [value, config]}
                                <option value={value}>{config.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <button type="submit" class="submit" disabled={busy}>
                    {busy ? "Wird hochgeladen …" : "Hochladen"}
                </button>
                {#if error}
                    <p class="message message-error">{error}</p>
                {/if}
                {#if result}
                    <p class="message message-ok">{result}</p>
                {/if}
                {#if warnings}
                    <details class="message message-warn">
                        <summary>{warnings.length} Hinweise beim Parsen</summary>
                        <ul>
                            {#each warnings as warning}
                                <li>{warning}</li>
                            {/each}
                        </ul>
                    </details>
                {/if}
            </form>
        {/if}
    </div>
</section>

<style>
    .upload {
        margin-bottom: 2rem;
    }

    .upload-box {
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .upload-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-bottom: 1px solid var(--border);

        background: var(--surface-soft);

        cursor: pointer;
        text-align: left;

        transition: background var(--transition-fast);
    }

    .upload-header:hover {
        background: var(--surface-hover);
    }

    .upload-box:not(:has(.upload-body)) .upload-header {
        border-bottom: 0;
    }

    .upload-title {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1.4;
        text-transform: uppercase;
    }

    .upload-chevron {
        color: var(--text-muted);
        font-size: 0.7rem;

        transition: transform var(--transition-fast);
    }

    .upload-chevron.open {
        transform: rotate(180deg);
    }

    .upload-body {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        padding: 1.1rem 1.25rem 1.25rem;
    }

    .field {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
    }

    .field label {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .field input,
    .field select {
        font: inherit;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    .field input:focus,
    .field select:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .field-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
    }

    .submit {
        align-self: flex-start;

        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.7rem 1.4rem;

        border: 0;
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .submit:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    .submit:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .message {
        margin: 0;
        font-size: 0.85rem;
    }

    .message-error {
        color: var(--danger-text);
    }

    .message-ok {
        color: var(--success-text);
    }

    .message-warn {
        color: var(--text-muted);
    }

    .message-warn summary {
        cursor: pointer;
        font-weight: 600;
    }

    .message-warn ul {
        margin: 0.4rem 0 0;
        padding-left: 1.1rem;
        font-size: 0.8rem;
    }

    @media (max-width: 540px) {
        .field-row {
            flex-direction: column;
        }
    }
</style>
