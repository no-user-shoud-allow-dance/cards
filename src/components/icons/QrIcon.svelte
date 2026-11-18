<script lang="ts">
    /** QrIcon — 24px grid, stroke 1.8, round joins, currentColor. */
    let { size = 16 }: { size?: number } = $props();
</script>

<svg
    class="icon"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect
        x="13.5"
        y="4"
        width="6.5"
        height="6.5"
        rx="1"
    /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><path d="M13.5 13.5h3v3h-3z" /><path
        d="M17.5 13.5h2.5M20 16v4h-4"
    />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
