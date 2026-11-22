<script lang="ts">
    /** SearchIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8 20 20" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
