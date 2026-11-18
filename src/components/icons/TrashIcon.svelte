<script lang="ts">
    /** TrashIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M4.5 6.5h15" /><path
        d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7"
    /><path d="M6.5 6.5l.75 12a2 2 0 0 0 2 1.9h5.5a2 2 0 0 0 2-1.9l.75-12" /><path
        d="M10 10.5v6M14 10.5v6"
    />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
