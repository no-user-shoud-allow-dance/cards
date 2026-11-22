<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import {
        Card,
        Page,
        PageHeader,
        PieChart,
        ResetButton,
        SectionLabel,
        Spinner,
        SyncPeer,
        TextInput,
        Toggle,
        decks,
    } from "#components";
    import { UI } from "#messages/locale.svelte";
    import type { PieSegment } from "#components";
    import {
        BOX_COUNT,
        SESSION_KEYS,
        STORAGE,
        foldersStore,
        isAppLocalKey,
        settingsStore,
    } from "#lib";

    // The stats card waits for all stores — until then it shows a
    // spinner instead of zeros.
    let ready = $state(false);

    onMount(() => {
        void Promise.all([settingsStore.init(), decks.init()]).then(() => {
            ready = true;
        });
    });

    // ── Language (S3) ────────────────────────────────────────────

    function setLocale(locale: "de" | "en"): void {
        void settingsStore.setLocale(locale);
    }

    // Wipes every piece of app data on this device: all decks, learning
    // state, study times and the settings record (whichever engine holds
    // them), plus the session draft. The reload re-hydrates every store
    // from scratch (leer, keine Stapel).
    async function handleDeleteAll(): Promise<void> {
        for (const key of SESSION_KEYS) sessionStorage.removeItem(key);
        await decks.clearAll();
        await settingsStore.resetAll();
        await foldersStore.clear();
        window.location.href = "/";
    }

    // ── Account stats ────────────────────────────────────────────

    const deckList = $derived(Object.values(decks.decks));

    // All cards of all decks, grouped into their pie segment: a card in a
    // deck whose overview is not done yet is marked "In Übersicht";
    // otherwise it counts into its Leitner box.
    const cardStats = $derived.by(() => {
        const counts = Array.from({ length: BOX_COUNT }, () => 0);
        let inOverview = 0;
        for (const deck of deckList) {
            const loaded = decks.load(deck.slug);
            const cards = loaded?.cards ?? [];
            const overviewDone = loaded?.overviewComplete ?? false;
            for (const card of cards) {
                if (!overviewDone) {
                    inOverview++;
                    continue;
                }
                const box = card.state?.box ?? 1;
                if (box >= 1 && box <= BOX_COUNT) counts[box - 1]!++;
            }
        }
        return {
            counts,
            inOverview,
            total: inOverview + counts.reduce((a, b) => a + b, 0),
            learned: counts[BOX_COUNT - 1] ?? 0,
        };
    });

    const totalCards = $derived(cardStats.total);
    const learnedCount = $derived(cardStats.learned);
    const deckCount = $derived(deckList.length);
    const overviewDoneCount = $derived.by(() => {
        let n = 0;
        for (const deck of deckList) {
            if (decks.load(deck.slug)?.overviewComplete) n++;
        }
        return n;
    });
    const totalStudyMs = $derived.by(() => {
        let sum = 0;
        for (const deck of deckList) {
            sum += decks.load(deck.slug)?.studyTimeMs ?? 0;
        }
        return sum;
    });

    // H11: the pie uses the H1 --box-N tokens, so it can never drift from
    // the flashcard tab / BoxStrip; "In Übersicht" keeps the --overview tone.
    const segments = $derived<PieSegment[]>([
        {
            label: "In Übersicht",
            value: cardStats.inOverview,
            color: "color-mix(in srgb, var(--overview) 60%, var(--surface))",
        },
        ...Array.from({ length: BOX_COUNT }, (_, i) => ({
            label: UI.boxLabel(i + 1),
            value: cardStats.counts[i] ?? 0,
            color: `var(--box-${i + 1})`,
        })),
    ]);

    // ── Local storage / IndexedDB outline ────────────────────────

    interface StorageEntry {
        key: string;
        description: string;
        value: string;
    }

    const boolText = (b: boolean | null): string => (b === null ? "—" : b ? "Ja" : "Nein");

    // One row per persisted record of the small engine (kk-… keys plus
    // state:… learning records), with a live summary of what it holds.
    // Secrets (API key) are never displayed.
    const cardStateCount = $derived.by(() => {
        let n = 0;
        for (const deck of deckList) {
            for (const card of decks.load(deck.slug)?.cards ?? []) {
                if (card.state) n++;
            }
        }
        return n;
    });

    const localEntries = $derived<StorageEntry[]>([
        {
            key: `${STORAGE.recordPrefix.state}…`,
            description: "Lernfortschritt pro Karte (Leitner-Box), pro Stapel-Hash",
            value: UI.countCards(cardStateCount),
        },
        {
            key: STORAGE.localStorage.settings,
            description: "Einstellungen: Pur-Modus, Mistral API-Schlüssel, quittierte Hinweise",
            value: `Pur ${boolText(settingsStore.pureMode)} · Schlüssel ${settingsStore.mistralApiKey ? "gesetzt" : "leer"}`,
        },
        {
            key: STORAGE.localStorage.folders,
            description: "Expandierter Zustand der Ordner-Übersicht auf der Startseite",
            value:
                foldersStore.list.length === 1 ? "1 Ordner" : `${foldersStore.list.length} Ordner`,
        },
        {
            key: "privacy_toast_dismissed",
            description: `Datenschutz-Hinweis quittiert (in ${STORAGE.localStorage.settings})`,
            value: boolText(settingsStore.privacyToastDismissed),
        },
        {
            key: "impersistent_toast_dismissed",
            description: `Hinweis zu nicht dauerhaft gespeicherten Daten quittiert (in ${STORAGE.localStorage.settings})`,
            value: boolText(settingsStore.impersistentToastDismissed),
        },
    ]);

    const indexedDbEntries = $derived<StorageEntry[]>([
        {
            key: `${STORAGE.indexeddb.dbName} → ${STORAGE.indexeddb.stores.decks}`,
            description: "Hochgeladene Stapel inklusive Roh-Markdown (Schlüssel: slug)",
            value: deckCount === 1 ? "1 Stapel" : `${deckCount} Stapel`,
        },
    ]);

    // Approximate size of everything the app wrote into localStorage
    // (only keys from the central storage map; UTF-16, hence ×2).
    const localStorageBytes = $derived.by(() => {
        if (typeof window === "undefined") return 0;
        let bytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !isAppLocalKey(key)) continue;
            bytes += (key.length + (localStorage.getItem(key) ?? "").length) * 2;
        }
        return bytes;
    });

    const localStorageSize = $derived(
        localStorageBytes < 1024
            ? `${localStorageBytes} B`
            : `${(localStorageBytes / 1024).toFixed(1)} KB`
    );
