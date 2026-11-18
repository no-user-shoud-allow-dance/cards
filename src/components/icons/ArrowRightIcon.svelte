<script lang="ts">
    /** ArrowRightIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M4 12h16" /><path d="M14 6l6 6-6 6" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
