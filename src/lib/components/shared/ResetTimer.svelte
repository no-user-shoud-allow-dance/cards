<script lang="ts">
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { timerStateStore } from "#lib/store/timerStateStore.svelte";

    let { slug }: { slug: string } = $props();

    function resetTimer(): void {
        if (!confirm("Timer und Lernzeit für diesen Stapel zurücksetzen?")) return;
        studyTimeStore.reset(slug);
        timerStateStore.reset(slug);
    }
</script>

<button type="button" class="reset-timer" onclick={resetTimer}>
    Timer und Lernzeit zurücksetzen
</button>

<style>
    .reset-timer {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.65rem;
        margin-top: 1.25rem;
        padding: 0.6rem 0.85rem;

        border: 1px solid var(--danger-border);
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--danger-text);

        font-size: 0.875rem;
        font-weight: 600;

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .reset-timer:hover {
        background: var(--danger-bg);
    }
</style>
