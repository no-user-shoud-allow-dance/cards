<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { fade, fly } from "svelte/transition";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import type { LoadedDeck } from "#lib/types";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    let { deck, subtitle }: { deck: LoadedDeck; subtitle: string } = $props();

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
        moveValue = deck.folder;
        confirmDelete = false;
        editing = "move";
    }

    async function submitRename(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        await decks.update(deck.slug, { name: renameValue });
        editing = null;
    }

    async function submitMove(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        await decks.update(deck.slug, { folder: moveValue });
        editing = null;
    }

    async function deleteDeck(): Promise<void> {
        await decks.remove(deck.slug);
        goto(resolve("/"));
    }
</script>

<PageHeader {subtitle} titleClass="deck-title">
    {#snippet title()}
        <button
            type="button"
            class="title-part"
            class:editing={editing === "move"}
            title="Ordner ändern"
            aria-label="Ordner ändern: {deck.folder}"
            onclick={startMove}
        >
            {deck.folder}
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
    {/snippet}
</PageHeader>

<div class="deck-actions">
    {#if editing === "rename"}
        <form
            class="inline-form"
            onsubmit={submitRename}
            transition:fly={{ y: -6, duration: 160 }}
        >
            <input
                class="inline-input"
                type="text"
                bind:this={renameInput}
                bind:value={renameValue}
                aria-label="Neuer Name des Stapels"
            />
            <Button variant="primary" type="submit">Speichern</Button>
            <Button onclick={() => (editing = null)}>Abbrechen</Button>
        </form>
    {:else if editing === "move"}
        <form
            class="inline-form"
            onsubmit={submitMove}
            transition:fly={{ y: -6, duration: 160 }}
        >
            <input
                class="inline-input"
                type="text"
                bind:this={moveInput}
                bind:value={moveValue}
                aria-label="Neuer Ordner des Stapels"
            />
            <Button variant="primary" type="submit">Speichern</Button>
            <Button onclick={() => (editing = null)}>Abbrechen</Button>
        </form>
    {:else}
        <div class="deck-actions-row" transition:fly={{ y: -6, duration: 160 }}>
            <Button
                href={resolve("/(deck)/export/[slug]", { slug: deck.slug })}
            >
                Teilen
            </Button>
            <Button
                href={resolve("/(deck)/edit/[slug]", { slug: deck.slug })}
            >
                Bearbeiten
            </Button>
            {#key confirmDelete}
                <div class="delete-action" in:fade={{ duration: 120 }}>
                    <Button
                        variant="danger"
                        onclick={confirmDelete
                            ? deleteDeck
                            : () => (confirmDelete = true)}
                    >
                        {confirmDelete ? "Wirklich löschen?" : "Löschen"}
                    </Button>
                </div>
            {/key}
        </div>
    {/if}
</div>

<style>
    /* The h1 lives inside PageHeader; only its layout is deck-specific. */
    :global(.deck-title) {
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
    }

    button.title-part:hover {
        color: var(--primary);
        text-decoration: underline dotted;
        text-decoration-color: var(--primary);
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

        margin: -0.5rem 0 1.5rem;
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
    }

    .inline-input {
        font: inherit;
        font-size: 0.875rem;

        min-width: 12rem;
        padding: 0.6rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    .inline-input:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }
</style>
