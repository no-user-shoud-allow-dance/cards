<script lang="ts">
    /** ArrowLeftIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M20 12H4" /><path d="M10 6l-6 6 6 6" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
