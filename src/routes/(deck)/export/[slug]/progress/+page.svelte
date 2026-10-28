<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import {
        canNativeShare,
        encodeProgressShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import type { Deck } from "#lib/types";
    import ShareLinkCard from "#lib/components/sharing/ShareLinkCard.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    const deck = $derived(decks.get(data.slug) as Deck);

    let progressUrl = $state("");
    let shareLength = $state(0);
    let learnedCount = $state(0);
    let overviewDone = $state(false);
    let studyTimeMs = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);

    onMount(() => {
        canShare = canNativeShare();
        // The progress link reads the card states and study time; make
        // sure both stores are loaded (the root layout only inits some).
        cardStore.init();
        studyTimeStore.init();
    });

    // (Re)build the progress link whenever the deck changes.
    $effect(() => {
        const slug = deck.slug;
        const loaded = decks.load(slug);
        // One box per card index; 0 = untouched (keeps the link short).
        const boxes = loaded
            ? loaded.cards.map((card) => cardStore.states[card.id]?.box ?? 0)
            : [];
        const overview = cardStore.isOverviewDone(slug);
        const studyTime = studyTimeStore.get(slug);
        encodeProgressShare(deck.contentHash, boxes, {
            overviewDone: overview,
            studyTimeMs: studyTime,
        }).then((payload) => {
            // Ignore stale results when the deck changed meanwhile.
            if (slug !== data.slug) return;
            const url = `${window.location.origin}/#${payload}`;
            progressUrl = url;
            shareLength = url.length;
            learnedCount = boxes.filter((box) => box > 0).length;
            overviewDone = overview;
            studyTimeMs = studyTime;
        });
    });

    async function share(): Promise<void> {
        if (!progressUrl) return;
        nativeShareFailed = false;
        const ok = await nativeShare({
            title: `${deck.name} – Fortschritt`,
            text: "NSC Fortschritt:",
            url: progressUrl,
        });
        if (!ok) nativeShareFailed = true;
    }
</script>

<svelte:head>
    <title>Fortschritt exportieren – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Fortschritt exportieren"
        subtitle="{deck.folder} / {deck.name} — Erstelle einen Link mit dem Lernfortschritt dieses Stapels — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
    />
    {#if progressUrl}
        <p class="summary">
            Enthalten: {learnedCount}
            {learnedCount === 1 ? "Karte" : "Karten"} mit Fortschritt
            {#if overviewDone}
                · Übersicht abgeschlossen
            {/if}
            {#if studyTimeMs > 0}
                · Lernzeit {formatStudyTime(studyTimeMs)}
            {/if}
        </p>
        {#if learnedCount === 0 && !overviewDone && studyTimeMs === 0}
            <p class="note note-info">
                Dieser Stapel hat noch keinen Fortschritt — der Link
                enthält keine Änderungen.
            </p>
        {:else}
            <p class="note note-info">
                Der Link wird auf dem anderen Gerät angewendet, sobald der
                Stapel dort vorhanden ist — exportiere ihn gegebenenfalls
                über
                <a
                    href={resolve("/(deck)/export/[slug]/cards", {
                        slug: deck.slug,
                    })}>Stapel exportieren</a
                >.
            </p>
        {/if}

        <ShareLinkCard
            title="Fortschritt-Link"
            url={progressUrl}
            copyLabel="Fortschritt-Link kopieren"
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
    .summary {
        margin: 0 0 0.5rem;

        font-size: 0.9rem;
        font-weight: 600;
    }

    .note {
        margin: 0 0 1.25rem;

        font-size: 0.85rem;
        line-height: 1.6;
    }

    .note-info {
        color: var(--text-muted);
    }

    .note a {
        color: var(--primary);
        text-decoration: none;
    }

    .note a:hover {
        text-decoration: underline;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-bottom: 1rem;
    }
</style>
