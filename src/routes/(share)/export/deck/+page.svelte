<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { DECK_TYPES } from "#lib/decks/deckTypes";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { countCards } from "#lib/utils/pure";
    import {
        canNativeShare,
        encodeDeckShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import PageHeader from "#lib/components/shared/PageHeader.svelte";
    import EmptyNote from "#lib/components/shared/EmptyNote.svelte";
    import ShareLinkCard from "#lib/components/shared/ShareLinkCard.svelte";
    import Button from "#lib/components/shared/Button.svelte";

    const decks = $derived(
        Object.values(userDecks.decks).sort((a, b) =>
            a.name.localeCompare(b.name),
        ),
    );

    let selectedSlug = $state("");
    let deckUrl = $state("");
    let shareLength = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);

    const selectedDeck = $derived(
        selectedSlug ? userDecks.get(selectedSlug) : undefined,
    );

    // Preselect a deck passed via ?slug= (e.g. from the deck page).
    onMount(() => {
        canShare = canNativeShare();
        const slug = page.url.searchParams.get("slug");
        if (slug && userDecks.get(slug)) selectedSlug = slug;
    });

    // (Re)build the link whenever the selected deck changes.
    $effect(() => {
        const slug = selectedSlug;
        const deck = slug ? userDecks.get(slug) : undefined;
        if (!deck) {
            deckUrl = "";
            shareLength = 0;
            return;
        }
        encodeDeckShare(deck.raw, deck.deckType).then((payload) => {
            // Ignore stale results when the selection changed meanwhile.
            if (slug !== selectedSlug) return;
            deckUrl = `${window.location.origin}/#${payload}`;
            shareLength = deckUrl.length;
        });
    });

    async function share(): Promise<void> {
        if (!deckUrl || !selectedDeck) return;
        nativeShareFailed = false;
        const ok = await nativeShare({
            title: selectedDeck.name,
            text: "NSC Stapel:",
            url: deckUrl,
        });
        if (!ok) nativeShareFailed = true;
    }
</script>

<svelte:head>
    <title>Stapel exportieren – NSC</title>
</svelte:head>

<PageHeader
    title="Stapel exportieren"
    subtitle="Erstelle einen Link für einen Stapel — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
/>

{#if decks.length === 0}
    <EmptyNote>
        Keine Stapel vorhanden.
        <a href={resolve("/upload")}>Lade zuerst einen Stapel hoch</a>.
    </EmptyNote>
{:else}
    <section class="panel">
        <label class="field-label" for="export-deck-select">Stapel</label>
        <select id="export-deck-select" bind:value={selectedSlug}>
            <option value="" disabled>Stapel wählen …</option>
            {#each decks as deck (deck.slug)}
                <option value={deck.slug}>{deck.folder} / {deck.name}</option>
            {/each}
        </select>
        {#if selectedDeck}
            <p class="deck-meta">
                {countCards(
                    userDecks.load(selectedDeck.slug)?.cards.length ?? 0,
                )}
                · {DECK_TYPES[selectedDeck.deckType].label}
            </p>
        {/if}
    </section>

    {#if deckUrl && selectedDeck}
        <ShareLinkCard
            title="Stapel-Link"
            url={deckUrl}
            warning={shareLength > SHARE_HASH_LIMIT}
            warningText="Der Link ist etwa {formatShareLength(
                shareLength,
            )} lang — Links über ~1 MB funktionieren nicht zuverlässig."
        />
        <div class="actions">
            {#if canShare}
                <Button variant="primary" onclick={share}>Teilen …</Button>
            {/if}
        </div>
        {#if nativeShareFailed}
            <p class="note">Teilen wird von diesem Gerät nicht unterstützt.</p>
        {/if}
    {/if}
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

    select {
        font: inherit;
        width: 100%;
        max-width: 26rem;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    select:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .deck-meta {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: 0.85rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-bottom: 1rem;
    }

    .note {
        margin: 0;

        color: var(--danger-text);
        font-size: 0.85rem;
    }
</style>
