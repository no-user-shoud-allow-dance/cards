<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { parseDeck } from "#lib/utils/parser";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import {
        applyProgress,
        stashPendingProgress,
    } from "#lib/utils/pendingProgress";
    import { stashDraftDeck } from "#lib/utils/draftDeck";
    import {
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
    } from "#lib/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
    import { BOX_LABELS, type Deck } from "#lib/types";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import QrScanner from "#lib/components/sharing/QrScanner.svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";

    /** A progress link preview. */
    interface ProgressPreview {
        payload: ProgressSharePayload;
        deck: Deck | null;
        diff: ProgressDiffEntry[];
        stashed: boolean;
    }

    let linkInput = $state("");
    let preview = $state<ProgressPreview | null>(null);
    let busy = $state(false);

    const progressPreview = $derived(preview);

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

    async function showPreview(): Promise<void> {
        preview = null;
        const input = extractShareHash(linkInput);
        if (!input) {
            toastStore.error("Bitte füge einen Link ein.");
            return;
        }
        const bare = input.replace(/^#/, "");

        // Deck and combined links carry the full deck content: stash it
        // as a draft and redirect to the create page for review/editing.
        if (
            bare.startsWith(DECK_PREFIX) ||
            bare.startsWith(LEGACY_DECK_PREFIX)
        ) {
            const payload = await decodeDeckShare(input);
            if (!payload) {
                toastStore.error("Der Link ist ungültig oder beschädigt.");
                return;
            }
            const parsed = parseDeck(payload.raw, payload.deckType);
            stashDraftDeck({
                raw: payload.raw,
                deckType: payload.deckType,
                name: parsed.title ?? "Geteilter Stapel",
                title: parsed.title,
            });
            goto(resolve("/(io)/create"));
            return;
        }
        if (bare.startsWith(COMBINED_PREFIX)) {
            const combined = await decodeCombinedShare(input);
            if (!combined) {
                toastStore.error("Der Link ist ungültig oder beschädigt.");
                return;
            }
            const parsed = parseDeck(combined.deck.raw, combined.deck.deckType);
            // Stash the progress so it is applied after the deck is created
            // on the create page (matched by content hash).
            stashPendingProgress(combined.progress);
            stashDraftDeck({
                raw: combined.deck.raw,
                deckType: combined.deck.deckType,
                name: parsed.title ?? "Geteilter Stapel",
                title: parsed.title,
            });
            goto(resolve("/(io)/create"));
            return;
        }

        // Progress-only links apply to an existing deck.
        if (bare.startsWith(PROGRESS_PREFIX)) {
            const progress = await decodeProgressShare(input);
            if (!progress) {
                toastStore.error("Der Link ist ungültig oder beschädigt.");
                return;
            }
            const found = await decks.findByHash(progress.hash);
            const p: ProgressPreview = {
                payload: progress,
                deck: found ?? null,
                diff: [],
                stashed: false,
            };
            if (found) {
                const loaded = decks.load(found.slug);
                p.diff = loaded
                    ? progressDiff(loaded.cards, cardStore.states, progress.boxes)
                    : [];
            }
            preview = p;
            return;
        }

        toastStore.error(
            "Der Link ist ungültig oder beschädigt. Erwartet wird ein Stapel- (c.), Fortschritt- (p.) oder kombinierter Link (t.).",
        );
    }

    async function apply(): Promise<void> {
        const p = progressPreview;
        if (!p || !p.deck) return;
        busy = true;
        try {
            const slug = p.deck.slug;
            const loaded = decks.load(slug);
            applyProgress(slug, loaded?.cards.length ?? 0, p.payload);
            goto(resolve("/(deck)/deck/[slug]", { slug }));
        } finally {
            busy = false;
        }
    }

    function stash(): void {
        const p = progressPreview;
        if (!p || p.deck) return;
        stashPendingProgress(p.payload);
        p.stashed = true;
    }

    function reset(): void {
        linkInput = "";
        preview = null;
    }
</script>

<svelte:head>
    <title>Importieren – NSC</title>
</svelte:head>

<PageHeader
    title="Importieren"
    subtitle="Füge einen geteilten Link ein. Stapel-Links (c., t.) öffnen sich im Editor; Fortschritt-Links (p.) gelten für einen bestehenden Stapel."
/>

<Card class="panel" padding="lg">
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
        {#if preview}
            <Button onclick={reset}>Zurücksetzen</Button>
        {/if}
    </div>
</Card>

{#if progressPreview}
    {#if progressPreview.deck}
        <Card class="panel" padding="lg">
            <h2 class="panel-title">
                Fortschritt für „{progressPreview.deck.name}“
            </h2>
            <ul class="preview-lines">
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
                            <span class="diff-front">{entry.prompt}</span>
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
        </Card>
    {:else if progressPreview.stashed}
        <Card class="panel" padding="lg">
            <p class="note">
                Der Fortschritt ist gespeichert und wird angewendet, sobald der
                passende Stapel erstellt oder importiert wird.
            </p>
        </Card>
    {:else}
        <Card class="panel" padding="lg">
            <p class="note">
                Der zugehörige Stapel ist auf diesem Gerät nicht vorhanden. Du
                kannst den Fortschritt speichern — er wird angewendet, sobald
                der Stapel erstellt wird. Erstelle den Stapel dazu über einen
                Stapel-Link (c. oder t.) oben.
            </p>
            <div class="actions">
                <Button variant="primary" onclick={stash}>
                    Fortschritt speichern
                </Button>
            </div>
        </Card>
    {/if}
{/if}

<style>
    /* Card provides border, radius, bg, shadow, padding. */
    .panel {
        margin-bottom: 1.5rem;
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

    textarea {
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

    textarea:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

    .panel-title {
        margin: 0 0 0.6rem;

        font-size: 1.15rem;
        font-weight: 600;
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
</style>
