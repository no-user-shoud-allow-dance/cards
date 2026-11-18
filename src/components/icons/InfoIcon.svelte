<script lang="ts">
    /** InfoIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle
        cx="12"
        cy="7.9"
        r="0.4"
        fill="currentColor"
        stroke="none"
    />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
