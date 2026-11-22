<script lang="ts">
    /** ClockIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
