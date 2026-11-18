<script module lang="ts">
    import { withHintBrackets } from "#lib/core/deck/hints";
    import { escapeCardSide, imageToken } from "#lib/core/deck/inline";
    import { makeTag } from "#lib/core/deck/parse";
    import type { Card, CardSide, DeckType, Tag } from "#lib/core/deck/document";

    export interface EditCard {
        id: number;
        front: string;
        back: string;
        /** Example/usage line (`::` field) as raw markup. */
        context: string;
        /** Raw tag input, e.g. "#verben basis" — split on whitespace/commas. */
        tags: string;
        /** Moon (anti-star `*`): the card is skipped by every review queue. */
        hidden: boolean;
        /** Raw image token `![alt](https://…)` — the trailing field of the card line. */
        image: string;
    }

    /** Editor source of one card side: plain text with hint brackets restored. */
    export function cardSideSource(card: Card, side: CardSide): string {
        const hints = card.hints.filter((h) => h.side === side);
        return withHintBrackets(card[side], hints).plain;
    }

    /**
     * Normalizes the tag input into valid tags: split on whitespace and
     * commas, drop a leading `#`, lowercase/trim and length-check via the
     * single core constructor. Invalid or duplicate tags are dropped, so
     * the serialized markdown always parses.
     */
    export function parseTagList(input: string): Tag[] {
        const seen: string[] = [];
        const tags: Tag[] = [];
        for (const part of input.split(/[\s,]+/)) {
            const raw = part.replace(/^#/, "");
            if (!raw) continue;
            try {
                const tag = makeTag(raw);
                if (!seen.includes(tag)) {
                    seen.push(tag);
                    tags.push(tag);
                }
            } catch {
                // Too long (> 24 chars): skip, the line must stay parseable.
            }
        }
        return tags;
    }

    /**
     * Serializes the editor state to deck markdown: frontmatter
     * with the structural `type:` key, the H1 title, then one card per line
     * `front - back :: context #tags ![alt](url) *`. Real newlines are
     * escaped as `\n` (the format is one card per line), so saving
     * round-trips losslessly.
     */
    export function serializeDeckMarkdown(
        title: string,
        cards: EditCard[],
        fallbackName: string,
        deckType?: DeckType
    ): string {
        const lines: string[] = [];
        if (deckType) lines.push("---", `type: ${deckType}`, "---");
        lines.push(`# ${title.trim() || fallbackName}`, "");
        for (const card of cards) {
            if (!card.front.trim() || !card.back.trim()) continue;
            let line = `${escapeCardSide(card.front.trim())} - ${escapeCardSide(card.back.trim())}`;
            const context = card.context.trim();
            if (context) line += ` :: ${escapeCardSide(context)}`;
            for (const tag of parseTagList(card.tags)) line += ` #${tag}`;
            const image = card.image.trim();
            if (image) line += ` ${image}`;
            if (card.hidden) line += " *";
            lines.push(line);
        }
        return lines.join("\n") + "\n";
    }
</script>

<script lang="ts">
    import { SvelteSet } from "svelte/reactivity";
    import { serializeInlineSide } from "#lib/core/deck/inline";
    import { makeRawMarkdown, parseCollect } from "#lib/core/deck/parse";
    import { errorMessage } from "#messages/locale.svelte";
    import { toastStore } from "#lib/state/toasts.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import CheckBox from "#components/shared/ui/CheckBox.svelte";
    import Dialog from "#components/shared/ui/Dialog.svelte";
    import EditCardRow from "#components/decks/EditCardRow.svelte";

    let {
        title = $bindable(""),
        cards = $bindable([]),
        defaultFileName = "stapel",
    }: {
        title?: string;
        cards?: EditCard[];
        defaultFileName?: string;
    } = $props();

    let nextId = $state(0);
    let selected = $state<Set<number>>(new Set());

    // Markdown bulk actions
    let mdMode = $state<"add" | "replace" | null>(null);
    let mdInput = $state("");
    let mdErrors = $state<string[]>([]);

    // Markdown export dialog
    let exportOpen = $state(false);
    let exportText = $state("");

    // Keep nextId ahead of all card ids (cards may be set externally).
    $effect(() => {
        let max = -1;
        for (const c of cards) if (c.id > max) max = c.id;
        if (max >= nextId) nextId = max + 1;
    });

    const allSelected = $derived(cards.length > 0 && selected.size === cards.length);

    const validCount = $derived(cards.filter((c) => c.front.trim() && c.back.trim()).length);

    const skippedCount = $derived(cards.length - validCount);

    function addCard(): void {
        cards = [
            ...cards,
            { id: nextId++, front: "", back: "", context: "", tags: "", hidden: false, image: "" },
        ];
    }

    function deleteCard(id: number): void {
        cards = cards.filter((c) => c.id !== id);
        const next = new SvelteSet(selected);
        next.delete(id);
        selected = next;
    }

    function toggleSelected(id: number): void {
        const next = new SvelteSet(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        selected = next;
    }

    function toggleSelectAll(): void {
        if (allSelected) {
            selected = new SvelteSet<number>();
        } else {
            selected = new SvelteSet(cards.map((c) => c.id));
        }
    }

    function deleteSelected(): void {
        cards = cards.filter((c) => !selected.has(c.id));
        selected = new Set();
    }

    function openExportDialog(): void {
        exportText = serializeDeckMarkdown(title, cards, defaultFileName);
        exportOpen = true;
    }

    function downloadMarkdown(): void {
        const blob = new Blob([exportText], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${defaultFileName}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function copyMarkdown(): Promise<void> {
        try {
            await navigator.clipboard.writeText(exportText);
            toastStore.success("Markdown in die Zwischenablage kopiert.");
        } catch {
            toastStore.error(
                "Kopieren fehlgeschlagen – bitte den Text manuell markieren und kopieren."
            );
        }
    }

    function openMdMode(mode: "add" | "replace"): void {
        mdMode = mode;
        mdInput = "";
        mdErrors = [];
    }

    function applyMarkdown(): void {
        // The editor is the one surface allowed to see raw markdown —
        // it is parsed here through the single core parser.
        const { doc, errors } = parseCollect(makeRawMarkdown(mdInput));
        mdErrors = errors.map((e) => errorMessage(e.code));
        if (!doc || doc.cards.length === 0) {
            mdErrors = [...mdErrors, "Keine gültigen Karten in der Eingabe gefunden."];
            return;
        }
        const newCards: EditCard[] = doc.cards.map((c) => ({
            id: nextId++,
            front: cardSideSource(c, "front"),
            back: cardSideSource(c, "back"),
            context: c.context ? serializeInlineSide(c.context) : "",
            tags: c.tags.join(" "),
            hidden: c.hidden,
            image: c.image ? imageToken(c.image) : "",
        }));
        if (mdMode === "replace") {
            cards = newCards;
            selected = new Set();
            title = String(doc.title);
        } else {
            cards = [...cards, ...newCards];
        }
        mdMode = null;
        mdInput = "";
        mdErrors = [];
    }
</script>

<!-- Markdown bulk actions -->
<div class="md-buttons">
    <Button variant="secondary" class="md-btn" onclick={openExportDialog}>
        Als Markdown exportieren
    </Button>
    <Button variant="secondary" class="md-btn" onclick={() => openMdMode("add")}>
        Aus Markdown hinzufügen
    </Button>
    <Button variant="secondary" class="md-btn" onclick={() => openMdMode("replace")}>
        Durch Markdown ersetzen
    </Button>
</div>

<Dialog
    title={mdMode === "add" ? "Karten aus Markdown hinzufügen" : "Karten durch Markdown ersetzen"}
    open={mdMode !== null}
    onclose={() => (mdMode = null)}
>
    <p class="md-hint">
        {#if mdMode === "add"}
            Karten aus dem eingefügten Markdown werden an die bestehenden Karten angehängt.
        {:else}
            <strong>Achtung:</strong> Alle bisherigen Karten werden durch den eingefügten Markdown ersetzt.
        {/if}
    </p>
    <textarea
        class="md-input"
        rows="6"
        bind:value={mdInput}
        placeholder="---
type: latin
---
# Titel
amo [amare] - ich liebe :: amo, amas, amat #verb *
H~2~O - Wasser
Katze - die Katze ![Katze](https://hosting.example/katze.jpg)"
        spellcheck="false"></textarea>
    {#if mdErrors.length > 0}
        <ul class="md-errors">
            {#each mdErrors as err (err)}
                <li>{err}</li>
            {/each}
        </ul>
    {/if}
    {#snippet footer()}
        <Button onclick={() => (mdMode = null)}>Abbrechen</Button>
        <Button variant="primary" onclick={applyMarkdown} disabled={!mdInput.trim()}>
            {mdMode === "add" ? "Hinzufügen" : "Ersetzen"}
        </Button>
    {/snippet}
</Dialog>

<!-- Markdown export dialog: readonly multi-line preview + copy / save / close -->
<Dialog title="Markdown exportieren" open={exportOpen} onclose={() => (exportOpen = false)}>
    <p class="md-hint">Der komplette Stapel als Markdown – kopieren oder als Datei speichern.</p>
    <textarea
        class="md-input export-input"
        rows="12"
        readonly
        bind:value={exportText}
        spellcheck="false"
        aria-label="Markdown-Vorschau"></textarea>
    {#snippet footer()}
        <Button onclick={copyMarkdown}>Kopieren</Button>
        <Button variant="primary" onclick={downloadMarkdown} title="Als .md-Datei speichern">
            Speichern
        </Button>
        <Button variant="secondary" onclick={() => (exportOpen = false)}>Schließen</Button>
    {/snippet}
</Dialog>

<!-- Title (H1 in the markdown) -->
<div class="field">
    <label class="field-label" for="deck-editor-title">Titel</label>
    <input id="deck-editor-title" type="text" bind:value={title} placeholder="z. B. Lektion 22" />
</div>

<!-- Card table -->
<section class="cards-section" aria-label="Karten bearbeiten">
    {#if cards.length === 0}
        <p class="empty">Keine Karten vorhanden.</p>
    {:else}
        <div class="cards-table" role="table" aria-label="Karten">
            <div class="cards-row cards-head" role="row">
                <span class="col-check" role="columnheader">
                    <CheckBox
                        checked={allSelected}
                        onchange={() => toggleSelectAll()}
                        ariaLabel="Alle Karten auswählen"
                    />
                </span>
                <span class="col-front" role="columnheader">
                    <span class="label-desktop">Vorderseite</span>
                    <span class="label-mobile">Karten</span>
                </span>
                <span class="col-back" role="columnheader">Rückseite</span>
                <span class="col-actions" role="columnheader">
                    <span class="visually-hidden">Aktionen</span>
                </span>
            </div>
            {#each cards as card, i (card.id)}
                <EditCardRow
                    bind:card={cards[i]}
                    selected={selected.has(card.id)}
                    onToggleSelect={toggleSelected}
                    onDelete={deleteCard}
                />
            {/each}
            <div class="cards-row add-row" role="row">
                <span class="add-cell" role="cell">
                    <button type="button" class="add-card-btn" onclick={addCard}>
                        + Karte hinzufügen
                    </button>
                </span>
            </div>
        </div>
    {/if}

    <div class="table-actions">
        {#if selected.size > 0}
            <Button variant="danger" onclick={deleteSelected}>
                {selected.size}
                {selected.size === 1 ? "Karte löschen" : "Karten löschen"}
            </Button>
        {/if}
    </div>
</section>

{#if skippedCount > 0}
    <p class="note">
        {skippedCount}
        {skippedCount === 1
            ? "Karte ohne Vorder- oder Rückseite wird nicht gespeichert."
            : "Karten ohne Vorder- oder Rückseite werden nicht gespeichert."}
    </p>
{/if}

<p class="note">
    Erlaubte Formatierung: <code>`code`</code>, <code>**fett**</code>,
    <code>*kursiv*</code>, <code>++unterstrichen++</code>,
    <code>~~durchgestrichen~~</code>, <code>==markiert==</code>,
    <code>^hochgestellt^</code>, <code>~tiefgestellt~</code> – Text markieren, um ihn zu umbrechen;
    ein Markierung anklicken, um sie zu entfernen. Eckige Klammern (z. B. <code>[Liebe]</code>)
    kennzeichnen eine Merkhilfe – im Pur-Modus wird sie ausgeblendet. Pro Karte außerdem:
    <code>::</code>
    für einen Kontext (Beispielsatz unter der Antwort), <code>#tag</code> für Tags, optional ein
    Bild (<code>![alt](https://…)</code>, vor dem Mond, auf beiden Seiten der Karte – nur
    https://-Adressen, maximal eines pro Karte) und ein trailing <code>*</code> (Mond), der die Karte
    aus jeder Lernrunde ausblendet.
</p>

<style lang="postcss">
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;

        margin-bottom: 1.25rem;

        & input {
            font: inherit;

            padding: 0.5rem 0.65rem;

            border: 1px solid var(--border);
            border-radius: var(--radius-md);

            background: var(--surface);
            color: var(--text);
        }
    }

    .field-label {
        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .field input:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .cards-section {
        margin-bottom: 1.5rem;
    }

    .empty {
        margin: 0;
        padding: 1.5rem;

        color: var(--text-muted);
        font-size: var(--fs-4);
        text-align: center;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .cards-table {
        display: flex;
        flex-direction: column;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    /* Head and add rows share the row grid with the card rows
       (EditCardRow owns the card-row variant). */
    .cards-head,
    .add-row {
        display: grid;
        grid-template-columns: 2.2rem 1fr 1fr 2.2rem;
        align-items: center;
        gap: 0.5rem;

        padding: 0.4rem 0.75rem;
    }

    .cards-head {
        background: var(--surface-soft);

        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .note code {
        padding: 0.05em 0.3em;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: var(--surface-soft);

        font-family: var(--family-mono);
        font-size: 0.85em;
    }

    /* The add-card row spans the full table width with a slim,
       dashed-border button. */
    .add-row {
        grid-template-columns: 1fr;
        border-top: 1px solid var(--border);
    }

    .add-cell {
        display: flex;
    }

    .add-card-btn {
        flex: 1;

        padding: 0.4rem 0.75rem;

        border: 1px dashed var(--border-strong);
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text-muted);

        font: inherit;
        font-size: var(--fs-3);
        font-weight: 500;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            color var(--transition-fast),
            background var(--transition-fast);

        &:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: var(--surface-soft);
        }

        &:focus-visible {
            outline: 2px solid var(--focus-ring);
            outline-offset: 2px;
        }
    }

    .table-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 0.9rem;
    }

    .note {
        margin: 0.75rem 0;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    .md-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        width: 100%;
        margin: 1rem 0rem;

        & :global(.md-btn) {
            flex: 1;
            min-width: 0;
        }
    }

    .md-hint {
        margin: 0 0 0.6rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    .md-input {
        font: inherit;
        font-size: var(--fs-3);
        width: 100%;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        resize: vertical;

        &:focus {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
        }
    }

    /* Readonly export preview: monospace, no wrapping so lines stay
       intact (multi-line card sides included). */
    .export-input {
        font-family: var(--family-mono);
        font-size: var(--fs-2);
        white-space: pre;
        overflow: auto;

        background: var(--surface-soft);
        cursor: default;
    }

    .md-errors {
        margin: 0.5rem 0 0;
        padding-left: 1.1rem;

        color: var(--danger-text);
        font-size: var(--fs-3);
        line-height: 1.6;
    }

    .visually-hidden {
        position: absolute;

        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;

        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;

        border: 0;
    }

    .label-mobile {
        display: none;
    }

    @media (max-width: 700px) {
        .add-row {
            grid-template-columns: 1fr;
            grid-template-areas: none;
        }

        .cards-head {
            grid-template-columns: 2rem 1fr 2rem;
            grid-template-areas: "check front actions";

            & .col-back {
                display: none;
            }
        }

        .label-desktop {
            display: none;
        }

        .label-mobile {
            display: inline;
        }

        .col-check {
            grid-area: check;
        }

        .col-front {
            grid-area: front;
        }

        .col-back {
            grid-area: back;
        }

        .col-actions {
            grid-area: actions;
        }

        .md-buttons {
            flex-direction: column;
        }
    }
</style>
