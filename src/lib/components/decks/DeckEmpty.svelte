<script lang="ts">
    let { text = "Dieser Stapel enthält keine Karten." }: { text?: string } =
        $props();
</script>

<div class="deck-empty">
    <p class="empty">{text}</p>
</div>

<style>
    .deck-empty {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
    }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: 0.95rem;
    }
</style>
