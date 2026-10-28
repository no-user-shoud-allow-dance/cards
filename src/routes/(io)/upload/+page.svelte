<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { DECK_TYPES, DECK_TYPE_OPTIONS, guessDeckType } from "#lib/utils/deckTypes";
    import { parseDeck } from "#lib/utils/parser";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { applyPendingProgressFor } from "#lib/utils/pendingProgress";
    import { countCards } from "#lib/utils/pure";
    import type { DeckType } from "#lib/types";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import SectionLabel from "#lib/components/shared/ui/SectionLabel.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";
    import CardList from "#lib/components/decks/CardList.svelte";

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
        const parsed = parseDeck(raw, deckType);
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
            const { deck } = await decks.add(raw, name, folder, deckType);
            // A progress link shared before this upload may target this deck.
            await applyPendingProgressFor(deck.contentHash);
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } catch {
            error = "Die Datei konnte nicht gelesen werden.";
            busy = false;
        }
    }
</script>

<svelte:head>
    <title>Hochladen – NSC</title>
</svelte:head>

<PageHeader
    title="Hochladen"
    subtitle="Lade einen eigenen Stapel als .md-Datei hoch. Vor dem Speichern siehst du eine Vorschau der Karten."
/>

<Card class="upload-card" padding="lg" aria-label="Hochladen">
    {#snippet header()}
        <label class="field-label" for="upload-file">Datei (.md)</label>
    {/snippet}
    <form class="upload-form" onsubmit={onSubmit}>
        <input
            id="upload-file"
            type="file"
            accept=".md,text/markdown"
            onchange={onFileChange}
            class="file-input"
        />
        <div class="field-row">
            <TextInput
                label="Name"
                id="upload-name"
                bind:value={name}
                placeholder="z. B. Lektion 22"
            />
            <TextInput
                label="Ordner"
                id="upload-folder"
                bind:value={folder}
            />
            <div class="select-field">
                <label class="field-label" for="upload-type">Typ</label>
                <select
                    id="upload-type"
                    value={deckType}
                    onchange={(event) =>
                        (deckType = (event.currentTarget as HTMLSelectElement)
                            .value as DeckType)}
                >
                    {#each DECK_TYPE_OPTIONS as [value, config]}
                        <option value={value}>{config.label}</option>
                    {/each}
                </select>
            </div>
        </div>
        <Button
            variant="primary"
            type="submit"
            disabled={busy || (preview?.errors.length ?? 0) > 0}
        >
            {busy ? "Wird hochgeladen …" : "Hochladen"}
        </Button>
        {#if error}
            <p class="message message-error">{error}</p>
        {/if}
        {#if preview && preview.errors.length > 0}
            <p class="message message-error">
                Die Datei ist fehlerhaft formatiert — siehe die Fehler in
                der Vorschau. Korrigiere die Datei und wähle sie erneut aus.
            </p>
        {/if}
        <p class="hint">
            Format: eine Zeile <code># Titel</code> und pro Karte eine
            Zeile <code>Vorderseite - Rückseite</code>. Der Typ wird anhand
            des Inhalts vorgeschlagen und kann oben angepasst werden.
        </p>
    </form>
</Card>

{#if preview}
    <section class="preview" aria-label="Vorschau des Stapels">
        <SectionLabel>Vorschau</SectionLabel>
        <div class="preview-head">
            <strong class="preview-title">{previewTitle}</strong>
            <span class="preview-meta">
                <Badge>{countCards(preview.cards.length)}</Badge>
                <Badge variant="info">{DECK_TYPES[deckType].label}</Badge>
                {#if previewPureMode}
                    <Badge variant="primary">Pur-Modus</Badge>
                {/if}
            </span>
            {#if pureModeAvailable}
                <Toggle
                    label="Pur-Modus"
                    checked={pureMode}
                    onchange={(value) => (pureMode = value)}
                />
            {/if}
        </div>
        {#if preview.errors.length > 0}
            <details class="message message-warn">
                <summary>
                    {preview.errors.length} Fehler beim Parsen
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

<style>
    .upload-card {
        margin-bottom: 2rem;
    }

    .field-label {
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
    }

    .upload-form {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    /* The native file input keeps its behavior; only its button part is
       styled to match the surrounding fields. */
    .file-input {
        font: inherit;
        padding: 0.35rem 0.65rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--text);
    }

    .file-input::file-selector-button,
    .file-input::-webkit-file-upload-button {
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

    .file-input::file-selector-button:hover,
    .file-input::-webkit-file-upload-button:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .field-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
    }

    .field-row :global(.text-input) {
        flex: 1;
        min-width: 10rem;
    }

    .select-field {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.4rem;
        min-width: 8rem;
    }

    .select-field select {
        font: inherit;
        min-height: 2.65rem;
        padding: 0.55rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--text);
        font-size: 0.9rem;
    }

    .select-field select:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: 0.95rem;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .preview-head :global(.toggle) {
        margin-left: auto;
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
