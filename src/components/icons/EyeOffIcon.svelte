<script lang="ts">
    /** EyeOffIcon — 24px grid, stroke 1.8, round joins, currentColor. */
    let { filled = false, size = 16 }: { filled?: boolean; size?: number } = $props();
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
    <path d="M2.06 12.35a10.4 10.4 0 0 1 19.88 0 10.4 10.4 0 0 1-19.88 0z" />
    <circle cx="12" cy="12" r="2.7" />

    {#if !filled}
        <path d="M4 4 20 20" fill="none" />
    {/if}
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
