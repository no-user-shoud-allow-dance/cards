<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import { BOX_COUNT, BOX_LABELS } from "#lib/types";
    import SyncPeer from "#lib/sync/components/SyncPeer.svelte";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import { timerStateStore } from "#lib/stores/persistent/timerStateStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import { read, clearAll, PREFIX } from "#lib/storages/localStorage";
    import { countCards } from "#lib/utils/pure";
    import { formatStudyTime } from "#lib/utils/time";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import PieChart, { type PieSegment } from "#lib/components/shared/ui/PieChart.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import ResetButton from "#lib/components/shared/ResetButton.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";

    onMount(() => {
        settingStore.init();
        cardStore.init();
        studyTimeStore.init();
        timerStateStore.init();
        decks.init();
    });

    // Wipes every piece of app data on this device: all kk_* localStorage
    // keys (progress, settings, API key, …), the session
    // draft, and the whole nsc-user-decks IndexedDB database. The reload
    // re-hydrates every store from scratch (leer, keine Stapel).
    async function handleDeleteAll(): Promise<void> {
        clearAll();
        sessionStorage.clear();
        await decks.clearAll();
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
            const overviewDone = cardStore.isOverviewDone(deck.slug);
            for (const card of decks.load(deck.slug)?.cards ?? []) {
                if (!overviewDone) {
                    inOverview++;
                    continue;
                }
                const box = cardStore.boxOf(card.id);
                if (box >= 1 && box <= BOX_COUNT) counts[box - 1]++;
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
    const overviewDoneCount = $derived(
        Object.values(cardStore.overviewDone).filter(Boolean).length,
    );
    const totalStudyMs = $derived(
        Object.values(studyTimeStore.times).reduce((a, b) => a + b, 0),
    );

    // One shade of the accent per box, learned stands out in green.
    const BOX_COLORS = [
        "color-mix(in srgb, var(--primary) 30%, var(--surface))",
        "color-mix(in srgb, var(--primary) 45%, var(--surface))",
        "color-mix(in srgb, var(--primary) 60%, var(--surface))",
        "color-mix(in srgb, var(--primary) 75%, var(--surface))",
        "color-mix(in srgb, var(--primary) 90%, var(--surface))",
        "var(--success-text)",
    ];

    const segments = $derived<PieSegment[]>([
        {
            label: "In Übersicht",
            value: cardStats.inOverview,
            color: "color-mix(in srgb, var(--overview) 60%, var(--surface))",
        },
        ...BOX_LABELS.map((label, i) => ({
            label,
            value: cardStats.counts[i] ?? 0,
            color: BOX_COLORS[i],
        })),
    ]);

    // ── Local storage / IndexedDB outline ────────────────────────

    interface StorageEntry {
        key: string;
        description: string;
        value: string;
    }

    const entryCount = (n: number): string =>
        n === 1 ? "1 Eintrag" : `${n} Einträge`;

    const boolText = (b: boolean | null): string =>
        b === null ? "—" : b ? "Ja" : "Nein";

    // One row per localStorage key (prefix kk_), with a live summary of
    // what it currently holds. Secrets (API key) are never displayed.
    const localEntries = $derived<StorageEntry[]>([
        {
            key: "states",
            description: "Lernfortschritt pro Karte (Leitner-Box)",
            value: countCards(Object.keys(cardStore.states).length),
        },
        {
            key: "overview_done",
            description: "Übersicht abgeschlossen, pro Stapel",
            value: entryCount(Object.keys(cardStore.overviewDone).length),
        },
        {
            key: "study_time",
            description: "Lernzeit pro Stapel",
            value: `${entryCount(Object.keys(studyTimeStore.times).length)} · ${formatStudyTime(totalStudyMs)}`,
        },
        {
            key: "timer_state",
            description: "Countdown-Timer pro Stapel",
            value: entryCount(Object.keys(timerStateStore.states).length),
        },
        {
            key: "mistral_api_key",
            description: "Mistral API-Schlüssel",
            value: settingStore.mistralApiKey ? "gesetzt" : "leer",
        },
        {
            key: "pure",
            description: "Pur-Modus",
            value: boolText(settingStore.pureMode),
        },
        {
            key: "google_disabled",
            description: "Google-Dienste deaktiviert",
            value: boolText(settingStore.googleDisabled),
        },
        {
            key: "privacy_toast_dismissed",
            description: "Datenschutz-Hinweis quittiert",
            value: boolText(read("privacy_toast_dismissed")),
        },
        {
            key: "impersistent_toast_dismissed",
            description: "Hinweis zu nicht dauerhaft gespeicherten Daten quittiert",
            value: boolText(read("impersistent_toast_dismissed")),
        },
    ]);

    const indexedDbEntries = $derived<StorageEntry[]>([
        {
            key: "nsc-user-decks → decks",
            description:
                "Hochgeladene Stapel inklusive Roh-Markdown (Schlüssel: slug)",
            value: deckCount === 1 ? "1 Stapel" : `${deckCount} Stapel`,
        },
    ]);

    // Approximate size of everything the app wrote under the kk_ prefix
    // (localStorage strings are UTF-16, hence ×2).
    const localStorageBytes = $derived.by(() => {
        if (typeof window === "undefined") return 0;
        let bytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(PREFIX)) continue;
            bytes += (key.length + (localStorage.getItem(key) ?? "").length) * 2;
        }
        return bytes;
    });

    const localStorageSize = $derived(
        localStorageBytes < 1024
            ? `${localStorageBytes} B`
            : `${(localStorageBytes / 1024).toFixed(1)} KB`,
    );
