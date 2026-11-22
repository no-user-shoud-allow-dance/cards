<script lang="ts">
    /** Pin icon — outline when unpinned, filled (--primary) when pinned. */
    let { filled = false, size = 16 }: { filled?: boolean; size?: number } = $props();
</script>

<svg
    class="pin-icon"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
>
    <path d="M12 17v5" />
    <path
        d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"
    />
</svg>

<style lang="postcss">
    .pin-icon {
        display: block;
    }
</style>
