<script lang="ts">
    let {
        ratio,
        height,
        color = "primary",
    }: {
        ratio: number;
        height?: string;
        color?: "primary" | "success" | "danger" | "warning" | "info" | "overview";
    } = $props();

    const pct = $derived(Math.min(100, Math.max(0, ratio * 100)));
</script>

<span class="progress-track" style:height={height}>
    <span class="progress-fill {color}" style="--progress: {pct}%"></span>
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
        transition: width var(--transition-normal);
    }

    /* ── Color variants ─────────────────────────────────────────── */
    .progress-fill.primary  { background: var(--primary); }
    .progress-fill.success  { background: var(--success-text); }
    .progress-fill.danger   { background: var(--danger-text); }
    .progress-fill.warning  { background: var(--warning-text); }
    .progress-fill.info     { background: var(--info-text); }
    .progress-fill.overview { background: var(--overview); }
</style>