</script>

<svelte:head>
    <title>Konto – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Konto"
        subtitle="Ohne Server — alle Daten bleiben auf diesem Gerät."
        compact
    />

    <Card padding="lg" class="stats-card">
        <h2 class="card-title">Statistik</h2>
        {#snippet legendRow(segment: PieSegment, total: number)}
            <li>
                <span
                    class="dot"
                    style:background={segment.color}
                    aria-hidden="true"
                ></span>
                <span class="legend-label">{segment.label}</span>
                <span class="legend-value">{segment.value}</span>
                <span class="legend-pct"
                    >{total > 0 ? Math.round((segment.value / total) * 100) : 0}
                    %</span
                >
            </li>
        {/snippet}

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
                <dd>{countCards(totalCards)}</dd>
            </div>
            <div class="stat">
                <dt>Gelernt</dt>
                <dd>{countCards(learnedCount)}</dd>
            </div>
            <div class="stat">
                <dt>Übersicht</dt>
                <dd>{overviewDoneCount} / {deckCount}</dd>
            </div>
            <div class="stat">
                <dt>Lernzeit</dt>
                <dd>{formatStudyTime(totalStudyMs)}</dd>
            </div>
        </dl>
    </Card>

    <Card padding="lg" class="mistral-card">
        <h2 class="card-title">Mistral API</h2>
        <TextInput
            label="API-Schlüssel"
            id="mistral-api-key"
            type="password"
            value={settingStore.mistralApiKey}
            oninput={(v) => settingStore.setMistralApiKey(v)}
            placeholder="sk-…"
        />
        <p class="card-note">
            Der Schlüssel wird ausschließlich lokal in Ihrem Browser
            gespeichert und für künftige KI-Funktionen verwendet.
        </p>
    </Card>

    <Card padding="lg" class="google-card">
        <h2 class="card-title">Dienste von Drittanbietern</h2>
        <Toggle
            label="Google erlauben"
            checked={!settingStore.googleDisabled}
            onchange={(value) => settingStore.setGoogleDisabled(!value)}
        />
        <p class="card-note">
            Lädt Schriftarten von Google Fonts nach und blendet die Hilfe- und
            Mnemotechnik-Suche ein, die eine Google-Suche öffnet. Details in
            der
            <a href={resolve("/legal/datenschutz")}>Datenschutzerklärung</a>.
        </p>
    </Card>

    <Card padding="lg" class="storage-card">
        <h2 class="card-title">Lokale Speicher</h2>
        <p class="card-note">
            Alles liegt ausschließlich auf diesem Gerät — Details in der
            <a href={resolve("/legal/datenschutz")}>Datenschutzerklärung</a>.
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

    <Card padding="lg" class="sync-card" bg="soft">
        <h2 class="sync-title">Synchronisieren</h2>
        <SyncPeer />
    </Card>

    <Card padding="lg" class="danger-card">
        <h2 class="card-title">Alle Daten löschen</h2>
        <p class="card-note">
            Entfernt unwiderruflich alle Daten dieser App auf diesem Gerät:
            Stapel (IndexedDB), Lernfortschritt, Übersicht, Timer, Lernzeit,
            Einstellungen, Mistral API-Schlüssel.
        </p>
        <div class="danger-action">
            <ResetButton
                label="Alle Daten löschen"
                confirmText="Wirklich alle Daten löschen? Stapel, Fortschritt und Einstellungen werden unwiderruflich entfernt — das kann nicht rückgängig gemacht werden."
                onReset={handleDeleteAll}
            />
        </div>
    </Card>
</Page>

<style>
    /* Classes passed to Card land on the child component root, so they are
       targeted via :global. */
    :global(.stats-card),
    :global(.mistral-card),
    :global(.google-card),
    :global(.storage-card),
    :global(.sync-card),
    :global(.danger-card) {
        margin-bottom: 1.25rem;
    }

    .card-title {
        margin: 0 0 0.75rem;

        font-size: 1rem;
        font-weight: 600;
    }

    .card-note {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    .card-note a {
        color: var(--primary);
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
    }

    .legend li {
        display: flex;
        align-items: center;
        gap: 0.55rem;
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
        font-size: 0.82rem;
        font-variant-numeric: tabular-nums;
    }

    .legend-pct {
        min-width: 2.6rem;

        color: var(--text-muted);
        font-size: 0.82rem;
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
    }

    .stat dt {
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .stat dd {
        margin: 0.15rem 0 0;

        font-size: 1rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }

    .storage-heading {
        margin: 1.1rem 0 0.4rem;

        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .storage-heading code {
        font-size: 0.72rem;
        text-transform: none;
    }

    .outline {
        display: flex;
        flex-direction: column;

        margin: 0;
        padding: 0;
        list-style: none;
    }

    .outline li {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.3rem 0.6rem;

        padding: 0.42rem 0;

        border-top: 1px solid var(--border);

        font-size: 0.85rem;
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
        font-size: 0.82rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .storage-total {
        margin: 0.5rem 0 0;

        color: var(--text-muted);
        font-size: 0.78rem;
    }

    .danger-action {
        margin-top: 0.9rem;
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
