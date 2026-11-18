<script lang="ts">
    /** BoxIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" /><path
        d="M6.3 5.5v13M9.2 5.5v13M12 5.5v13M14.8 5.5v13M17.7 5.5v13"
    />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
