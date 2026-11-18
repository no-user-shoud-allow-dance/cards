<script lang="ts">
    /** Moon (anti-star) icon — the glyph of the "Schlafen legen" button. */
    let { size = 16 }: { size?: number } = $props();
</script>

<svg
    class="moon-icon"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" fill="currentColor" />
</svg>

<style lang="postcss">
    .moon-icon {
        display: block;
    }
</style>
