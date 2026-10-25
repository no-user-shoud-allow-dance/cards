<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { DECK_TYPE_OPTIONS } from "#lib/decks/deckTypes";
    import { parseDeck } from "#lib/decks/parser";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { hashDeckContent } from "#lib/utils/hash";
    import { applyPendingProgressFor } from "#lib/utils/pendingProgress";
    import { countCards } from "#lib/utils/pure";
    import {
        DECK_PREFIX,
        decodeDeckShare,
        extractShareHash,
        LEGACY_DECK_PREFIX,
        PROGRESS_PREFIX,
    } from "#lib/utils/share";
    import type { DeckType, UserDeck } from "#lib/utils/types";
    import PageHeader from "#lib/components/shared/PageHeader.svelte";
    import Button from "#lib/components/shared/Button.svelte";

    interface DeckPreview {
        raw: string;
        title: string | null;
        cardCount: number;
        errorCount: number;
        deckType: DeckType;
        contentHash: string;
    }

    let linkInput = $state("");
    let preview = $state<DeckPreview | null>(null);
    let existing = $state<UserDeck | null>(null);
    let error = $state<string | null>(null);
    let busy = $state(false);

    onMount(() => {
        // Prefill when the page is opened with a share-link hash.
        const hash = window.location.hash;
        if (
            hash.startsWith(`#${DECK_PREFIX}`) ||
            hash.startsWith(`#${LEGACY_DECK_PREFIX}`)
        ) {
            linkInput = hash;
        }
    });

    // The content hash covers raw + deck type, so it follows the type
    // selection; the "already stored" check follows it as well.
    $effect(() => {
        const p = preview;
        if (!p) {
            existing = null;
            return;
        }
        void (async () => {
            p.contentHash = await hashDeckContent(p.raw, p.deckType);
            existing = (await userDecks.findByHash(p.contentHash)) ?? null;
        })();
    });

    async function showPreview(): Promise<void> {
        error = null;
        preview = null;
        existing = null;
        // Accepts a full URL, a bare hash, or the payload alone.
        const input = extractShareHash(linkInput);
        if (!input) {
            error = "Bitte füge einen Link ein.";
            return;
        }
        const payload = await decodeDeckShare(input);
        if (!payload) {
            error = input.startsWith(PROGRESS_PREFIX)
                ? "Das ist ein Fortschritt-Link — bitte nutze „Fortschritt importieren“."
                : "Der Link ist ungültig oder beschädigt.";
            return;
        }
        const parsed = parseDeck(payload.raw);
        preview = {
            raw: payload.raw,
            title: parsed.title,
            cardCount: parsed.cards.length,
            errorCount: parsed.errors.length,
            deckType: payload.deckType,
            contentHash: "",
        };
    }

    async function importDeck(): Promise<void> {
        if (!preview) return;
        busy = true;
        try {
            const { deck } = await userDecks.add(
                preview.raw,
                preview.title ?? "Geteilter Stapel",
                "Geteilt",
                preview.deckType,
            );
            // A progress link shared before this deck: apply it now.
            await applyPendingProgressFor(deck.contentHash);
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } finally {
            busy = false;
        }
    }

    function reset(): void {
        linkInput = "";
        preview = null;
        existing = null;
        error = null;
    }
</script>

<svelte:head>
    <title>Stapel importieren – NSC</title>
</svelte:head>

<PageHeader
    title="Stapel importieren"
    subtitle="Füge einen geteilten Stapel-Link ein, prüfe die Vorschau und importiere den Stapel."
/>

<section class="panel">
    <label class="field-label" for="import-deck-link">Link</label>
    <textarea
        id="import-deck-link"
        rows="3"
        bind:value={linkInput}
        placeholder="https://…/#c.…"
        spellcheck="false"
    ></textarea>
    <div class="actions">
        <Button variant="primary" onclick={showPreview}>
            Vorschau anzeigen
        </Button>
        {#if preview || error}
            <Button onclick={reset}>Zurücksetzen</Button>
        {/if}
    </div>
    {#if error}
        <p class="note note-error">{error}</p>
    {/if}
</section>

{#if preview}
    <section class="panel">
        <h2 class="panel-title">{preview.title ?? "Geteilter Stapel"}</h2>
        <p class="preview-meta">
            {countCards(preview.cardCount)}
            {#if preview.errorCount > 0}
                · {preview.errorCount} Fehler beim Parsen
            {/if}
        </p>
        <label class="field-label" for="import-deck-type">Typ</label>
        <select id="import-deck-type" bind:value={preview.deckType}>
            {#each DECK_TYPE_OPTIONS as [value, config]}
                <option value={value}>{config.label}</option>
            {/each}
        </select>

        {#if existing}
            <p class="note">
                Dieser Stapel existiert bereits als „{existing.name}“.
                <a
                    href="{resolve("/(deck)/deck/[slug]", {
                        slug: existing.slug,
                    })}">Stapel öffnen</a
                >
            </p>
        {:else}
            <div class="actions">
                <Button
                    variant="primary"
                    onclick={importDeck}
                    disabled={busy}
                >
                    {busy ? "Wird importiert …" : "Importieren"}
                </Button>
            </div>
        {/if}
    </section>
{/if}

<style>
    .panel {
        margin-bottom: 1.5rem;
        padding: 1.1rem 1.25rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .field-label {
        display: block;

        margin-bottom: 0.3rem;

        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    textarea,
    select {
        font: inherit;
        width: 100%;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    textarea {
        resize: vertical;
        font-size: 0.8rem;
    }

    textarea:focus,
    select:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .panel-title {
        margin: 0 0 0.3rem;

        font-size: 1.15rem;
        font-weight: 600;
    }

    .preview-meta {
        margin: 0 0 1rem;

        color: var(--text-muted);
        font-size: 0.85rem;
    }

    select {
        max-width: 26rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-top: 1rem;
    }

    .note {
        margin: 1rem 0 0;

        font-size: 0.85rem;
        line-height: 1.6;
    }

    .note-error {
        color: var(--danger-text);
    }

    .note a {
        color: var(--primary);
        text-decoration: none;
    }

    .note a:hover {
        text-decoration: underline;
    }
</style>
