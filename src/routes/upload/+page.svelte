<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { DECK_TYPES, guessDeckType } from "#lib/decks/deckTypes";
    import { parseDeck } from "#lib/decks/parser";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { countCards } from "#lib/utils/pure";
    import type { DeckType } from "#lib/utils/types";
    import CardList from "#lib/components/deck/CardList.svelte";

    const typeOptions = Object.entries(DECK_TYPES) as [
        DeckType,
        (typeof DECK_TYPES)[DeckType],
    ][];

    let fileInput = $state<HTMLInputElement | null>(null);
    let fileName = $state<string | null>(null);
    let raw = $state<string | null>(null);
    let name = $state("");
    let folder = $state("Eigene");
    let deckType = $state<DeckType>("latin");
    let pureMode = $state(false);
    let error = $state<string | null>(null);
    let busy = $state(false);

    // Draft preview: the selected file parsed on every change, before saving.
    const preview = $derived.by(() => {
        if (raw === null) return null;
        const parsed = parseDeck(raw);
        return {
            title: parsed.title,
            cards: parsed.cards.map((card, index) => ({
                ...card,
                id: `preview/${index}`,
            })),
            errors: parsed.errors,
        };
    });

    const previewTitle = $derived(
        preview?.title ?? name.trim() ?? fileName ?? "",
    );

    // Pure mode exists only for deck types that define it (see DECK_TYPES);
    // on this page the switch only changes how the preview renders.
    const pureModeAvailable = $derived(DECK_TYPES[deckType].pureMode);
    const previewPureMode = $derived(pureModeAvailable && pureMode);

    async function onFileChange(event: Event): Promise<void> {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        error = null;
        raw = null;
        fileName = file?.name ?? null;
        if (file && !name.trim()) {
            name = file.name.replace(/\.md$/i, "");
        }
        if (file) {
            try {
                raw = await file.text();
                // Suggest the type from the content; the user can override it.
                deckType = guessDeckType(raw);
            } catch {
                error = "Die Datei konnte nicht gelesen werden.";
            }
        }
    }

    async function onSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        error = null;

        if (raw === null) {
            error = "Bitte wähle eine .md-Datei aus.";
            return;
        }
        if (!name.trim()) {
            error = "Bitte gib einen Namen für den Stapel ein.";
            return;
        }
        // A wrongly formatted file (parse errors) must not be uploaded.
        if (preview && preview.errors.length > 0) {
            error =
                "Die Datei ist fehlerhaft formatiert — bitte korrigiere sie vor dem Hochladen.";
            return;
        }

        busy = true;
        try {
            const { deck } = await userDecks.add(raw, name, folder, deckType);
            goto(resolve("/deck/[slug]", { slug: deck.slug }));
        } catch {
            error = "Die Datei konnte nicht gelesen werden.";
            busy = false;
        }
    }
</script>

<svelte:head>
    <title>Stapel hochladen – NSC</title>
</svelte:head>

