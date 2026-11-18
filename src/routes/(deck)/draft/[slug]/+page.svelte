<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { SvelteSet } from "svelte/reactivity";
    import {
        Button,
        Card,
        CardList,
        CheckIcon,
        DeckErrors,
        DeckManager,
        Dialog,
        FolderIcon,
        Page,
        PlusIcon,
        SectionLabel,
        decks,
    } from "#components";
    import type { LoadedDeck } from "#components";
    import { core, toastStore } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { data } = $props();
    // The (deck) layout renders this page only when the deck exists and is
    // a draft (`#drafts`): saved decks bounce back to /deck/[slug].
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    // Effective pure mode is compiled into the deck, same rule as on
    // the saved-deck page — it only affects how fronts are displayed.
    const pureMode = $derived(deck.pureModeEnabled);

    // ── Save flow ──────────────────────────────────────────────────
    // Saving picks a simple folder and drops the `#drafts` tag — the deck
    // becomes a normal deck (and /deck becomes reachable for it).

    let dialogOpen = $state(false);
    let creatingFolder = $state(false);
    let newFolderName = $state("");
    let newFolderInput = $state<HTMLInputElement | null>(null);

    // All unique simple folders of the existing decks (drafts carry only
    // `#drafts` and contribute nothing); default folder ("Eigene") makes
    // the list usable from the very first draft.
    const folders = $derived.by(() => {
        const set = new SvelteSet<string>();
        for (const entry of Object.values(decks.decks)) {
            if (entry.folders.includes(core.DRAFT_FOLDER)) continue;
            set.add(core.firstSimpleFolder(entry.folders) ?? core.FOLDER_DEFAULT);
        }
        return [...set].sort((a, b) => a.localeCompare(b));
    });

    async function saveDraftTo(folder: string): Promise<void> {
        try {
            await decks.update(deck.slug, {
                folder,
                dropFolders: [core.DRAFT_FOLDER],
            });
        } catch (error) {
            // e.g. FOLDER_RESERVED_PREFIX when the name starts with "#"
            if (core.isNscError(error)) toastStore.errorCode(error.code);
            return;
        }
        dialogOpen = false;
        void goto(resolve("/(deck)/deck/[slug]", { slug: deck.slug }));
    }

    function startNewFolder(): void {
        creatingFolder = true;
        newFolderName = "";
    }

    function submitNewFolder(event: SubmitEvent): void {
        event.preventDefault();
        // An empty name saves into the default folder ("Eigene").
        void saveDraftTo(newFolderName.trim());
    }

    // Focus the inline input once it appears.
    $effect(() => {
        if (creatingFolder) newFolderInput?.focus();
    });

    // Moon button per card row: writes the trailing `*` via the store
    // (raw markdown stays inside storage).
    async function toggleMoon(card: { id: string; hidden: boolean }): Promise<void> {
        await decks.toggleCardHidden(deck.slug, card.id);
    }
</script>

<svelte:head>
    <title>{deck.name} – NSC</title>
</svelte:head>

<Page>
    <DeckManager {deck} />

    {#if deck.errors.length > 0}
        <DeckErrors errors={deck.errors} />
    {/if}

    <div class="draft-save">
        <Button variant="success" onclick={() => (dialogOpen = true)}>
            {#snippet leading()}<CheckIcon size={15} />{/snippet}
            {UI.saveDraft}
        </Button>
    </div>

    {#if deck.cards.length === 0}
        <p class="empty">{UI.draftNoCards}</p>
    {:else}
        <!-- A draft cannot be studied, so Leitner boxes would be noise:
             every card sits on one flat page. -->
        <section class="draft-section" aria-label={UI.draftAllCards}>
            <SectionLabel>{UI.draftAllCards}</SectionLabel>
            <Card class="draft-panel" padding="sm" bg="soft">
                <CardList
                    class="draft-list"
                    cards={deck.cards}
                    {pureMode}
                    deckType={deck.deckType}
                    onToggleMoon={toggleMoon}
                />
            </Card>
        </section>
    {/if}
</Page>

<Dialog bind:open={dialogOpen} title={UI.saveDraft}>
    <p class="save-hint">{UI.saveDraftBody}</p>
    <div class="folder-grid">
        {#each folders as folder (folder)}
            <button
                type="button"
                class="folder-choice"
                aria-label="{UI.saveDraft}: {folder}"
                onclick={() => void saveDraftTo(folder)}
            >
                <FolderIcon size={16} />
                {folder}
            </button>
        {/each}
        {#if creatingFolder}
            <form class="folder-new-form" onsubmit={submitNewFolder}>
                <input
                    class="folder-new-input"
                    type="text"
                    bind:this={newFolderInput}
                    bind:value={newFolderName}
                    aria-label={UI.newFolderName}
                />
                <Button
                    type="submit"
                    variant="success"
                    aria-label="{UI.saveDraft}: {newFolderName.trim()}"
                >
                    <CheckIcon size={15} />
                </Button>
            </form>
        {:else}
            <button type="button" class="folder-choice new" onclick={startNewFolder}>
                <PlusIcon size={16} />
                {UI.newFolder}
            </button>
        {/if}
    </div>
</Dialog>

<style lang="postcss">
    .draft-save {
        margin: 0.75rem 0 1.75rem;
    }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: var(--fs-5);
    }

    .draft-section {
        margin-bottom: 1rem;
    }

    :global(.draft-panel) {
        min-width: 0;

        & :global(.draft-list) {
            margin: 0;
        }
    }

    /* ── Save dialog ───────────────────────────────────────────────── */

    .save-hint {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-4);
    }

    .folder-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
        gap: 0.5rem;
        margin-top: 0.9rem;
    }

    .folder-choice {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;

        min-height: 2.5rem;
        padding: 0.5rem 0.8rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font: inherit;
        font-weight: 600;

        overflow-wrap: anywhere;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);

        &:hover {
            border-color: var(--primary);
            background: var(--surface-hover);
        }

        &.new {
            border-style: dashed;
            color: var(--text-muted);

            &:hover {
                color: var(--primary);
            }
        }
    }

    .folder-new-form {
        grid-column: 1 / -1;

        display: flex;
        gap: 0.5rem;
    }

    .folder-new-input {
        flex: 1 1 auto;

        padding: 0.55rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font: inherit;

        &:focus {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
        }
    }
</style>
