<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { cardStore } from "#lib/store/store.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import {
        applyProgress,
        stashPendingProgress,
    } from "#lib/utils/pendingProgress";
    import { progressDiff, type ProgressDiffEntry } from "#lib/utils/pure";
    import {
        DECK_PREFIX,
        decodeProgressShare,
        LEGACY_DECK_PREFIX,
        PROGRESS_PREFIX,
        type ProgressSharePayload,
    } from "#lib/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
    import { BOX_LABELS, type UserDeck } from "#lib/utils/types";
    import PageHeader from "#lib/components/shared/PageHeader.svelte";
    import Button from "#lib/components/shared/Button.svelte";

    let linkInput = $state("");
    let payload = $state<ProgressSharePayload | null>(null);
    let deck = $state<UserDeck | null>(null);
    let diff = $state<ProgressDiffEntry[]>([]);
    let error = $state<string | null>(null);
    let stashed = $state(false);
    let busy = $state(false);

    onMount(() => {
        // The diff preview and study-time line read these stores; make
        // sure they are loaded (the root layout only inits some).
        cardStore.init();
        studyTimeStore.init();
        // Prefill when the page is opened with a progress-link hash.
        const hash = window.location.hash;
        if (hash.startsWith(`#${PROGRESS_PREFIX}`)) {
            linkInput = hash;
        }
    });

    const overviewLine = $derived(
        !payload
            ? ""
            : payload.overviewDone
              ? deck && cardStore.isOverviewDone(deck.slug)
                  ? "Übersicht: bereits abgeschlossen"
                  : "Übersicht: wird abgeschlossen"
              : "Übersicht: nicht im Link enthalten",
    );

    const studyLine = $derived(
        !payload
            ? ""
            : `Lernzeit danach: ${formatStudyTime(
                  Math.max(
                      payload.studyTimeMs,
                      deck ? studyTimeStore.get(deck.slug) : 0,
                  ),
              )}`,
    );

    async function showPreview(): Promise<void> {
        error = null;
        payload = null;
        deck = null;
        diff = [];
        stashed = false;
        const input = linkInput.trim();
        if (!input) {
            error = "Bitte füge einen Link ein.";
            return;
        }
        const progress = await decodeProgressShare(input);
        if (!progress) {
            const bare = input.replace(/^#/, "");
            error =
                bare.startsWith(DECK_PREFIX) ||
                bare.startsWith(LEGACY_DECK_PREFIX)
                    ? "Das ist ein Stapel-Link — bitte nutze „Stapel importieren“."
                    : "Der Link ist ungültig oder beschädigt.";
            return;
        }
        payload = progress;
        const found = await userDecks.findByHash(progress.hash);
        if (!found) return;
        deck = found;
        const loaded = userDecks.load(found.slug);
        diff = loaded
            ? progressDiff(loaded.cards, cardStore.states, progress.boxes)
            : [];
    }

    async function apply(): Promise<void> {
        if (!payload || !deck) return;
        busy = true;
        try {
            const slug = deck.slug;
            const loaded = userDecks.load(slug);
            applyProgress(slug, loaded?.cards.length ?? 0, payload);
            goto(resolve("/(deck)/deck/[slug]", { slug }));
        } finally {
            busy = false;
        }
    }

    function stash(): void {
        if (!payload) return;
        stashPendingProgress(payload);
        stashed = true;
    }

    function reset(): void {
        linkInput = "";
        payload = null;
        deck = null;
        diff = [];
        error = null;
        stashed = false;
    }
</script>

<svelte:head>
    <title>Fortschritt importieren – NSC</title>
</svelte:head>

<PageHeader
    title="Fortschritt importieren"
    subtitle="Füge einen geteilten Fortschritt-Link ein, prüfe die Vorschau der Änderungen und übernimm den Fortschritt."
/>

<section class="panel">
    <label class="field-label" for="import-progress-link">Link</label>
    <textarea
        id="import-progress-link"
        rows="3"
        bind:value={linkInput}
        placeholder="https://…/#p.…"
        spellcheck="false"
    ></textarea>
    <div class="actions">
        <Button variant="primary" onclick={showPreview}>
            Vorschau anzeigen
        </Button>
        {#if payload || error}
            <Button onclick={reset}>Zurücksetzen</Button>
        {/if}
    </div>
    {#if error}
        <p class="note note-error">{error}</p>
    {/if}
</section>

{#if payload && deck}
    <section class="panel">
        <h2 class="panel-title">Fortschritt für „{deck.name}“</h2>
        <ul class="preview-lines">
            <li>
                {diff.length}
                {diff.length === 1 ? "Karte ändert" : "Karten ändern"} sich
                (höchste Box gewinnt, nie rückwärts)
            </li>
            <li>{overviewLine}</li>
            <li>{studyLine}</li>
        </ul>
        {#if diff.length > 0}
            <ul class="diff-list">
                {#each diff as entry (entry.index)}
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
{:else if payload && stashed}
    <section class="panel">
        <p class="note">
            Der Fortschritt ist gespeichert und wird angewendet, sobald der
            passende Stapel importiert wird.
            <a href={resolve("/(share)/import/deck")}>Zum Stapel-Import</a>
        </p>
    </section>
{:else if payload}
    <section class="panel">
        <p class="note">
            Der zugehörige Stapel ist auf diesem Gerät nicht vorhanden. Du
            kannst den Fortschritt speichern — er wird angewendet, sobald der
            Stapel importiert wird.
        </p>
        <div class="actions">
            <Button variant="primary" onclick={stash}>
                Fortschritt speichern
            </Button>
            <a class="text-link" href={resolve("/(share)/import/deck")}>
                Zum Stapel-Import
            </a>
        </div>
    </section>
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

    textarea {
        font: inherit;
        width: 100%;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

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
    }

    .text-link {
        color: var(--primary);
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
    }

    .text-link:hover {
        text-decoration: underline;
    }

    .note {
        margin: 0;

        font-size: 0.9rem;
        line-height: 1.6;
    }

    .note-error {
        color: var(--danger-text);
    }

    .note a {
        color: var(--primary);
        text-decoration: none;
    }

    .note a:hover {
        text-decoration: underline;
    }
</style>
