<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import {
        Button,
        Card,
        Chip,
        DeckPreview,
        DeckSourceEditor,
        Spinner,
        TextInput,
        decks,
        folderLabel,
    } from "#components";
    import type { LoadedDeck } from "#components";
    import { core, messages, readDraftDeck } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { data } = $props();
    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    // Effective pure mode, compiled into the deck: the preview shows
    // the cards exactly as the deck page would render them.
    const pureMode = $derived(deck.pureModeEnabled);

    // This route is the editor: the one surface that sees raw markdown
    // (L0) directly. Everything below the editor works on the parsed
    // DeckDocument (preview) or on error codes (validation).
    let raw = $state("");
    let initialized = $state(false);
    let busy = $state(false);
    let saveError = $state<string | null>(null);

    // Save flow: "Speichern" first switches to the folder-choosing scene;
    // only the confirm there persists content + folder.
    let choosingFolder = $state(false);
    let folderValue = $state("");

    // H14: the error strip lives at the bottom of the editor pane and
    // scrolls into view when errors appear/change.
    let errorsStrip = $state<HTMLElement | null>(null);

    $effect(() => {
        void errors.length;
        errorsStrip?.scrollIntoView({ block: "nearest" });
    });

    $effect(() => {
        if (initialized) return;
        void decks.getRaw(data.slug).then((stored) => {
            if (!initialized && stored !== null) {
                // A stashed draft (invalid upload/import) opens in the
                // editor instead of the stored barebones source.
                const draft = readDraftDeck();
                raw = draft?.raw ?? stored;
                initialized = true;
            }
        });
    });

    // One parse per keystroke feeds both the live preview (doc) and the
    // error list — every line error is listed before saving is possible.
    const parsed = $derived(core.parseCollect(core.makeRawMarkdown(raw)));
    const doc = $derived(parsed.doc);
    const errors = $derived(
        raw.trim() ? parsed.errors.map((e) => messages.errorMessage(e.code)) : []
    );

    // Formats the raw markdown in place (currently: blank lines around
    // the title). Safe on invalid intermediate states — no title, no-op.
    function format(): void {
        raw = core.formatDeckSource(raw);
    }

    // "Speichern" opens the folder scene (content is not persisted yet).
    function save(): void {
        saveError = null;
        if (errors.length > 0) {
            saveError = UI.saveBlocked;
            return;
        }
        folderValue = folderLabel(deck.folders);
        choosingFolder = true;
    }

    // The folder scene's confirm: persist content, then move the deck to
    // the chosen folder — the `#drafts` tag is dropped on the first save.
    async function confirmSave(): Promise<void> {
        busy = true;
        try {
            await decks.updateRaw(deck.slug, raw);
            await decks.update(deck.slug, {
                folder: folderValue,
                dropFolders: [core.DRAFT_FOLDER],
            });
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } catch (error) {
            // Map the code at the boundary (e.g. FOLDER_RESERVED_PREFIX
            // for a "#…" folder name) — never show the raw error code.
            saveError = core.isNscError(error) ? messages.errorMessage(error.code) : UI.saveFailed;
            busy = false;
            choosingFolder = false;
        }
    }
</script>

<svelte:head>
    <title>Stapel bearbeiten – NSC</title>
</svelte:head>

<!-- Fullscreen editor: no content-width cap, no auto margins — the
     freed horizontal space hosts the live preview next to the source. -->
