<script lang="ts">
    /** ShareIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="5.5" r="2.6" /><circle
        cx="17.5"
        cy="18.5"
        r="2.6"
    /><path d="M8.3 10.8 15.2 6.7M8.3 13.2l6.9 4.1" />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
