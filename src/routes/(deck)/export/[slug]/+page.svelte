<script lang="ts">
    import { onMount } from "svelte";
    import { DECK_TYPES } from "#lib/utils/deckTypes";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { countCards } from "#lib/utils/pure";
    import {
        canNativeShare,
        encodeCombinedShare,
        encodeDeckShare,
        encodeProgressShare,
        formatShareLength,
        nativeShare,
        SERVER_LINK_MIN_LENGTH,
        SHARE_HASH_LIMIT,
        SHARE_QR_LIMIT,
        type ProgressSharePayload,
    } from "#lib/utils/share";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";
    import type { Deck } from "#lib/types";
    import ShareLinkCard from "#lib/components/sharing/ShareLinkCard.svelte";
    import ServerLinkCard from "#lib/components/sharing/ServerLinkCard.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    let { data } = $props();

    type ShareMode = "progress" | "cards" | "together";

    // The (deck) layout renders this page only when the deck exists.
    const deck = $derived(decks.get(data.slug) as Deck);
    const loaded = $derived(decks.load(deck.slug));

    let mode = $state<ShareMode>("together");
    let shareUrl = $state("");
    let sharePayload = $state("");
    let shareLength = $state(0);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);
    // The user picks the channel. A link up to half of the max QR size is
    // "too small" for a server link — serverActive is the effective state,
    // so a mode change to a small link falls back to QR on its own.
    let useServerLink = $state(false);
    let serverAllowed = $derived(shareLength > SERVER_LINK_MIN_LENGTH);
    let serverActive = $derived(useServerLink && serverAllowed);

    onMount(() => {
        canShare = canNativeShare();
        // The progress modes read the card states and study time; make
        // sure both stores are loaded (the root layout only inits some).
        cardStore.init();
        studyTimeStore.init();
    });

    const modes: {
        id: ShareMode;
        label: string;
        title: string;
        copyLabel: string;
        hint: string;
        shareText: string;
    }[] = [
        {
            id: "progress",
            label: "Nur Fortschritt",
            title: "Fortschritt-Link",
            copyLabel: "Fortschritt-Link kopieren",
            hint: "Der Link enthält nur den Lernfortschritt — der Stapel muss auf dem anderen Gerät bereits vorhanden sein.",
            shareText: "NSC Fortschritt:",
        },
        {
            id: "cards",
            label: "Nur Karten",
            title: "Stapel-Link",
            copyLabel: "Link kopieren",
            hint: "Der Link enthält nur die Karten des Stapels — ohne Lernfortschritt.",
            shareText: "NSC Stapel:",
        },
        {
            id: "together",
            label: "Beides",
            title: "Stapel + Fortschritt",
            copyLabel: "Link kopieren",
            hint: "Ein Link genügt: Karten und Lernfortschritt reisen zusammen.",
            shareText: "NSC Stapel:",
        },
    ];

    const activeMode = $derived(modes.find((m) => m.id === mode) ?? modes[2]);

    // (Re)build the link whenever the mode or the deck changes.
    $effect(() => {
        const slug = data.slug;
        const current = decks.get(slug) as Deck;
        const active = mode;
        const origin = window.location.origin;
        void (async () => {
            let payload: string;
            if (active === "cards") {
                payload = await encodeDeckShare(
                    current.raw,
                    current.deckType,
                );
            } else {
                const loadedDeck = decks.load(slug);
                // One box per card index; 0 = untouched (keeps the link short).
                const boxes = loadedDeck
                    ? loadedDeck.cards.map(
                          (card) => cardStore.states[card.id]?.box ?? 0,
                      )
                    : [];
                const progress: ProgressSharePayload = {
                    hash: current.contentHash,
                    boxes,
                    overviewDone: cardStore.isOverviewDone(slug),
                    studyTimeMs: studyTimeStore.get(slug),
                };
                payload =
                    active === "progress"
                        ? await encodeProgressShare(
                              progress.hash,
                              progress.boxes,
                              {
                                  overviewDone: progress.overviewDone,
                                  studyTimeMs: progress.studyTimeMs,
                              },
                          )
                        : await encodeCombinedShare(
                              { raw: current.raw, deckType: current.deckType },
                              progress,
                          );
            }
            // Ignore stale results when the mode or deck changed meanwhile.
            if (slug !== data.slug || active !== mode) return;
            const url = `${origin}/#${payload}`;
            shareUrl = url;
            sharePayload = payload;
            shareLength = url.length;
        })();
    });

    async function share(): Promise<void> {
        if (!shareUrl) return;
        nativeShareFailed = false;
        const ok = await nativeShare({
            title: deck.name,
            text: activeMode.shareText,
            url: shareUrl,
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
        subtitle="{deck.folder} / {deck.name} — Erstelle einen Link mit den Karten, nur dem Fortschritt oder beides zusammen — als QR-Code, zum Kopieren oder über das Teilen-Menü deines Geräts."
    />

    <div class="mode-switch" role="group" aria-label="Export-Umfang">
        {#each modes as m (m.id)}
            <button
                type="button"
                class="mode-button"
                class:active={mode === m.id}
                aria-pressed={mode === m.id}
                onclick={() => {
                    mode = m.id;
                    nativeShareFailed = false;
                }}
            >
                {m.label}
            </button>
        {/each}
    </div>

    <p class="deck-meta">
        <Badge>{countCards(loaded?.cards.length ?? 0)}</Badge>
        <Badge variant="info">{DECK_TYPES[deck.deckType].label}</Badge>
    </p>

    <p class="mode-hint">{activeMode.hint}</p>

    {#if shareUrl}
        {@const qrTooBig = shareLength > SHARE_QR_LIMIT}
        <!-- The user always picks the channel. The server link is only
             offered when the link exceeds half of the max QR size — below
             that the deck is "too small" and the option is disabled. -->
        <div class="server-switch" role="group" aria-label="Teilen über">
            <button
                type="button"
                class="server-switch-button"
                class:active={!serverActive}
                aria-pressed={!serverActive}
                onclick={() => {
                    useServerLink = false;
                }}
            >
                QR-Code
            </button>
            <button
                type="button"
                class="server-switch-button"
                class:active={serverActive}
                aria-pressed={serverActive}
                disabled={!serverAllowed}
                title={!serverAllowed
                    ? "Der Link ist kleiner als die Hälfte der QR-Maximalgröße — ein Server-Link ist nur für größere Stapel nötig."
                    : undefined}
                onclick={() => {
                    useServerLink = true;
                }}
            >
                Server-Link
            </button>
        </div>
        {#if !serverAllowed}
            <p class="switch-hint">
                Der Link ist kleiner als die Hälfte der QR-Maximalgröße — ein
                Server-Link ist nur für größere Stapel nötig.
            </p>
        {/if}
        {#if serverActive}
            <ServerLinkCard payload={sharePayload} />
        {:else}
            <ShareLinkCard
                title={activeMode.title}
                url={shareUrl}
                copyLabel={activeMode.copyLabel}
                warning={shareLength > SHARE_HASH_LIMIT || qrTooBig}
                warningText={shareLength > SHARE_HASH_LIMIT
                    ? `Der Link ist etwa ${formatShareLength(
                          shareLength,
                      )} lang — Links über ~1 MB funktionieren nicht zuverlässig.`
                    : `Der Link ist zu lang für einen QR-Code — der Stapel ist zu groß zum Scannen. Bitte kopiere den Link oder nutze „Teilen …“.`}
            />
            <div class="actions">
                {#if canShare}
                    <Button variant="primary" onclick={share}>
                        Teilen …
                    </Button>
                {/if}
            </div>
            {#if nativeShareFailed}
                <p class="note">
                    Teilen wird von diesem Gerät nicht unterstützt.
                </p>
            {/if}
        {/if}
    {/if}
</Page>

<style>
    /* Segmented mode switch in the NSC-Intro look: one bordered box
       with soft segments (like the intro dropdown, but plain tabs).
       Export controls carry the "sending" color: red. */
    .mode-switch {
        display: flex;

        margin-bottom: 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .mode-button {
        flex: 1 1 0;
        min-width: 0;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-right: 1px solid var(--border);

        background: transparent;
        color: var(--danger-text);

        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .mode-button:last-child {
        border-right: 0;
    }

    .mode-button:hover {
        background: var(--danger-hover);
        color: var(--danger-text);
    }

    .mode-button.active {
        background: var(--danger-bg);
        color: var(--danger-text);
    }

    /* QR-vs-server choice, shown only when the link is too big for a QR
       code: same segmented look as the mode switch, but primary-colored
       (the server link is the constructive alternative, not a warning). */
    .server-switch {
        display: flex;

        margin-bottom: 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .server-switch-button {
        flex: 1 1 0;
        min-width: 0;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-right: 1px solid var(--border);

        background: transparent;
        color: var(--text-muted);

        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .server-switch-button:last-child {
        border-right: 0;
    }

    .server-switch-button:hover {
        background: var(--surface-hover);
        color: var(--text);
    }

    .server-switch-button.active {
        background: var(--primary-soft);
        color: var(--primary);
    }

    /* Disabled (link fits in a QR code): the server option is not a
       downgrade, it is simply unnecessary for small decks. */
    .server-switch-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .server-switch-button:disabled:hover {
        background: transparent;
        color: var(--text-muted);
    }

    .switch-hint {
        margin: -0.4rem 0 1rem;

        color: var(--text-muted);
        font-size: 0.8rem;
        line-height: 1.5;
    }

    .deck-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        margin: 0 0 0.5rem;
    }

    .mode-hint {
        margin: 0 0 1.25rem;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
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
