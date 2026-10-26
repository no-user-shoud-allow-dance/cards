<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { DECK_TYPE_OPTIONS } from "#lib/decks/utils/deckTypes";
    import { parseDeck } from "#lib/decks/utils/parser";
    import { hashDeckContent } from "#lib/decks/utils/hash";
    import { userDecks } from "#lib/decks/store/userDecks.svelte";
    import { cardStore } from "#lib/learning/store/cardStore.svelte";
    import { studyTimeStore } from "#lib/learning/store/studyTimeStore.svelte";
    import {
        applyPendingProgressFor,
        applyProgress,
        stashPendingProgress,
    } from "#lib/sharing/utils/pendingProgress";
    import {
        countCards,
        progressDiff,
        type ProgressDiffEntry,
    } from "#lib/utils/pure";
    import {
        COMBINED_PREFIX,
        DECK_PREFIX,
        decodeCombinedShare,
        decodeDeckShare,
        decodeProgressShare,
        extractShareHash,
        isShareHash,
        LEGACY_DECK_PREFIX,
        PROGRESS_PREFIX,
        type ProgressSharePayload,
    } from "#lib/sharing/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
    import { BOX_LABELS, type DeckType, type UserDeck } from "#lib/utils/types";
    import PageHeader from "#lib/app/components/shared/PageHeader.svelte";
    import Button from "#lib/app/components/shared/Button.svelte";
    import QrScanner from "#lib/sharing/components/QrScanner.svelte";

    /** A deck ("cards") link preview. */
    interface DeckPreview {
        kind: "deck";
        raw: string;
        title: string | null;
        cardCount: number;
        errorCount: number;
        contentHash: string;
        existing: UserDeck | null;
    }

    /** The deck part of a combined link, when it is not stored locally. */
    interface IncludedDeck {
        raw: string;
        deckType: DeckType;
        title: string | null;
        cardCount: number;
    }

    /** A progress or combined link preview. */
    interface ProgressPreview {
        kind: "progress" | "combined";
        payload: ProgressSharePayload;
        deck: UserDeck | null;
        included: IncludedDeck | null;
        diff: ProgressDiffEntry[];
        stashed: boolean;
    }

    type ImportPreview = DeckPreview | ProgressPreview;

    let linkInput = $state("");
    let preview = $state<ImportPreview | null>(null);
    let error = $state<string | null>(null);
    let busy = $state(false);
    // Selected deck type for a deck link; kept separate from the preview
    // so the <select> can bind to it.
    let deckType = $state<DeckType>("latin");

    const deckPreview = $derived(preview?.kind === "deck" ? preview : null);

    const progressPreview = $derived(
        preview && preview.kind !== "deck" ? preview : null,
    );

    const learnedCount = $derived(
        progressPreview
            ? progressPreview.payload.boxes.filter((box) => box > 0).length
            : 0,
    );

    const overviewLine = $derived(
        !progressPreview
            ? ""
            : progressPreview.payload.overviewDone
              ? progressPreview.deck &&
                cardStore.isOverviewDone(progressPreview.deck.slug)
                  ? "Übersicht: bereits abgeschlossen"
                  : "Übersicht: wird abgeschlossen"
              : "Übersicht: nicht im Link enthalten",
    );

    const studyLine = $derived(
        !progressPreview
            ? ""
            : `Lernzeit danach: ${formatStudyTime(
                  Math.max(
                      progressPreview.payload.studyTimeMs,
                      progressPreview.deck
                          ? studyTimeStore.get(progressPreview.deck.slug)
                          : 0,
                  ),
              )}`,
    );

    onMount(() => {
        // The previews read these stores; the root layout only inits some
        // of them, so make sure both are loaded.
        cardStore.init();
        studyTimeStore.init();
        // The home page redirects share links here: prefill the textarea
        // and show the preview right away.
        const hash = window.location.hash;
        if (isShareHash(hash)) {
            linkInput = hash;
            void showPreview();
        }
    });

    // The content hash covers raw + deck type, so it follows the type
    // selection; the "already stored" check follows it as well.
    $effect(() => {
        const p = preview;
        if (!p || p.kind !== "deck") return;
        const type = deckType;
        void (async () => {
            p.contentHash = await hashDeckContent(p.raw, type);
            p.existing = (await userDecks.findByHash(p.contentHash)) ?? null;
        })();
    });

    async function showPreview(): Promise<void> {
        error = null;
        preview = null;
        const input = extractShareHash(linkInput);
        if (!input) {
            error = "Bitte füge einen Link ein.";
            return;
        }
        const bare = input.replace(/^#/, "");
        if (
            bare.startsWith(DECK_PREFIX) ||
            bare.startsWith(LEGACY_DECK_PREFIX)
        ) {
            const payload = await decodeDeckShare(input);
            if (!payload) {
                error = "Der Link ist ungültig oder beschädigt.";
                return;
            }
            const parsed = parseDeck(payload.raw);
            deckType = payload.deckType;
            preview = {
                kind: "deck",
                raw: payload.raw,
                title: parsed.title,
                cardCount: parsed.cards.length,
                errorCount: parsed.errors.length,
                contentHash: "",
                existing: null,
            };
            return;
        }
        let payload: ProgressSharePayload;
        let kind: "progress" | "combined";
        let included: IncludedDeck | null = null;
        if (bare.startsWith(PROGRESS_PREFIX)) {
            const progress = await decodeProgressShare(input);
            if (!progress) {
                error = "Der Link ist ungültig oder beschädigt.";
                return;
            }
            payload = progress;
            kind = "progress";
        } else if (bare.startsWith(COMBINED_PREFIX)) {
            const combined = await decodeCombinedShare(input);
            if (!combined) {
                error = "Der Link ist ungültig oder beschädigt.";
                return;
            }
            payload = combined.progress;
            kind = "combined";
            const parsed = parseDeck(combined.deck.raw);
            included = {
                raw: combined.deck.raw,
                deckType: combined.deck.deckType,
                title: parsed.title,
                cardCount: parsed.cards.length,
            };
        } else {
            error =
                "Der Link ist ungültig oder beschädigt. Erwartet wird ein Stapel- (c.), Fortschritt- (p.) oder kombinierter Link (t.).";
            return;
        }
        const found = await userDecks.findByHash(payload.hash);
        const p: ProgressPreview = {
            kind,
            payload,
            deck: found ?? null,
            included,
            diff: [],
            stashed: false,
        };
        if (found) {
            const loaded = userDecks.load(found.slug);
            p.diff = loaded
                ? progressDiff(loaded.cards, cardStore.states, payload.boxes)
                : [];
        }
        preview = p;
    }

    async function importDeck(): Promise<void> {
        const p = deckPreview;
        if (!p) return;
        busy = true;
        try {
            const { deck } = await userDecks.add(
                p.raw,
                p.title ?? "Geteilter Stapel",
                "Geteilt",
                deckType,
            );
            // A progress link shared before this deck: apply it now.
            await applyPendingProgressFor(deck.contentHash);
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } finally {
            busy = false;
        }
    }

    async function apply(): Promise<void> {
        const p = progressPreview;
        if (!p) return;
        busy = true;
        try {
            let target = p.deck;
            if (!target && p.included) {
                // The deck travels inside the combined link.
                const { deck: added } = await userDecks.add(
                    p.included.raw,
                    p.included.title ?? "Geteilter Stapel",
                    "Geteilt",
                    p.included.deckType,
                );
                target = added;
            }
            if (!target) return;
            const slug = target.slug;
            const loaded = userDecks.load(slug);
            applyProgress(slug, loaded?.cards.length ?? 0, p.payload);
            goto(resolve("/(deck)/deck/[slug]", { slug }));
        } finally {
            busy = false;
        }
    }

    function stash(): void {
        const p = progressPreview;
        if (!p || p.deck || p.included) return;
        stashPendingProgress(p.payload);
        p.stashed = true;
    }

    function reset(): void {
        linkInput = "";
        preview = null;
        error = null;
    }
</script>

<svelte:head>
    <title>Importieren – NSC</title>
</svelte:head>

<PageHeader
    title="Importieren"
    subtitle="Füge einen geteilten Stapel-, Fortschritt- oder kombinierten Link ein, prüfe die Vorschau und importiere."
/>

<section class="panel">
    <label class="field-label" for="import-link">Link</label>
    <textarea
        id="import-link"
        rows="3"
        bind:value={linkInput}
        placeholder="https://…/#c.…, #p.… oder #t.…"
        spellcheck="false"
    ></textarea>
    <QrScanner onScan={(value) => (linkInput = value)} />
    <div class="actions">
        <Button variant="primary" onclick={showPreview}>Vorschau anzeigen</Button>
        {#if preview || error}
            <Button onclick={reset}>Zurücksetzen</Button>
        {/if}
    </div>
    {#if error}
        <p class="note note-error">{error}</p>
    {/if}
</section>

{#if deckPreview}
    <section class="panel">
        <h2 class="panel-title">{deckPreview.title ?? "Geteilter Stapel"}</h2>
        <p class="preview-meta">
            {countCards(deckPreview.cardCount)}
            {#if deckPreview.errorCount > 0}
                · {deckPreview.errorCount} Fehler beim Parsen
            {/if}
        </p>
        {#if deckPreview.existing}
            <p class="note">
                Dieser Stapel existiert bereits als „{deckPreview.existing
                    .name}“.
            </p>
            <div class="actions">
                <Button
                    variant="warning"
                    href={resolve("/(deck)/deck/[slug]", {
                        slug: deckPreview.existing.slug,
                    })}
                >
                    Stapel öffnen
                </Button>
            </div>
        {:else}
            <label class="field-label" for="import-deck-type">Typ</label>
            <select id="import-deck-type" bind:value={deckType}>
                {#each DECK_TYPE_OPTIONS as [value, config]}
                    <option value={value}>{config.label}</option>
                {/each}
            </select>
            <div class="actions">
                <Button variant="primary" onclick={importDeck} disabled={busy}>
                    {busy ? "Wird importiert …" : "Importieren"}
                </Button>
            </div>
        {/if}
    </section>
{:else if progressPreview}
    {#if progressPreview.deck}
        <section class="panel">
            <h2 class="panel-title">
                Fortschritt für „{progressPreview.deck.name}“
            </h2>
            <ul class="preview-lines">
                {#if progressPreview.kind === "combined"}
                    <li>
                        Kombinierter Link — der Stapel existiert bereits, nur
                        der Fortschritt wird übernommen
                    </li>
                {/if}
                <li>
                    {progressPreview.diff.length}
                    {progressPreview.diff.length === 1
                        ? "Karte ändert"
                        : "Karten ändern"} sich (höchste Box gewinnt, nie
                    rückwärts)
                </li>
                <li>{overviewLine}</li>
                <li>{studyLine}</li>
            </ul>
            {#if progressPreview.diff.length > 0}
                <ul class="diff-list">
                    {#each progressPreview.diff as entry (entry.index)}
                        <li>
                            <span class="diff-front">{entry.front}</span>
                            <span class="diff-boxes">
                                {entry.from === null
                                    ? "—"
                                    : BOX_LABELS[entry.from - 1]}
                                →
                                {BOX_LABELS[entry.to - 1]}
                            </span>
                        </li>
                    {/each}
                </ul>
            {/if}
            <div class="actions">
                <Button variant="primary" onclick={apply} disabled={busy}>
                    {busy ? "Wird übernommen …" : "Fortschritt übernehmen"}
                </Button>
            </div>
        </section>
    {:else if progressPreview.included}
        <section class="panel">
            <h2 class="panel-title">
                Kombinierter Link{progressPreview.included.title
                    ? `: „${progressPreview.included.title}“`
                    : ""}
            </h2>
            <ul class="preview-lines">
                <li>
                    Stapel wird importiert ({countCards(
                        progressPreview.included.cardCount,
                    )})
                </li>
                <li>
                    {learnedCount}
                    {learnedCount === 1 ? "Karte hat" : "Karten haben"} Fortschritt
                </li>
                <li>{overviewLine}</li>
                <li>{studyLine}</li>
            </ul>
            <div class="actions">
                <Button variant="primary" onclick={apply} disabled={busy}>
                    {busy ? "Wird importiert …" : "Stapel + Fortschritt importieren"}
                </Button>
            </div>
        </section>
    {:else if progressPreview.stashed}
        <section class="panel">
            <p class="note">
                Der Fortschritt ist gespeichert und wird angewendet, sobald der
                passende Stapel importiert wird.
            </p>
        </section>
    {:else}
        <section class="panel">
            <p class="note">
                Der zugehörige Stapel ist auf diesem Gerät nicht vorhanden. Du
                kannst den Fortschritt speichern — er wird angewendet, sobald
                der Stapel importiert wird. Importiere den Stapel dazu über
                einen Stapel-Link oben.
            </p>
            <div class="actions">
                <Button variant="primary" onclick={stash}>
                    Fortschritt speichern
                </Button>
            </div>
        </section>
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
        margin: 0 0 0.6rem;

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

    .preview-lines {
        margin: 0 0 1rem;
        padding-left: 1.1rem;

        color: var(--text-muted);
        font-size: 0.88rem;
        line-height: 1.7;
    }

    .diff-list {
        max-height: 18rem;
        margin: 0 0 1rem;
        padding: 0.5rem 0.75rem;
        overflow-y: auto;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface-soft);

        list-style: none;
    }

    .diff-list li {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;

        padding: 0.3rem 0;

        font-size: 0.85rem;
    }

    .diff-list li + li {
        border-top: 1px solid var(--border);
    }

    .diff-front {
        overflow-wrap: anywhere;
    }

    .diff-boxes {
        flex: 0 0 auto;

        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 1rem;
    }

    .note {
        margin: 1rem 0 0;

        font-size: 0.9rem;
        line-height: 1.6;
    }

    .note-error {
        color: var(--danger-text);
    }
</style>
