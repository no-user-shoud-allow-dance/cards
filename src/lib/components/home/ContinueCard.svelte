<script lang="ts">
    import { resolve } from "$app/paths";
    import { DECK_TYPES } from "#lib/utils/deckTypes";
    import type { DeckType } from "#lib/types";
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";

    let {
        slug,
        name,
        folder,
        deckType,
        learned,
        total,
        ratio,
    }: {
        slug: string;
        name: string;
        folder: string;
        deckType: DeckType;
        learned: number;
        total: number;
        ratio: number;
    } = $props();
</script>

<a href={resolve("/(deck)/cram/[slug]", { slug })} class="continue-card">
    <span class="continue-name">
        <span class="continue-folder">{folder}</span>
        {name}
    </span>
    <span class="continue-meta">{DECK_TYPES[deckType].label}</span>
    <ProgressBar {ratio} />
    <span class="continue-footer">
        <span class="continue-count">{learned} / {total} gelernt</span>
        <span class="continue-arrow" aria-hidden="true">→</span>
    </span>
</a>

<style>
    .continue-card {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;

        min-width: 0;
        min-height: 7.5rem;
        padding: 1.1rem 1.2rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
        text-decoration: none;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    .continue-card:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        box-shadow: var(--shadow-card);
    }

    .continue-name {
        overflow-wrap: anywhere;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.4;
    }

    .continue-folder {
        color: var(--text-muted);
        font-weight: 500;
    }

    .continue-meta {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 500;
    }

    .continue-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;

        margin-top: auto;
    }

    .continue-count {
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .continue-arrow {
        color: var(--text-muted);
        font-size: 0.95rem;

        transition:
            color var(--transition-fast),
            transform var(--transition-fast);
    }

    .continue-card:hover .continue-arrow {
        color: var(--primary);
        transform: translateX(2px);
    }
</style>
