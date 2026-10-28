<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { DECK_TYPE_OPTIONS } from "#lib/utils/deckTypes";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { applyPendingProgressFor } from "#lib/utils/pendingProgress";
    import { parseDeck } from "#lib/utils/parser";
    import { readDraftDeck } from "#lib/utils/draftDeck";
    import type { DeckType } from "#lib/types";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import DeckEditor, {
        serializeDeckMarkdown,
        type EditCard,
    } from "#lib/components/decks/DeckEditor.svelte";

    let title = $state("");
    let cards = $state<EditCard[]>([{ id: 0, front: "", back: "" }]);
    let name = $state("");
    let folder = $state("Eigene");
    let deckType = $state<DeckType>("latin");
    let busy = $state(false);
    let saveError = $state<string | null>(null);

    // Pre-fill the editor when arriving from the upload or import page
    // with a stashed draft.
    onMount(() => {
        const draft = readDraftDeck();
        if (!draft) return;
        const parsed = parseDeck(draft.raw, draft.deckType);
        title = draft.title ?? draft.name;
        name = draft.name;
        deckType = draft.deckType;
        if (parsed.cards.length > 0) {
            cards = parsed.cards.map((c, i) => ({
                id: i,
                front: c.front,
                back: c.back,
            }));
        }
    });

    async function save(): Promise<void> {
        saveError = null;
        if (!name.trim()) {
            saveError = "Bitte gib einen Namen für den Stapel ein.";
            return;
        }
        const valid = cards.filter((c) => c.front.trim() && c.back.trim());
        if (valid.length === 0) {
            saveError =
                "Der Stapel braucht mindestens eine Karte mit Vorder- und Rückseite.";
            return;
        }
        busy = true;
        try {
            const raw = serializeDeckMarkdown(title, cards, name);
            const { deck } = await decks.add(raw, folder, name, deckType);
            // A progress link shared before this deck may target it.
            await applyPendingProgressFor(deck.contentHash);
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } catch {
            saveError = "Der Stapel konnte nicht erstellt werden.";
            busy = false;
        }
    }
</script>

<svelte:head>
    <title>Stapel erstellen – NSC</title>
</svelte:head>

<PageHeader
    title="Stapel erstellen"
    subtitle="Erstelle einen neuen Stapel Karte für Karte — oder füge Karten per Markdown ein."
    compact
/>

<!-- Deck metadata -->
<Card padding="lg" class="meta-section" aria-label="Stapel-Details">
    <div class="field-row">
        <TextInput
            label="Ordner"
            id="create-folder"
            bind:value={folder}
        />
        <TextInput
            label="Name"
            id="create-name"
            bind:value={name}
            placeholder="z. B. Lektion 22"
        />
        <div class="select-field">
            <label class="field-label" for="create-type">Typ</label>
            <select
                id="create-type"
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
</Card>

<DeckEditor
    bind:title
    bind:cards
    defaultFileName={name.trim() || "stapel"}
/>

<div class="save-actions">
    <Button variant="primary" onclick={save} disabled={busy}>
        {busy ? "Wird erstellt …" : "Stapel erstellen"}
    </Button>
    <Button href={resolve("/")}>Abbrechen</Button>
</div>
{#if saveError}
    <p class="note-error">{saveError}</p>
{/if}

<style>
    .meta-section {
        margin-bottom: 1.25rem;
    }

    .meta-section :global(.card-body) {
        display: flex;
        flex-direction: column;
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

    .field-label {
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
    }

    .select-field select {
        width: 100%;
        min-height: 2.65rem;
        padding: 0.55rem 0.8rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font: inherit;
        font-size: 0.9rem;
    }

    .select-field select:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .save-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 0.5rem;
    }

    .note-error {
        margin: 0.75rem 0;

        color: var(--danger-text);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    @media (max-width: 540px) {
        .field-row {
            flex-direction: column;
        }
    }
</style>
