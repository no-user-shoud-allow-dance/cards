<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { slide } from "svelte/transition";
    import { DECK_TYPE_OPTIONS } from "#lib/decks/deckTypes";
    import { parseDeck } from "#lib/decks/parser";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { hashDeckContent } from "#lib/utils/hash";
    import {
        applyAllPendingProgress,
        applyPendingProgressFor,
        applyProgress,
        stashPendingProgress,
    } from "#lib/utils/pendingProgress";
    import { countCards } from "#lib/utils/pure";
    import {
        DECK_PREFIX,
        decodeDeckShare,
        decodeProgressShare,
        LEGACY_DECK_PREFIX,
        PROGRESS_PREFIX,
        type ProgressSharePayload,
    } from "#lib/utils/share";
    import { formatStudyTime } from "#lib/utils/time";
    import type { DeckType, UserDeck } from "#lib/utils/types";
    import Button from "../shared/Button.svelte";

    interface PendingShare {
        raw: string;
        title: string | null;
        cardCount: number;
        errorCount: number;
    }

    interface PendingProgress {
        progress: ProgressSharePayload;
        deck: UserDeck;
        learnedCount: number;
    }

    let pending = $state<PendingShare | null>(null);
    let pendingProgress = $state<PendingProgress | null>(null);
    let existingDeck = $state<UserDeck | null>(null);
    let stashed = $state(false);
    let deckType = $state<DeckType>("latin");
    let invalid = $state(false);
    let busy = $state(false);

    function clearHash(): void {
        history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
        );
    }

    onMount(() => {
        // A progress link may have been stashed earlier; if its deck has
        // arrived since (other tab, upload), apply it now.
        void applyAllPendingProgress();

        const hash = window.location.hash;
        if (hash.startsWith(`#${PROGRESS_PREFIX}`)) {
            decodeProgressShare(hash).then(async (progress) => {
                if (progress === null) {
                    invalid = true;
                    console.error(progress)
                    return;
                }
                const deck = await userDecks.findByHash(progress.hash);
                if (!deck) {
                    // The deck is not here (yet): stash the progress and
                    // apply it as soon as the deck is imported.
                    stashPendingProgress(progress);
                    stashed = true;
                    return;
                }
                pendingProgress = {
                    progress,
                    deck,
                    learnedCount: progress.boxes.filter((box) => box > 0)
                        .length,
                };
            });
            return;
        }
        if (
            hash.startsWith(`#${DECK_PREFIX}`) ||
            hash.startsWith(`#${LEGACY_DECK_PREFIX}`)
        ) {
            decodeDeckShare(hash).then(async (payload) => {
                if (payload === null) {
                    invalid = true;
                    console.error(payload)
                    return;
                }
                const parsed = parseDeck(payload.raw);
                deckType = payload.deckType;
                // The same deck (content + type) may already be stored —
                // offer to open it instead of creating a duplicate.
                const contentHash = await hashDeckContent(
                    payload.raw,
                    payload.deckType,
                );
                const existing = await userDecks.findByHash(contentHash);
                if (existing) {
                    existingDeck = existing;
                    return;
                }
                pending = {
                    raw: payload.raw,
                    title: parsed.title,
                    cardCount: parsed.cards.length,
                    errorCount: parsed.errors.length,
                };
            });
        }
    });

    async function importDeck(): Promise<void> {
        if (!pending) return;
        busy = true;
        try {
            const { deck } = await userDecks.add(
                pending.raw,
                pending.title ?? "Geteilter Stapel",
                "Geteilt",
                deckType,
            );
            // A progress link shared before this deck: apply it now.
            await applyPendingProgressFor(deck.contentHash);
            clearHash();
            pending = null;
            goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
        } finally {
            busy = false;
        }
    }

    async function applyProgressShare(): Promise<void> {
        if (!pendingProgress) return;
        busy = true;
        try {
            const slug = pendingProgress.deck.slug;
            const loaded = userDecks.load(slug);
            applyProgress(
                slug,
                loaded?.cards.length ?? 0,
                pendingProgress.progress,
            );
            clearHash();
            pendingProgress = null;
            goto(resolve("/(deck)/deck/[slug]", { slug }));
        } finally {
            busy = false;
        }
    }

    function openExisting(): void {
        if (!existingDeck) return;
        const slug = existingDeck.slug;
        dismiss();
        goto(resolve("/(deck)/deck/[slug]", { slug }));
    }

    function dismiss(): void {
        clearHash();
        pending = null;
        pendingProgress = null;
        existingDeck = null;
        stashed = false;
        invalid = false;
    }
