<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { guessDeckType } from "#lib/utils/deckTypes";
    import { parseDeck } from "#lib/utils/parser";
    import { stashDraftDeck } from "#lib/utils/draftDeck";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";

    let error = $state<string | null>(null);

    // Selecting a file reads it, stashes the content as a draft, and
    // redirects to the create page where the user can review and edit.
    async function onFileChange(event: Event): Promise<void> {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        error = null;
        try {
            const raw = await file.text();
            const parsed = parseDeck(raw);
            stashDraftDeck({
                raw,
                deckType: guessDeckType(raw),
                name: file.name.replace(/\.md$/i, ""),
                title: parsed.title,
            });
            goto(resolve("/(io)/create"));
        } catch {
            error = "Die Datei konnte nicht gelesen werden.";
            // Reset the input so the same file can be selected again.
            input.value = "";
        }
    }
</script>

<svelte:head>
    <title>Hochladen – NSC</title>
</svelte:head>

<PageHeader
    title="Hochladen"
    subtitle="Wähle eine .md-Datei aus — der Inhalt wird im Editor geöffnet, wo du ihn prüfen und anpassen kannst."
/>

<Card class="upload-card" padding="lg" aria-label="Hochladen">
    <label class="field-label" for="upload-file">Datei (.md)</label>
    <input
        id="upload-file"
        type="file"
        accept=".md,text/markdown"
        onchange={onFileChange}
        class="file-input"
    />
    {#if error}
        <p class="message-error">{error}</p>
    {/if}
    <p class="hint">
        Format: eine Zeile <code># Titel</code> und pro Karte eine Zeile
        <code>Vorderseite - Rückseite</code>.
    </p>
</Card>

<style>
    .upload-card {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        margin-bottom: 2rem;
    }

    .field-label {
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
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

    .hint {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.82rem;
        line-height: 1.6;
    }

    .message-error {
        margin: 0;
        color: var(--danger-text);
        font-size: 0.85rem;
    }
</style>
