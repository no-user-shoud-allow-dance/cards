<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import {
        Chip,
        Button,
        Card,
        Page,
        PageHeader,
        ServerLinkCard,
        ShareLinkCard,
        Spinner,
        decks,
        folderLabel,
    } from "#components";
    import type { Deck, LoadedDeck } from "#components";
    import { SERVER_LINK_MIN_LENGTH, canNativeShare, core, nativeShare } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { data } = $props();

    type ShareMode = "progress" | "cards" | "together";

    // The (deck) layout renders this page only when the deck exists.
    const deck = $derived(decks.get(data.slug) as Deck);
    const loaded = $derived(decks.load(deck.slug));
    // Broken decks are never shareable: the buttons hide on the deck page
    // and this route refuses as well (it stays reachable by URL).
    const hasErrors = $derived((loaded?.errors.length ?? 0) > 0);

    // Raw markdown is editor/share-only (L0) — loaded async via getRaw.
    let rawMarkdown = $state("");
    // Share actions stay busy until the raw markdown has resolved.
    let rawLoaded = $state(false);

    let mode = $state<ShareMode>("together");
    let shareUrl = $state("");
    let shareLength = $state(0);
    // Set when the payload exceeds the path-link cap — only an encrypted
    // server link (short URL) can carry it then.
    let tooLarge = $state(false);
    let canShare = $state(false);
    let nativeShareFailed = $state(false);
    // The user picks the channel. A link up to half of the max QR size is
    // "too small" for a server link — serverActive is the effective state,
    // so a mode change to a small link falls back to QR on its own.
    let useServerLink = $state(false);
    let serverAllowed = $derived(tooLarge || shareLength > SERVER_LINK_MIN_LENGTH);
    let serverActive = $derived((useServerLink || tooLarge) && serverAllowed);

    onMount(() => {
        canShare = canNativeShare();
        void decks.getRaw(data.slug).then((raw) => {
            if (raw !== null) rawMarkdown = raw;
            rawLoaded = true;
        });
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
            hint: "Der Link enthält nur den Lernfortschritt – der Stapel muss auf dem anderen Gerät bereits vorhanden sein.",
            shareText: "NSC Fortschritt:",
        },
        {
            id: "cards",
            label: "Nur Karten",
            title: "Stapel-Link",
            copyLabel: "Link kopieren",
            hint: "Der Link enthält nur die Karten des Stapels – ohne Lernfortschritt.",
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

    /**
     * Maps the deck's compiled learning progress onto sparse tuples (only
     * touched cards), keyed by the content-hash CardId — stable across
     * devices.
     */
    function progressTuples(deck: LoadedDeck | null): core.CardStateTuple[] {
        const tuples: core.CardStateTuple[] = [];
        for (const card of deck?.cards ?? []) {
            const st = card.state;
            if (!st) continue;
            tuples.push([card.cardId, st.box, st.lapses, st.lastReviewed, st.overviewDone ? 1 : 0]);
        }
        return tuples;
    }

    /**
     * The t body: `head` (frontmatter + title) plus one
     * `[cardMarkdown, box, lapses, lastReviewed, overviewDone]` tuple per
     * card in deck order — head + all card lines = a valid deck file.
     */
    function togetherBody(
        deck: LoadedDeck | null,
        doc: core.DeckDocument,
        hash: core.DeckHash
    ): core.TogetherBody {
        const head = core.serialize({ ...doc, cards: [] }).trimEnd();
        const progressOf = new Map((deck?.cards ?? []).map((card) => [card.cardId, card.state]));
        return {
            h: hash,
            s: deck?.streak ?? 0,
            head,
            c: doc.cards.map((card) => {
                const st = progressOf.get(card.id) ?? null;
                return [
                    core.serializeCard(card),
                    st?.box ?? 1,
                    st?.lapses ?? 0,
                    st?.lastReviewed ?? null,
                    st?.overviewDone ? 1 : 0,
                ] as [string, number, number, number | null, 0 | 1];
            }),
        };
    }

    // (Re)build the path link whenever the mode or the deck changes.
    $effect(() => {
        const slug = data.slug;
        const active = mode;
        const origin = window.location.origin;
        useServerLink = false;
        void (async () => {
            const raw = await decks.getRaw(slug);
            if (raw === null) return;
            let link: core.ShareLink;
            if (active === "cards") {
                link = { kind: "c", body: { c: raw } };
            } else {
                const doc = core.parse(core.makeRawMarkdown(raw));
                const hash = core.hashDeckContent(doc, core.serializeCard);
                // The compiled deck covers the streak, the continue flag
                // and every card's progress.
                const loaded = decks.load(slug);
                link =
                    active === "progress"
                        ? {
                              kind: "p",
                              body: {
                                  h: hash,
                                  s: loaded?.streak ?? 0,
                                  c: progressTuples(loaded),
                              },
                          }
                        : { kind: "t", body: togetherBody(loaded, doc, hash) };
            }
            let url: string;
            try {
                url = await core.buildLinkUrl(origin, link);
            } catch (error) {
                // Over the path cap there is no path link — an encrypted
                // server link is the only way to share the deck.
                if (
                    core.isNscError(error) &&
                    error.code === core.ErrorCode.LINK_PAYLOAD_TOO_LARGE
                ) {
                    if (slug !== data.slug || active !== mode) return;
                    tooLarge = true;
                    shareUrl = "";
                    shareLength = 0;
                    return;
                }
                throw error;
            }
            // Ignore stale results when the mode or deck changed meanwhile.
            if (slug !== data.slug || active !== mode) return;
            tooLarge = false;
            shareUrl = url;
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
        subtitle="{folderLabel(
            deck.folders
        )} / {deck.name} – Erstelle einen Link mit Karten, nur Fortschritt oder beides. Kanal: QR-Code, Kopieren oder das Teilen-Menü deines Geräts."
    />

    {#if hasErrors}
        <Card class="error-card" padding="lg" bg="soft" role="alert">
            <p class="error-text">{UI.deckHasErrors}</p>
            <div class="error-actions">
                <Button href={resolve("/(deck)/edit/[slug]", { slug: deck.slug })}>
                    Bearbeiten
                </Button>
            </div>
        </Card>
    {:else}
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
            <Chip size="sm">{UI.countCards(loaded?.cards.length ?? 0)}</Chip>
            <Chip tone="info" size="sm">{UI.deckTypeLabel(deck.deckType)}</Chip>
        </p>

        <p class="mode-hint">{activeMode.hint}</p>

        {#if shareUrl || tooLarge}
            {@const qrTooBig = shareLength > core.SHARE_QR_WARN_LENGTH}
            <!-- The user always picks the channel. The server link is only
             offered when the link exceeds half of the max QR size — below
             that the deck is "too small" and the option is disabled. A
             payload over the path cap has no QR option at all. -->
            {#if !tooLarge}
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
                            ? "Der Link ist kleiner als die Hälfte der QR-Maximalgröße – ein Server-Link lohnt nur bei größeren Stapeln."
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
                        Der Link ist kleiner als die Hälfte der QR-Maximalgröße – ein Server-Link
                        lohnt nur bei größeren Stapeln.
                    </p>
                {/if}
            {/if}
            {#if serverActive}
                {#if rawLoaded}
                    <ServerLinkCard markdown={rawMarkdown} />
                {:else}
                    <p class="loading-note"><Spinner size={18} /> {UI.loadingDeck}</p>
                {/if}
            {:else}
                <ShareLinkCard
                    title={activeMode.title}
                    url={shareUrl}
                    copyLabel={activeMode.copyLabel}
                    warning={qrTooBig}
                    warningText="Der Link ist zu lang für einen QR-Code – der Stapel ist zu groß zum Scannen. Bitte kopiere den Link oder nutze „Teilen …“."
                />
                <div class="actions">
                    {#if canShare}
                        <Button variant="primary" onclick={share} busy={!rawLoaded}>
                            Teilen …
                        </Button>
                    {/if}
                </div>
                {#if nativeShareFailed}
                    <p class="note">Teilen wird von diesem Gerät nicht unterstützt.</p>
                {/if}
            {/if}
        {/if}
    {/if}
</Page>

<style lang="postcss">
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
        font-size: var(--fs-3);
        font-weight: 600;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &:last-child {
            border-right: 0;
        }

        &:hover {
            background: var(--danger-hover);
            color: var(--danger-text);
        }

        &.active {
            background: var(--danger-bg);
            color: var(--danger-text);
        }
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
        font-size: var(--fs-3);
        font-weight: 600;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &:last-child {
            border-right: 0;
        }

        &:hover {
            background: var(--surface-hover);
            color: var(--text);
        }

        &.active {
            background: var(--primary-soft);
            color: var(--primary);
        }

        &:disabled:hover {
            background: transparent;
            color: var(--text-muted);
        }
    }

    /* Disabled (link fits in a QR code): the server option is not a
       downgrade, it is simply unnecessary for small decks. */
    .server-switch-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .switch-hint {
        margin: 0 0 1rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.5;
    }

    .deck-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        margin: 0 0 0.5rem;
    }

    :global(.error-card) {
        margin-bottom: 1.5rem;
    }

    .error-text {
        margin: 0 0 0.9rem;
        color: var(--danger-text);
        font-size: var(--fs-4);
        line-height: 1.6;
    }

    .error-actions {
        display: flex;
        gap: 0.75rem;
    }

    .loading-note {
        display: flex;
        align-items: center;
        gap: 0.55rem;

        margin: 0 0 1.1rem;
        color: var(--text-muted);
        font-size: var(--fs-4);
    }

    .mode-hint {
        margin: 0 0 1.25rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
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
        font-size: var(--fs-3);
    }
</style>
