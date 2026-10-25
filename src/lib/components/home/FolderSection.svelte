<script lang="ts">
    import { fade } from "svelte/transition";
    import SectionLabel from "../shared/SectionLabel.svelte";
    import DeckCard from "./DeckCard.svelte";

    interface DeckInfo {
        slug: string;
        name: string;
        count: number;
    }

    let {
        folder,
        decks,
    }: {
        folder: string;
        decks: DeckInfo[];
    } = $props();

    let open = $state(false);
</script>

<section class="folder">
    <SectionLabel>
        <button
            type="button"
            class="folder-toggle"
            aria-expanded={open}
            aria-controls="folder-{folder}"
            onclick={() => (open = !open)}
        >
            <span class="folder-title">{folder} · {decks.length} Stapel</span>
            <span class="folder-chevron" class:closed={!open} aria-hidden="true">▾</span>
        </button>
    </SectionLabel>
    {#if open}
        <div
            class="deck-grid"
            id="folder-{folder}"
            in:fade={{ duration: 150 }}
            out:fade={{ duration: 150 }}
        >
            {#each decks as deck (deck.slug)}
                <DeckCard slug={deck.slug} name={deck.name} count={deck.count} />
            {/each}
        </div>
    {/if}
</section>

<style>
    .folder {
        margin-top: 1.75rem;
    }

    .folder-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;

        width: 100%;
        padding: 0;
        border: 0;

        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;

        cursor: pointer;
    }

    .folder-title {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .folder-chevron {
        flex: 0 0 auto;

        color: var(--text-muted);
        font-size: 0.75rem;

        transition:
            transform var(--transition-fast),
            color var(--transition-fast);
    }

    .folder-chevron.closed {
        transform: rotate(-90deg);
    }

    .folder-toggle:hover .folder-title {
        color: var(--text);
    }

    .folder-toggle:hover .folder-chevron {
        color: var(--primary);
    }

    .deck-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
        gap: 0.8rem;
    }
</style>