</script>

<svelte:head>
    <title>Konto – NSC</title>
</svelte:head>

{#snippet legendRow(segment: PieSegment, total: number)}
    <li>
        <span class="dot" style:background={segment.color} aria-hidden="true"></span>
        <span class="legend-label">{segment.label}</span>
        <span class="legend-value">{segment.value}</span>
        <span class="legend-pct">
            {total > 0 ? Math.round((segment.value / total) * 100) : 0}
            %
        </span>
    </li>
{/snippet}
<Page>
    <PageHeader
        title="Konto"
        subtitle="Ohne Server – alle Daten bleiben auf diesem Gerät."
        compact
    />

    <div class="desk">
        <section class="desk-col" aria-label={UI.sectionLearning}>
            <SectionLabel>{UI.sectionLearning}</SectionLabel>
            <Card padding="lg" class="stats-card">
                <h2 class="card-title">Statistik</h2>

                {#if ready}
                    <div class="charts">
                        <div class="chart-block">
                            <PieChart {segments} size={168} centerLabel="Karten" />
                            <ul class="legend" aria-label="Karten pro Segment">
                                {#each segments as segment (segment.label)}
                                    {@render legendRow(segment, totalCards)}
                                {/each}
                            </ul>
                        </div>
                    </div>
                    <dl class="stat-tiles">
                        <div class="stat">
                            <dt>Stapel</dt>
                            <dd>{deckCount}</dd>
                        </div>
                        <div class="stat">
                            <dt>Karten</dt>
                            <dd>{UI.countCards(totalCards)}</dd>
                        </div>
                        <div class="stat">
                            <dt>Gelernt</dt>
                            <dd>{UI.countCards(learnedCount)}</dd>
                        </div>
                        <div class="stat">
                            <dt>Übersicht</dt>
                            <dd>{overviewDoneCount} / {deckCount}</dd>
                        </div>
                        <div class="stat">
                            <dt>Lernzeit</dt>
                            <dd>{UI.studyTime(totalStudyMs)}</dd>
                        </div>
                    </dl>
                {:else}
                    <p class="stats-loading"><Spinner size={24} /> {UI.loadingDecks}</p>
                {/if}
            </Card>
            <Card padding="lg" class="storage-card">
                <h2 class="card-title">Lokale Speicher</h2>
                <p class="card-note">
                    Alles liegt ausschließlich auf diesem Gerät – Details in der
                    <a href={resolve("/(docs)/legal/datenschutz")}>Datenschutzerklärung</a>.
                </p>

                <h3 class="storage-heading">Local Storage <code>kk_…</code></h3>
                <ul class="outline">
                    {#each localEntries as entry (entry.key)}
                        <li>
                            <code class="outline-key">{entry.key}</code>
                            <span class="outline-desc">{entry.description}</span>
                            <span class="outline-value">{entry.value}</span>
                        </li>
                    {/each}
                </ul>
                <p class="storage-total">Gesamt: ca. {localStorageSize}</p>

                <h3 class="storage-heading">IndexedDB</h3>
                <ul class="outline">
                    {#each indexedDbEntries as entry (entry.key)}
                        <li>
                            <code class="outline-key">{entry.key}</code>
                            <span class="outline-desc">{entry.description}</span>
                            <span class="outline-value">{entry.value}</span>
                        </li>
                    {/each}
                </ul>
            </Card>
        </section>
        <section class="desk-col" aria-label={UI.sectionSyncSettings}>
            <SectionLabel>{UI.sectionSyncSettings}</SectionLabel>
            <Card padding="lg" class="sync-card" bg="soft">
                <h2 class="sync-title">Synchronisieren</h2>
                <SyncPeer />
            </Card>
            <!-- IMPORTANT : DISPLAY NONE -->
            <Card padding="lg" class="language-card" style="display: none;">
                <h2 class="card-title">{UI.languageSection}</h2>
                <div class="lang-switch" role="group" aria-label={UI.languageSection}>
                    <button
                        type="button"
                        class="lang-option"
                        class:active={settingsStore.locale === "de"}
                        aria-pressed={settingsStore.locale === "de"}
                        onclick={() => setLocale("de")}
                    >
                        {UI.languageDe}
                    </button>
                    <button
                        type="button"
                        class="lang-option"
                        class:active={settingsStore.locale === "en"}
                        aria-pressed={settingsStore.locale === "en"}
                        onclick={() => setLocale("en")}
                    >
                        {UI.languageEn}
                    </button>
                </div>
            </Card>
            <Card padding="lg" class="puremode-card">
                <h2 class="card-title">{UI.pureMode}</h2>
                <Toggle
                    label={UI.pureModeDefault}
                    checked={settingsStore.pureMode}
                    onchange={(value) => void settingsStore.setPureMode(value)}
                />
            </Card>
            <Card padding="lg" class="mistral-card">
                <h2 class="card-title">Mistral API</h2>
                <TextInput
                    label="API-Schlüssel"
                    id="mistral-api-key"
                    type="password"
                    value={settingsStore.mistralApiKey}
                    oninput={(v) => void settingsStore.setMistralApiKey(v)}
                    placeholder="sk-…"
                />
                <p class="card-note">
                    Der Schlüssel wird ausschließlich lokal in Ihrem Browser gespeichert und für
                    künftige KI-Funktionen verwendet.
                </p>
            </Card>
        </section>
    </div>
    <Card padding="lg" class="danger-card">
        <h2 class="card-title">Alle Daten löschen</h2>
        <p class="card-note">
            Entfernt unwiderruflich alle Daten dieser App auf diesem Gerät: Stapel (IndexedDB),
            Lernfortschritt, Übersicht, Lernzeit, Einstellungen, Mistral API-Schlüssel.
        </p>
        <div class="danger-action">
            <ResetButton
                label="Alle Daten löschen"
                confirmText="Wirklich alle Daten löschen? Stapel, Fortschritt und Einstellungen sind danach unwiderruflich weg – das lässt sich nicht rückgängig machen."
                onReset={handleDeleteAll}
            />
        </div>
    </Card>
</Page>

<style lang="postcss">
    /* Classes passed to Card land on the child component root, so they are
       targeted via :global. */
    :global(.stats-card),
    :global(.language-card),
    :global(.puremode-card),
    :global(.mistral-card),
    :global(.storage-card),
    :global(.sync-card),
    :global(.danger-card) {
        margin-bottom: 1.25rem;
    }

    /* H11: the account page is a grouped desk — two columns on desktop,
       one on narrow viewports; the danger zone stays full-width below. */
    .desk {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1.5rem;
        align-items: start;
    }

    .desk-col {
        min-width: 0;
    }

    @media (max-width: 900px) {
        .desk {
            grid-template-columns: 1fr;
        }
    }

    .card-title {
        margin: 0 0 0.75rem;

        font-size: var(--fs-5);
        font-weight: 600;
    }

    .card-note {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;

        & a {
            color: var(--primary);
        }
    }

    .stats-loading {
        display: flex;
        align-items: center;
        gap: 0.55rem;

        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-4);
    }

    .charts {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem 2.5rem;
    }

    .chart-block {
        display: flex;
        flex: 1 1 15rem;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem 1.75rem;
    }

    .legend {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.45rem;
        min-width: min(100%, 13rem);

        margin: 0;
        padding: 0;
        list-style: none;

        & li {
            display: flex;
            align-items: center;
            gap: 0.55rem;
        }
    }

    .dot {
        flex: 0 0 auto;

        width: 0.7rem;
        height: 0.7rem;

        border-radius: var(--radius-pill);
    }

    .legend-label {
        flex: 1;
        min-width: 0;

        color: var(--text);
        font-size: 0.88rem;
        font-weight: 500;
    }

    .legend-value {
        color: var(--text-muted);
        font-size: var(--fs-3);
        font-variant-numeric: tabular-nums;
    }

    .legend-pct {
        min-width: 2.6rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .stat-tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
        gap: 0.6rem;

        margin: 1.25rem 0 0;
        padding-top: 1rem;

        border-top: 1px solid var(--border);
    }

    .stat {
        padding: 0.55rem 0.7rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-soft);

        & dt {
            color: var(--text-muted);
            font-size: var(--fs-2);
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        & dd {
            margin: 0.15rem 0 0;

            font-size: 1rem;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
    }

    .storage-heading {
        margin: 1.1rem 0 0.4rem;

        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;

        & code {
            font-size: var(--fs-2);
            text-transform: none;
        }
    }

    .outline {
        display: flex;
        flex-direction: column;

        margin: 0;
        padding: 0;
        list-style: none;

        & li {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.3rem 0.6rem;

            padding: 0.42rem 0;

            border-top: 1px solid var(--border);

            font-size: var(--fs-3);
        }
    }

    .outline li:first-child {
        border-top: none;
    }

    .outline-key {
        padding: 0.1rem 0.4rem;

        border-radius: var(--radius-sm);
        background: var(--surface-soft);

        font-size: 0.76rem;
    }

    .outline-desc {
        flex: 1;
        min-width: min(100%, 12rem);

        color: var(--text-muted);
    }

    .outline-value {
        font-size: var(--fs-3);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .storage-total {
        margin: 0.5rem 0 0;

        color: var(--text-muted);
        font-size: var(--fs-2);
    }

    .danger-action {
        margin-top: 0.9rem;
    }

    .lang-switch {
        display: inline-flex;
        gap: 0.4rem;

        padding: 0.25rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface-soft);
    }

    .lang-option {
        padding: 0.45rem 1rem;

        border: 1px solid transparent;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text-muted);

        font: inherit;
        font-size: var(--fs-4);
        font-weight: 600;

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &.active {
            border-color: var(--border);
            background: var(--surface);
            color: var(--primary);
        }
    }

    .sync-title {
        margin: 0 0 0.5rem;

        font-size: 1rem;
        font-weight: 600;
    }

    @media (max-width: 540px) {
        .charts,
        .chart-block {
            flex-direction: column;
        }

        .chart-block :global(.pie-chart) {
            align-self: center;
        }

        .legend {
            width: 100%;
        }
    }
</style>