<div class="page">
    <header class="hero">
        <h1>Stapel hochladen</h1>
        <p class="subtitle">
            Lade einen eigenen Stapel als .md-Datei hoch. Vor dem Speichern
            siehst du eine Vorschau der Karten.
        </p>
    </header>

    <section class="upload-box" aria-label="Stapel hochladen">
        <form class="upload-body" onsubmit={onSubmit}>
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
            <button
                type="submit"
                class="submit"
                disabled={busy || (preview?.errors.length ?? 0) > 0}
            >
                {busy ? "Wird hochgeladen …" : "Hochladen"}
            </button>
            {#if error}
                <p class="message message-error">{error}</p>
            {/if}
            {#if preview && preview.errors.length > 0}
                <p class="message message-error">
                    Die Datei ist fehlerhaft formatiert — siehe die Hinweise
                    in der Vorschau. Korrigiere die Datei und wähle sie erneut
                    aus.
                </p>
            {/if}
            <p class="hint">
                Format: eine Zeile <code># Titel</code> und pro Karte eine
                Zeile <code>Vorderseite - Rückseite</code>. Der Typ wird aus
                dem Inhalt erraten und kann oben angepasst werden.
            </p>
        </form>
    </section>

    {#if preview}
        <section class="preview" aria-label="Vorschau des Stapels">
            <h2 class="section-label">Vorschau</h2>
            <div class="preview-head">
                <strong class="preview-title">{previewTitle}</strong>
                <span class="preview-meta">
                    {countCards(preview.cards.length)} · {DECK_TYPES[deckType].label}
                    {#if previewPureMode} · Pur-Modus{/if}
                </span>
                {#if pureModeAvailable}
                    <label class="pure-toggle">
                        <input type="checkbox" bind:checked={pureMode} />
                        <span>Pur-Modus</span>
                    </label>
                {/if}
            </div>
            {#if preview.errors.length > 0}
                <details class="message message-warn">
                    <summary>
                        {preview.errors.length} Hinweise beim Parsen
                    </summary>
                    <ul>
                        {#each preview.errors as warning}
                            <li>{warning}</li>
                        {/each}
                    </ul>
                </details>
            {/if}
            {#if preview.cards.length > 0}
                <div class="preview-list">
                    <CardList cards={preview.cards} pureMode={previewPureMode} />
                </div>
            {:else}
                <p class="empty">Keine Karten gefunden.</p>
            {/if}
        </section>
    {/if}
</div>

<style>
    .upload-box {
        margin-bottom: 2rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
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

    /* The native file input keeps its behavior; only its button part is
       styled to match the surrounding fields. */
    .field input[type="file"] {
        padding: 0.35rem 0.65rem;
    }

    .field input[type="file"]::file-selector-button,
    .field input[type="file"]::-webkit-file-upload-button {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        margin-right: 0.75rem;
        padding: 0.45rem 0.9rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface-soft);
        color: var(--text);

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .field input[type="file"]::file-selector-button:hover,
    .field input[type="file"]::-webkit-file-upload-button:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
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

    .hint {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.82rem;
        line-height: 1.6;
    }

    .message {
        margin: 0;
        font-size: 0.85rem;
    }

    .message-error {
        color: var(--danger-text);
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

    .preview {
        margin-bottom: 2rem;
    }

    .preview-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.35rem 0.9rem;

        margin-bottom: 0.9rem;
    }

    .preview-title {
        font-size: 1.05rem;
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .preview-meta {
        color: var(--text-muted);
        font-size: 0.85rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }

    .pure-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;

        margin-left: auto;

        color: var(--text-muted);
        font-size: 0.875rem;
        font-weight: 500;

        cursor: pointer;
        user-select: none;
    }

    /* Custom switch, while preserving the native checkbox interaction. */
    .pure-toggle input {
        position: relative;
        appearance: none;
        flex: 0 0 auto;

        width: 2.1rem;
        height: 1.2rem;
        margin: 0;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-pill);
        background: var(--surface-soft);

        cursor: pointer;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast);
    }

    .pure-toggle input::after {
        position: absolute;
        top: 2px;
        left: 2px;

        width: 0.78rem;
        height: 0.78rem;

        border-radius: 50%;
        transform: translateY(1px);

        background: var(--text-muted);
        content: "";
        transition:
            transform var(--transition-fast),
            background var(--transition-fast);
    }

    .pure-toggle input:checked {
        border-color: var(--primary);
        background: var(--primary);
    }

    .pure-toggle input:checked::after {
        transform: translateX(0.9rem) translateY(1px);
        background: var(--primary-text);
    }

    .pure-toggle input:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    .preview .message-warn {
        margin-bottom: 0.9rem;
    }

    .preview-list {
        max-height: 26rem;
        padding: 0.75rem;
        overflow-y: auto;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface-soft);
    }

    .preview-list :global(.card-list) {
        margin: 0;
    }

    @media (max-width: 540px) {
        .field-row {
            flex-direction: column;
        }

        .preview-list {
            max-height: 20rem;
            padding: 0.5rem;
        }
    }
</style>
