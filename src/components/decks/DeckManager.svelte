<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { fade, fly } from "svelte/transition";
    import { decks } from "#components/model/decks.svelte";
    import { folderLabel, type LoadedDeck } from "#components/model/deckView";
    import DeckMeta from "#components/decks/DeckMeta.svelte";
    import PageHeader from "#components/shared/ui/PageHeader.svelte";
    import Button from "#components/shared/ui/Button.svelte";
    import Toggle from "#components/shared/ui/Toggle.svelte";
    import PinIcon from "#components/icons/PinIcon.svelte";
    import PencilIcon from "#components/icons/PencilIcon.svelte";
    import PrintIcon from "#components/icons/PrintIcon.svelte";
    import ShareIcon from "#components/icons/ShareIcon.svelte";
    import TrashIcon from "#components/icons/TrashIcon.svelte";
    import EyeOffIcon from "#components/icons/EyeOffIcon.svelte";
    import { toastStore } from "#lib/state/toasts.svelte";
    import { isNscError } from "#lib/core/errors";
    import { core } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { deck }: { deck: LoadedDeck } = $props();

    // The deck's simple folder is what the title button shows and edits;
    // `#special` folders are tags and stay untouched here.
    const folder = $derived(folderLabel(deck.folders));

    const pinned = $derived(deck.folders.includes(core.SPECIAL_FOLDERS.pinned));
    const excluded = $derived(deck.folders.includes(core.SPECIAL_FOLDERS.excludeFromContinue));

    // Drafts (special `#drafts` folder) are unsaved work-in-progress:
    // sharing, printing, pinning and continue-exclusion make no sense
    // until the deck is saved in the editor (which drops `#drafts`).
    const isDraft = $derived(deck.folders.includes(core.DRAFT_FOLDER));

    let editing = $state<"rename" | "move" | null>(null);
    let renameValue = $state("");
    let moveValue = $state("");
    let renameInput = $state<HTMLInputElement | null>(null);
    let moveInput = $state<HTMLInputElement | null>(null);
    let confirmDelete = $state(false);

    // Reset per-deck action state when navigating to another deck.
    $effect(() => {
        void deck.slug;
        editing = null;
        confirmDelete = false;
    });

    // Focus the inline edit input once it appears.
    $effect(() => {
        if (editing === "rename") renameInput?.focus();
        if (editing === "move") moveInput?.focus();
    });

    function startRename(): void {
        renameValue = deck.name;
        confirmDelete = false;
        editing = "rename";
    }

    function startMove(): void {
        moveValue = folder;
        confirmDelete = false;
        editing = "move";
    }

    async function submitRename(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        try {
            await decks.update(deck.slug, { name: renameValue });
        } catch (error) {
            if (isNscError(error)) toastStore.errorCode(error.code);
            return;
        }
        editing = null;
    }

    async function submitMove(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        try {
            await decks.update(deck.slug, { folder: moveValue });
        } catch (error) {
            // e.g. FOLDER_RESERVED_PREFIX when the name starts with "#"
            if (isNscError(error)) toastStore.errorCode(error.code);
            return;
        }
        editing = null;
    }

    async function deleteDeck(): Promise<void> {
        await decks.remove(deck.slug);
        goto(resolve("/"));
    }
</script>

