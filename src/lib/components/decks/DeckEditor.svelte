<script module lang="ts">
    export interface EditCard {
        id: number;
        front: string;
        back: string;
    }

    /** Serializes the editor state to the deck markdown format. */
    export function serializeDeckMarkdown(
        title: string,
        cards: { front: string; back: string }[],
        fallbackName: string,
    ): string {
        const lines = [`# ${title.trim() || fallbackName}`, ""];
        for (const card of cards) {
            if (card.front.trim() && card.back.trim()) {
                lines.push(`${card.front.trim()} - ${card.back.trim()}`);
            }
        }
        return lines.join("\n") + "\n";
    }
</script>

<script lang="ts">
    import { parseDeck } from "#lib/utils/parser";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import CheckBox from "#lib/components/shared/ui/CheckBox.svelte";
    import Dialog from "#lib/components/shared/ui/Dialog.svelte";

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

    // Keep nextId ahead of all card ids (cards may be set externally).
    $effect(() => {
        let max = -1;
        for (const c of cards) if (c.id > max) max = c.id;
        if (max >= nextId) nextId = max + 1;
    });

    const allSelected = $derived(
        cards.length > 0 && selected.size === cards.length,
    );

    const validCount = $derived(
        cards.filter((c) => c.front.trim() && c.back.trim()).length,
    );

    const skippedCount = $derived(cards.length - validCount);

    function addCard(): void {
        cards = [...cards, { id: nextId++, front: "", back: "" }];
    }

    function deleteCard(id: number): void {
        cards = cards.filter((c) => c.id !== id);
        const next = new Set(selected);
        next.delete(id);
        selected = next;
    }

    function toggleSelected(id: number): void {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        selected = next;
    }

    function toggleSelectAll(): void {
        if (allSelected) {
            selected = new Set();
        } else {
            selected = new Set(cards.map((c) => c.id));
        }
    }

    function deleteSelected(): void {
        cards = cards.filter((c) => !selected.has(c.id));
        selected = new Set();
    }

    function exportMarkdown(): void {
        const raw = serializeDeckMarkdown(title, cards, defaultFileName);
        const blob = new Blob([raw], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${defaultFileName}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function openMdMode(mode: "add" | "replace"): void {
        mdMode = mode;
        mdInput = "";
        mdErrors = [];
    }

    function applyMarkdown(): void {
        const parsed = parseDeck(mdInput);
        mdErrors = parsed.errors;
        if (parsed.cards.length === 0) {
            mdErrors = [
                ...parsed.errors,
                "Keine gültigen Karten in der Eingabe gefunden.",
            ];
            return;
        }
        const newCards: EditCard[] = [];
        for (const c of parsed.cards) {
            newCards.push({ id: nextId++, front: c.front, back: c.back });
        }
        if (mdMode === "replace") {
            cards = newCards;
            selected = new Set();
            if (parsed.title) title = parsed.title;
        } else {
            cards = [...cards, ...newCards];
        }
        mdMode = null;
        mdInput = "";
        mdErrors = [];
    }
</script>

<!-- Title (H1 in the markdown) -->
<div class="field">
    <label class="field-label" for="deck-editor-title">Titel</label>
    <input
        id="deck-editor-title"
        type="text"
        bind:value={title}
        placeholder="z. B. Lektion 22"
    />
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
            {#each cards as card (card.id)}
                <div class="cards-row" role="row">
                    <span class="col-check" role="cell">
                        <CheckBox
                            checked={selected.has(card.id)}
                            onchange={() => toggleSelected(card.id)}
                            ariaLabel="Karte auswählen"
                        />
                    </span>
                    <span class="col-front" role="cell">
                        <input
                            type="text"
                            bind:value={card.front}
                            placeholder="Vorderseite"
                            aria-label="Vorderseite"
                        />
                    </span>
                    <span class="col-back" role="cell">
                        <input
                            type="text"
                            bind:value={card.back}
                            placeholder="Rückseite"
                            aria-label="Rückseite"
                        />
                    </span>
                    <span class="col-actions" role="cell">
                        <button
                            type="button"
                            class="row-delete"
                            onclick={() => deleteCard(card.id)}
                            aria-label="Karte löschen"
                            title="Karte löschen"
                        >
                            ×
                        </button>
                    </span>
                </div>
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

<!-- Markdown bulk actions -->
<div class="md-buttons">
    <Button variant="secondary" onclick={exportMarkdown}>
        Als Markdown exportieren
    </Button>
    <Button variant="secondary" onclick={() => openMdMode("add")}>
        Karten aus Markdown hinzufügen
    </Button>
    <Button variant="secondary" onclick={() => openMdMode("replace")}>
        Karten durch Markdown ersetzen
    </Button>
</div>

<Dialog
    title={mdMode === "add"
        ? "Karten aus Markdown hinzufügen"
        : "Karten durch Markdown ersetzen"}
    open={mdMode !== null}
    onclose={() => (mdMode = null)}
>
    <p class="md-hint">
        {#if mdMode === "add"}
            Karten aus dem eingefügten Markdown werden an die
            bestehenden Karten angehängt.
        {:else}
            <strong>Achtung:</strong> Alle bisherigen Karten werden durch
            den eingefügten Markdown ersetzt.
        {/if}
    </p>
    <textarea
        class="md-input"
        rows="6"
        bind:value={mdInput}
        placeholder="# Titel
amo - ich liebe
amas - du liebst"
        spellcheck="false"></textarea>
    {#if mdErrors.length > 0}
        <ul class="md-errors">
            {#each mdErrors as err}
                <li>{err}</li>
            {/each}
        </ul>
    {/if}
    {#snippet footer()}
        <Button onclick={() => (mdMode = null)}>Abbrechen</Button>
        <Button
            variant="primary"
            onclick={applyMarkdown}
            disabled={!mdInput.trim()}
        >
            {mdMode === "add" ? "Hinzufügen" : "Ersetzen"}
        </Button>
    {/snippet}
</Dialog>

<style>
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;

        margin-bottom: 1.25rem;
    }

    .field-label {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .field input {
        font: inherit;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
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
        font-size: 0.9rem;
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

    .cards-row {
        display: grid;
        grid-template-columns: 2.2rem 1fr 1fr 2.2rem;
        align-items: center;
        gap: 0.5rem;

        padding: 0.4rem 0.75rem;
    }

    .cards-row + .cards-row {
        border-top: 1px solid var(--border);
    }

    .cards-head {
        background: var(--surface-soft);

        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .col-check {
        display: flex;
        justify-content: center;
    }

    .col-front input,
    .col-back input {
        font: inherit;
        width: 100%;

        padding: 0.4rem 0.55rem;

        border: 1px solid transparent;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text);
    }

    .col-front input:focus,
    .col-back input:focus {
        border-color: var(--border);
        background: var(--surface);
        outline: 2px solid var(--focus-ring);
    }

    .col-front input:hover,
    .col-back input:hover {
        border-color: var(--border);
    }

    .row-delete {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 1.8rem;
        height: 1.8rem;
        margin: 0 auto;

        border: 0;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text-muted);

        font-size: 1.1rem;
        line-height: 1;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .row-delete:hover {
        background: var(--danger-bg);
        color: var(--danger-text);
    }

    /* The add-card row spans the full table width with a slim,
       dashed-border button. */
    .add-row {
        grid-template-columns: 1fr;
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
        font-size: 0.8rem;
        font-weight: 500;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            color var(--transition-fast),
            background var(--transition-fast);
    }

    .add-card-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--surface-soft);
    }

    .add-card-btn:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
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
        font-size: 0.85rem;
        line-height: 1.6;
    }

    .md-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .md-hint {
        margin: 0 0 0.6rem;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    .md-input {
        font: inherit;
        font-size: 0.8rem;
        width: 100%;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        resize: vertical;
    }

    .md-input:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .md-errors {
        margin: 0.5rem 0 0;
        padding-left: 1.1rem;

        color: var(--danger-text);
        font-size: 0.8rem;
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
        .cards-row {
            grid-template-columns: 2rem 1fr 2rem;
            grid-template-areas:
                "check front actions"
                "check back actions";
            row-gap: 0.3rem;
        }

        .add-row {
            grid-template-columns: 1fr;
            grid-template-areas: none;
        }

        .cards-head {
            grid-template-columns: 2rem 1fr 2rem;
            grid-template-areas: "check front actions";
        }

        .cards-head .col-back {
            display: none;
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
    }
</style>
