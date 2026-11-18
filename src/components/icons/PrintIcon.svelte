<script lang="ts">
    /** PrintIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M7 8V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4" /><rect
        x="3.5"
        y="8"
        width="17"
        height="8.5"
        rx="1.8"
    /><path d="M7 13.5h10V20H7z" /><circle
        cx="17.2"
        cy="11"
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