<PageHeader>
    {#snippet title()}
        <div class="deck-title">
            <button
                type="button"
                class="title-part"
                class:editing={editing === "move"}
                title="Ordner ändern"
                aria-label="Ordner ändern: {folder}"
                onclick={startMove}
            >
                {folder}
            </button>
            <span class="title-separator" aria-hidden="true">/</span>
            <button
                type="button"
                class="title-part"
                class:editing={editing === "rename"}
                title="Stapel umbenennen"
                aria-label="Stapel umbenennen: {deck.name}"
                onclick={startRename}
            >
                {deck.name}
            </button>
        </div>
    {/snippet}

    {#snippet subtitle()}
        {#if deck.meta.author || deck.meta.description || deck.meta.source}
            <DeckMeta deckType={deck.deckType} cardCount={deck.cards.length} meta={deck.meta} />
        {/if}
    {/snippet}
</PageHeader>

<div class="deck-actions">
    {#if editing === "rename"}
        <form class="inline-form" onsubmit={submitRename} transition:fly={{ y: -6, duration: 160 }}>
            <input
                class="inline-input"
                type="text"
                bind:this={renameInput}
                bind:value={renameValue}
                aria-label="Neuer Name des Stapels"
            />
            <Button variant="primary" type="submit">Umbenennen</Button>
            <Button onclick={() => (editing = null)}>Abbrechen</Button>
        </form>
    {:else if editing === "move"}
        <form class="inline-form" onsubmit={submitMove} transition:fly={{ y: -6, duration: 160 }}>
            <input
                class="inline-input"
                type="text"
                bind:this={moveInput}
                bind:value={moveValue}
                aria-label="Neuer Ordner des Stapels"
            />
            <Button variant="tertiary" type="submit">Verschieben</Button>
            <Button onclick={() => (editing = null)}>Abbrechen</Button>
        </form>
    {:else}
        <div class="deck-actions-row" transition:fly={{ y: -6, duration: 160 }}>
            {#if !isDraft && deck.errors.length === 0}
                <Button href={resolve("/(deck)/export/[slug]", { slug: deck.slug })}>
                    {#snippet leading()}<ShareIcon size={15} />{/snippet}
                    Teilen
                </Button>
            {/if}
            <Button href={resolve("/(deck)/edit/[slug]", { slug: deck.slug })}>
                {#snippet leading()}<PencilIcon size={15} />{/snippet}
                Bearbeiten
            </Button>
            {#if !isDraft && deck.errors.length === 0}
                <Button href={resolve("/(deck)/print/[slug]", { slug: deck.slug })}>
                    {#snippet leading()}<PrintIcon size={15} />{/snippet}
                    Drucken
                </Button>
            {/if}
            {#if !isDraft}
                <Button onclick={() => void decks.togglePinned(deck.slug)}>
                    {#snippet leading()}<PinIcon filled={pinned} size={15} />{/snippet}
                    {pinned ? UI.unpin : UI.pin}
                </Button>

                {#if excluded}
                    <Button onclick={() => void decks.toggleHiddenFromContinue(deck.slug)}>
                        {#snippet leading()}<EyeOffIcon filled={excluded} size={15} />{/snippet}
                        {excluded ? UI.showInContinue : UI.hideFromContinue}
                    </Button>
                {/if}
            {/if}
            {#if !isDraft && deck.pureMode}
                <Toggle
                    label={UI.pureMode}
                    checked={deck.pureModeEnabled}
                    onchange={(value) => void decks.setPureMode(deck.slug, value)}
                />
            {/if}
            {#key confirmDelete}
                <div class="delete-action" in:fade={{ duration: 120 }}>
                    <Button
                        variant="danger"
                        onclick={confirmDelete ? deleteDeck : () => (confirmDelete = true)}
                    >
                        {#snippet leading()}<TrashIcon size={15} />{/snippet}
                        {confirmDelete ? "Wirklich löschen?" : "Löschen"}
                    </Button>
                </div>
            {/key}
        </div>
    {/if}
</div>

<style lang="postcss">
    /* Wraps the title snippet inside PageHeader's h1; snippet content is
       scoped here, so no :global is needed. */
    .deck-title {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem;
    }

    .title-part {
        font: inherit;
        color: inherit;

        margin: 0;
        padding: 0;

        border: 0;
        background: none;

        overflow-wrap: anywhere;
    }

    button.title-part {
        cursor: pointer;
        text-decoration: underline dotted;
        text-underline-offset: 0.18em;
        text-decoration-color: transparent;
        transition:
            0.3s text-decoration-color ease,
            0.3s text-decoration ease;

        &:hover {
            color: var(--primary);
            text-decoration: underline dotted;
            text-decoration-color: var(--primary);
        }
    }

    .title-part.editing {
        color: var(--primary);
        text-decoration: underline;
        text-decoration-color: var(--primary);
    }

    .title-separator {
        color: var(--text-muted);
        font-weight: 400;
        user-select: none;
    }

    .deck-actions {
        display: grid;
        align-items: center;

        margin: 1.5rem 0;
    }

    /* The action views (default row, rename form, move form) swap with fly
       transitions. Stack them in one grid cell so the outgoing and incoming
       elements overlap in place instead of sitting side by side in the flow
       and snapping into position once the outro finishes. */
    .deck-actions > * {
        grid-area: 1 / 1;
        justify-self: start;
    }

    .deck-actions-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
    }

    /* Keeps the delete button at its natural size inside the flex row
       while the keyed swap fades it. */
    .delete-action {
        display: flex;
    }

    .inline-form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .inline-input {
        font: inherit;
        font-size: var(--fs-4);

        flex: 1 0 0;

        padding: 0.6rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        &:focus {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
        }
    }
</style>
