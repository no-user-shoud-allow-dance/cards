<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { cardStore } from "#lib/store/store.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import {
        canNativeShare,
        encodeProgressShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
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
    let progressUrl = $state("");
    let shareLength = $state(0);
    let learnedCount = $state(0);
    let overviewDone = $state(false);
    let studyTimeMs = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);

    const selectedDeck = $derived(
        selectedSlug ? userDecks.get(selectedSlug) : undefined,
    );

    // Preselect a deck passed via ?slug= (e.g. from the deck page).
    onMount(() => {
        canShare = canNativeShare();
        // The progress link reads the card states and study time; make
        // sure both stores are loaded (the root layout only inits some).
        cardStore.init();
        studyTimeStore.init();
        const slug = page.url.searchParams.get("slug");
        if (slug && userDecks.get(slug)) selectedSlug = slug;
    });

    // (Re)build the progress link whenever the selected deck changes.
    $effect(() => {
        const slug = selectedSlug;
        const deck = slug ? userDecks.get(slug) : undefined;
        if (!deck) {
            progressUrl = "";
            shareLength = 0;
            learnedCount = 0;
            overviewDone = false;
            studyTimeMs = 0;
            return;
        }
        const loaded = userDecks.load(slug);
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
            // Ignore stale results when the selection changed meanwhile.
            if (slug !== selectedSlug) return;
            progressUrl = `${window.location.origin}/#${payload}`;
            shareLength = progressUrl.length;
            learnedCount = boxes.filter((box) => box > 0).length;
            overviewDone = overview;
            studyTimeMs = studyTime;
        });
    });

    async function share(): Promise<void> {
        if (!progressUrl || !selectedDeck) return;
        nativeShareFailed = false;
        const ok = await nativeShare({
            title: `${selectedDeck.name} – Fortschritt`,
            text: "NSC Fortschritt:",
            url: progressUrl,
        });
        if (!ok) nativeShareFailed = true;
    }
</script>

<svelte:head>
    <title>Fortschritt exportieren – NSC</title>
</svelte:head>

<PageHeader
    title="Fortschritt exportieren"
    subtitle="Erstelle einen Link mit dem Lernfortschritt eines Stapels — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
/>

{#if decks.length === 0}
    <EmptyNote>
        Keine Stapel vorhanden.
        <a href={resolve("/upload")}>Lade zuerst einen Stapel hoch</a>.
    </EmptyNote>
{:else}
    <section class="panel">
        <label class="field-label" for="export-progress-select">Stapel</label>
        <select id="export-progress-select" bind:value={selectedSlug}>
            <option value="" disabled>Stapel wählen …</option>
            {#each decks as deck (deck.slug)}
                <option value={deck.slug}>{deck.folder} / {deck.name}</option>
            {/each}
        </select>
    </section>

    {#if progressUrl && selectedDeck}
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
                Dieser Stapel hat noch keinen Fortschritt — der Link enthält
                keine Änderungen.
            </p>
        {:else}
            <p class="note note-info">
                Der Link wird auf dem anderen Gerät angewendet, sobald der
                Stapel dort vorhanden ist — exportiere ihn gegebenenfalls
                über
                <a
                    href="{resolve("/(share)/export/deck")}?slug={selectedDeck.slug}"
                    >Stapel exportieren</a
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
