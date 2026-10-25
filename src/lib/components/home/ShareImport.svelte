<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { slide } from "svelte/transition";
    import { DECK_TYPES } from "#lib/decks/deckTypes";
    import { parseDeck } from "#lib/decks/parser";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { countCards } from "#lib/utils/pure";
    import { decodeDeckShare, SHARE_PREFIX } from "#lib/utils/share";
    import type { DeckType } from "#lib/utils/types";

    const typeOptions = Object.entries(DECK_TYPES) as [
        DeckType,
        (typeof DECK_TYPES)[DeckType],
    ][];

    interface PendingShare {
        raw: string;
        title: string | null;
        cardCount: number;
        errorCount: number;
    }

    let pending = $state<PendingShare | null>(null);
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
        const hash = window.location.hash;
        if (!hash.startsWith(`#${SHARE_PREFIX}`)) return;
        decodeDeckShare(hash).then((payload) => {
            if (payload === null) {
                invalid = true;
                return;
            }
            const parsed = parseDeck(payload.raw);
            deckType = payload.deckType;
            pending = {
                raw: payload.raw,
                title: parsed.title,
                cardCount: parsed.cards.length,
                errorCount: parsed.errors.length,
            };
        });
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
            clearHash();
            pending = null;
            goto(resolve("/deck/[slug]", { slug: deck.slug }));
        } finally {
            busy = false;
        }
    }

    function dismiss(): void {
        clearHash();
        pending = null;
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
            <button type="button" class="secondary" onclick={dismiss}>
                Schließen
            </button>
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
                {#each typeOptions as [value, config]}
                    <option value={value}>{config.label}</option>
                {/each}
            </select>
        </label>
        <div class="share-actions">
            <button type="button" class="primary" onclick={importDeck} disabled={busy}>
                {busy ? "Wird importiert …" : "Importieren"}
            </button>
            <button type="button" class="secondary" onclick={dismiss}>
                Ignorieren
            </button>
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

    .share-actions .primary {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.6rem 1.1rem;

        border: 0;
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .share-actions .primary:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    .share-actions .primary:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .share-actions .secondary {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.6rem 1.1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .share-actions .secondary:hover {
        background: var(--surface-hover);
    }
</style>
