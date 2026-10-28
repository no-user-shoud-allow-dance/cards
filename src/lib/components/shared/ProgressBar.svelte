<script lang="ts">
    let {
        ratio,
        height,
    }: {
        ratio: number;
        height?: string;
    } = $props();

    const pct = $derived(Math.min(100, Math.max(0, ratio * 100)));
</script>

<span class="progress-track" style:height={height}>
    <span class="progress-fill" style="--progress: {pct}%"></span>
</span>

<style>
    .progress-track {
        display: block;
        height: 4px;

        border-radius: var(--radius-pill);
        background: var(--surface-soft);

        overflow: hidden;
    }

    .progress-fill {
        display: block;
        height: 100%;
        width: var(--progress, 0%);

        border-radius: var(--radius-pill);
        background: var(--progress-color, var(--primary));

        transition: width var(--transition-normal);
    }
</style>
