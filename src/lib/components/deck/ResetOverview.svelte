<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";

    let { slug }: { slug: string } = $props();

    function resetOverview(): void {
        if (!confirm("Übersicht für diesen Stapel zurücksetzen?")) return;
        cardStore.resetOverview(slug);
    }
</script>

<button type="button" class="reset-overview" onclick={resetOverview}>
    Übersicht zurücksetzen
</button>

<style>
    .reset-overview {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.65rem;
        padding: 0.6rem 0.85rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: transparent;
        color: var(--text-muted);

        font-size: 0.875rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .reset-overview:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        color: var(--text);
    }
</style>
