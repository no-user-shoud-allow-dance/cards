<script lang="ts">
    /** SyncIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M20.5 11.5A8.5 8.5 0 0 0 6.2 6.4L4 8.5" /><path d="M4 4.5v4h4" /><path
        d="M3.5 12.5a8.5 8.5 0 0 0 14.3 5.1l2.2-2.1"
    /><path d="M20 19.5v-4h-4" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
