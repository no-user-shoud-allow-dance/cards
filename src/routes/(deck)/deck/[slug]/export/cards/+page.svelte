<script lang="ts">
    import { onMount } from "svelte";
    import { DECK_TYPES } from "#lib/decks/utils/deckTypes";
    import { userDecks } from "#lib/decks/store/userDecks.svelte";
    import { countCards } from "#lib/utils/pure";
    import {
        canNativeShare,
        encodeDeckShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/sharing/utils/share";
    import Page from "#lib/app/components/shared/Page.svelte";
    import PageHeader from "#lib/app/components/shared/PageHeader.svelte";
    import DeckNotFound from "#lib/decks/components/DeckNotFound.svelte";
    import ShareLinkCard from "#lib/sharing/components/ShareLinkCard.svelte";
    import Button from "#lib/app/components/shared/Button.svelte";

    let { data } = $props();

    const deck = $derived(userDecks.get(data.slug));
    const loaded = $derived(deck ? userDecks.load(deck.slug) : null);

    let deckUrl = $state("");
    let shareLength = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);

    onMount(() => {
        canShare = canNativeShare();
    });

    // (Re)build the link whenever the deck changes.
    $effect(() => {
        const current = deck;
        if (!current) {
            deckUrl = "";
            shareLength = 0;
            return;
        }
        const slug = current.slug;
        encodeDeckShare(current.raw, current.deckType).then((payload) => {
            // Ignore stale results when the deck changed meanwhile.
            if (slug !== data.slug) return;
            const url = `${window.location.origin}/#${payload}`;
            deckUrl = url;
            shareLength = url.length;
        });
    });

    async function share(): Promise<void> {
        if (!deckUrl || !deck) return;
        nativeShareFailed = false;
        const ok = await nativeShare({
            title: deck.name,
            text: "NSC Stapel:",
            url: deckUrl,
        });
        if (!ok) nativeShareFailed = true;
    }
</script>

<svelte:head>
    <title>Stapel exportieren – NSC</title>
</svelte:head>

{#if !deck}
    <DeckNotFound />
{:else}
    <Page>
        <PageHeader
            title="Stapel exportieren"
            subtitle="{deck.folder} / {deck.name} — Erstelle einen Link mit den Karten dieses Stapels — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
        />
        <p class="deck-meta">
            {countCards(loaded?.cards.length ?? 0)}
            · {DECK_TYPES[deck.deckType].label}
        </p>
        {#if deckUrl}
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
                <p class="note">
                    Teilen wird von diesem Gerät nicht unterstützt.
                </p>
            {/if}
        {/if}
    </Page>
{/if}

<style>
    .deck-meta {
        margin: 0 0 1.25rem;

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