<div class="editor-shell">
    <div class="editor-grid">
        <section class="pane editor-pane" aria-label={UI.editorSourceAria}>
            <div class="pane-head">
                <h2 class="pane-label">{UI.editorSourceLabel}</h2>
                <Button
                    variant="secondary"
                    class="format-btn"
                    onclick={format}
                    title={UI.formatTitle}
                >
                    {UI.formatAction}
                </Button>
            </div>
            {#if !initialized}
                <div class="pane-loading">
                    <Spinner size={28} label={UI.loadingDeck} />
                </div>
            {/if}
            <DeckSourceEditor
                bind:value={raw}
                errors={parsed.errors}
                ariaLabel={UI.editorSourceAria}
            />
            {#if errors.length > 0}
                <!-- H14: parse errors as a bottom strip of the editor pane,
                     with a count badge, auto-scrolled into view. -->
                <div class="errors-strip" bind:this={errorsStrip}>
                    <span class="errors-head">
                        <Chip tone="danger" size="sm">{UI.errorsCount(errors.length)}</Chip>
                    </span>
                    <ul class="errors">
                        {#each errors as err (err)}
                            <li>{err}</li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </section>
        <aside class="pane preview-pane" aria-label={UI.editorPreviewAria}>
            <div class="pane-head">
                <h2 class="pane-label">{UI.editorPreviewLabel}</h2>
                {#if deck.pureMode}
                    <span class="pure-note">{UI.pureMode}: {UI.pureModeState(pureMode)}</span>
                {/if}
            </div>
            <DeckPreview {doc} {pureMode} />
        </aside>
    </div>

    {#if saveError}
        <p class="note-error">{saveError}</p>
    {/if}

    <div class="header-actions">
        <Button variant="primary" onclick={save} disabled={errors.length > 0}>
            {UI.saveAction}
        </Button>
        <Button href={resolve("/(deck)/deck/[slug]", { slug: deck.slug })}>
            {UI.pairingConsentCancel}
        </Button>
    </div>

    {#if choosingFolder}
        <!-- H14: the folder-choosing save step is an overlay dialog — the
             markdown stays visible behind it. -->
        <div class="folder-overlay">
            <Card class="folder-scene" padding="lg" aria-label={UI.folderChooseTitle}>
                <h2 class="scene-title">{UI.folderChooseTitle}</h2>
                <p class="scene-hint">{UI.folderChooseHint(deck.name)}</p>
                <TextInput label={UI.folderInputLabel} id="save-folder" bind:value={folderValue} />
                <div class="scene-actions">
                    <Button
                        variant="primary"
                        onclick={confirmSave}
                        disabled={!folderValue.trim()}
                        {busy}
                        busyLabel={UI.busySaving}
                    >
                        {UI.saveAction}
                    </Button>
                    <Button onclick={() => (choosingFolder = false)}>{UI.backToEditor}</Button>
                </div>
                {#if saveError}
                    <p class="note-error">{saveError}</p>
                {/if}
            </Card>
        </div>
    {/if}
</div>

<style lang="postcss">
    /* Fullscreen: full width, no auto margins, fills the viewport below
       the (compact) header and above the footer. */
    .editor-shell {
        display: flex;
        flex-direction: column;

        width: 100%;
        min-height: calc(100dvh - var(--header-h) - var(--footer-h));
        margin-inline: 0;
        padding: 0rem clamp(1rem, 2.5dvw, 2.5rem) 2rem;
    }

    /* H14: the folder-choosing save step floats over the editor as an
       overlay — the markdown context stays visible behind it. */
    .folder-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;

        display: grid;
        place-items: center;

        padding: 1rem;

        background: var(--backdrop);
    }

    :global(.folder-scene) {
        width: min(100%, 32rem);
    }

    .scene-title {
        margin: 0 0 0.4rem;
        font-size: 1.15rem;
        font-weight: 600;
    }

    .scene-hint {
        margin: 0 0 1rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    .scene-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 1.1rem;
    }

    .header-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        width: 100%;

        margin-top: 0.6rem;
    }

    /* Two panes side by side: highlighted source left, live preview
       right. Both fill the remaining viewport height and scroll
       internally. */
    .editor-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
        gap: 1.25rem;

        flex: 1;
        min-height: 0;
        margin-top: 0.5rem;
    }

    .pane {
        display: flex;
        flex-direction: column;

        height: calc(100dvh - var(--header-h) - 1.65rem);
    }

    /* H14: sticky pane headers — the labels stay put while a pane scrolls. */
    .pane-head {
        position: sticky;
        top: 0;
        z-index: 5;

        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-height: 2.3rem;

        margin: 0 0 0.5rem;
        padding-block: 0.3rem;

        background: var(--bg);

        & .pane-label {
            margin-bottom: 0;
        }
    }

    .pure-note {
        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 500;
    }

    .pane-label {
        margin: 0 0 0.5rem;

        color: var(--text-muted);
        font: var(--font-label);
        font-size: var(--fs-2);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    /* The editor pane stays blank until the stored raw markdown has
       resolved — a small spinner marks the wait. */
    .pane-loading {
        display: grid;
        flex: 1;
        place-items: center;
        min-height: 8rem;
    }

    /* Compact format button next to the pane label. */
    .pane-head :global(.btn.format-btn) {
        min-height: 1.9rem;
        padding: 0.3rem 0.8rem;

        font-size: var(--fs-3);
    }

    /* H14: error strip at the bottom of the editor pane. */
    .errors-strip {
        margin-top: 0.6rem;
        padding: 0.6rem 0.75rem;

        border: 1px solid var(--danger-border);
        border-radius: var(--radius-md);

        background: var(--danger-bg);
    }

    .errors-head {
        display: block;
        margin-bottom: 0.35rem;
    }

    .errors {
        margin: 0;
        padding-left: 1.1rem;

        color: var(--danger-text);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    .note-error {
        margin: 0.75rem 0;

        color: var(--danger-text);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    /* Narrow viewports stack the panes; the editor keeps a fixed share
       of the viewport, the preview flows below with its own cap. */
    @media (max-width: 900px) {
        .editor-grid {
            grid-template-columns: 1fr;
            flex: none;
        }
    }

    @media (max-width: 540px) {
        .editor-shell {
            padding: 1rem 0.75rem 1.5rem;
        }

        .editor-grid {
            gap: 1rem;
        }
    }
</style>