</script>

{#if invalid}
    <section
        class="share-banner share-banner--invalid"
        transition:slide={{ duration: 200 }}
    >
        <div class="share-info">
            <strong>Geteilter Link</strong>
            <span>Der Link ist ungültig oder beschädigt.</span>
        </div>
        <div class="share-actions">
            <Button onclick={dismiss}>Schließen</Button>
        </div>
    </section>
{:else if stashed}
    <section class="share-banner" transition:slide={{ duration: 200 }}>
        <div class="share-info">
            <strong>Fortschritt gespeichert</strong>
            <span>
                Der Fortschritt gehört zu einem Stapel, der auf diesem Gerät
                noch nicht existiert. Er wird angewendet, sobald du den
                passenden Stapel importierst.
            </span>
        </div>
        <div class="share-actions">
            <Button onclick={dismiss}>Verstanden</Button>
        </div>
    </section>
{:else if pendingProgress}
    <section class="share-banner" transition:slide={{ duration: 200 }}>
        <div class="share-info">
            <strong>
                Geteilter Fortschritt{pendingProgress.deck.name
                    ? `: ${pendingProgress.deck.name}`
                    : ""}
            </strong>
            <span>
                {pendingProgress.learnedCount} Karten mit Fortschritt
                {#if pendingProgress.progress.overviewDone}
                    · Übersicht abgeschlossen
                {/if}
                {#if pendingProgress.progress.studyTimeMs > 0}
                    · Lernzeit {formatStudyTime(
                        pendingProgress.progress.studyTimeMs,
                    )}
                {/if}
            </span>
        </div>
        <div class="share-actions">
            <Button
                variant="primary"
                onclick={applyProgressShare}
                disabled={busy}
            >
                {busy ? "Wird übernommen …" : "Fortschritt übernehmen"}
            </Button>
            <Button onclick={dismiss}>Ignorieren</Button>
        </div>
    </section>
{:else if existingDeck}
    <section class="share-banner" transition:slide={{ duration: 200 }}>
        <div class="share-info">
            <strong>Stapel bereits vorhanden</strong>
            <span>
                Dieser Stapel existiert bereits als „{existingDeck.name}“.
            </span>
        </div>
        <div class="share-actions">
            <Button variant="primary" onclick={openExisting}>
                Stapel öffnen
            </Button>
            <Button onclick={dismiss}>Ignorieren</Button>
        </div>
    </section>
{:else if pending}
    <section class="share-banner" transition:slide={{ duration: 200 }}>
        <div class="share-info">
            <strong>
                Geteilter Stapel{pending.title ? `: ${pending.title}` : ""}
            </strong>
            <span>
                {countCards(pending.cardCount)}
                {#if pending.errorCount > 0}
                    · {pending.errorCount} Fehler beim Parsen
                {/if}
            </span>
        </div>
        <label class="share-type">
            Typ
            <select
                value={deckType}
                onchange={(event) =>
                    (deckType = (event.currentTarget as HTMLSelectElement)
                        .value as DeckType)}
            >
                {#each DECK_TYPE_OPTIONS as [value, config]}
                    <option value={value}>{config.label}</option>
                {/each}
            </select>
        </label>
        <div class="share-actions">
            <Button variant="primary" onclick={importDeck} disabled={busy}>
                {busy ? "Wird importiert …" : "Importieren"}
            </Button>
            <Button onclick={dismiss}>Ignorieren</Button>
        </div>
    </section>
{/if}

<style>
    .share-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.9rem;

        margin-bottom: 2rem;
        padding: 1rem 1.25rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--info-bg);
        box-shadow: var(--shadow-card);
    }

    .share-banner--invalid {
        background: var(--danger-bg);
    }

    .share-info {
        display: flex;
        flex: 1 1 220px;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    }

    .share-info span {
        color: var(--text-muted);
        font-size: 0.82rem;
    }

    .share-type {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        color: var(--text-muted);
        font-size: 0.85rem;
        font-weight: 500;
    }

    .share-type select {
        font: inherit;

        padding: 0.4rem 0.55rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    .share-actions {
        display: flex;
        gap: 0.6rem;
    }
</style>
