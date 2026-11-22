<script lang="ts">
    import { Card, PageHeader, startDraft } from "#components";
    import { toastStore } from "#lib";

    // Selecting a file creates a draft deck (`Draft-{n}`) in "Drafts" with
    // the file's content and opens it in the editor.
    async function onFileChange(event: Event): Promise<void> {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        try {
            await startDraft(await file.text());
        } catch {
            toastStore.error("Die Datei konnte nicht gelesen werden.");
        } finally {
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
    subtitle="Wähle eine .md-Datei aus – daraus wird ein Entwurf „Draft-{'{n}'}“ im Ordner „Drafts“, den du im Editor prüfen und anpassen kannst."
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
    <p class="hint">
        Format: eine Zeile <code># Titel</code> und pro Karte eine Zeile
        <code>Vorderseite - Rückseite</code>.
    </p>
</Card>

<style lang="postcss">
    /* The passed class lands on the Card root (a child component). */
    :global(.upload-card) {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        margin-bottom: 2rem;
    }

    .field-label {
        color: var(--text-muted);
        font-size: var(--fs-3);
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

        &::file-selector-button,
        &::-webkit-file-upload-button {
            font: inherit;
            font-size: var(--fs-4);
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
    }

    .file-input::file-selector-button:hover,
    .file-input::-webkit-file-upload-button:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .hint {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;
    }
</style>
