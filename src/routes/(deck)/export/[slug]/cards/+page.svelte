<script lang="ts">
    import { onMount } from "svelte";
    import { DECK_TYPES } from "#lib/utils/deckTypes";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { countCards } from "#lib/utils/pure";
    import {
        canNativeShare,
        encodeDeckShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";
    import type { Deck } from "#lib/types";
    import ShareLinkCard from "#lib/components/sharing/ShareLinkCard.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    const deck = $derived(decks.get(data.slug) as Deck);
    const loaded = $derived(decks.load(deck.slug));

    let deckUrl = $state("");
    let shareLength = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);

    onMount(() => {
        canShare = canNativeShare();
    });

    // (Re)build the link whenever the deck changes.
    $effect(() => {
        const slug = deck.slug;
        encodeDeckShare(deck.raw, deck.deckType).then((payload) => {
            // Ignore stale results when the deck changed meanwhile.
            if (slug !== data.slug) return;
            const url = `${window.location.origin}/#${payload}`;
            deckUrl = url;
            shareLength = url.length;
        });
    });

    async function share(): Promise<void> {
        if (!deckUrl) return;
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

<Page>
    <PageHeader
        title="Stapel exportieren"
        subtitle="{deck.folder} / {deck.name} — Erstelle einen Link mit den Karten dieses Stapels — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
    />
    <p class="deck-meta">
        <Badge>{countCards(loaded?.cards.length ?? 0)}</Badge>
        <Badge variant="info">{DECK_TYPES[deck.deckType].label}</Badge>
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

<style>
    .deck-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        margin: 0 0 1.25rem;
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
