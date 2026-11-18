<script lang="ts">
    /** WarningIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M12 4.2 2.9 19.8h18.2z" /><path d="M12 10v4.3" /><circle
        cx="12"
        cy="17.2"
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
