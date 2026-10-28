<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { DECK_TYPES } from "#lib/utils/deckTypes";
    import { countCards } from "#lib/utils/pure";
    import type { LoadedDeck } from "#lib/types";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import DeckEditor, {
        serializeDeckMarkdown,
        type EditCard,
    } from "#lib/components/decks/DeckEditor.svelte";

    let { data } = $props();
    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    let initialized = $state(false);
    let title = $state("");
    let cards = $state<EditCard[]>([]);
    let busy = $state(false);
    let saveError = $state<string | null>(null);

    // Populate the editor once the deck is loaded.
    $effect(() => {
        const d = deck;
        if (!initialized && d) {
            title = d.title ?? d.name;
            cards = d.cards.map((c, i) => ({
                id: i,
                front: c.front,
                back: c.back,
            }));
            initialized = true;
        }
    });

    async function save(): Promise<void> {
        saveError = null;
        const valid = cards.filter((c) => c.front.trim() && c.back.trim());
        if (valid.length === 0) {
            saveError =
                "Der Stapel braucht mindestens eine Karte mit Vorder- und Rückseite.";
            return;
        }
        busy = true;
        try {
            await decks.updateRaw(
                deck.slug,
                serializeDeckMarkdown(title, cards, deck.name),
            );
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } catch {
            saveError = "Der Stapel konnte nicht gespeichert werden.";
            busy = false;
        }
    }
</script>

<svelte:head>
    <title>Stapel bearbeiten – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Stapel bearbeiten"
        subtitle="{deck.folder} / {deck.name} — {countCards(cards.length)} · {DECK_TYPES[
            deck.deckType
        ].label}"
        compact
    />

    <DeckEditor bind:title bind:cards defaultFileName={deck.name} />

    <div class="save-actions">
        <Button variant="primary" onclick={save} disabled={busy}>
            {busy ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <Button href={resolve("/(deck)/deck/[slug]", { slug: deck.slug })}>
            Abbrechen
        </Button>
    </div>
    {#if saveError}
        <p class="note-error">{saveError}</p>
    {/if}
</Page>

<style>
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
</style>
