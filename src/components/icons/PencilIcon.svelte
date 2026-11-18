<script lang="ts">
    /** PencilIcon — 24px grid, stroke 1.8, round joins, currentColor. */
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
    <path d="M4 20l1.2-4.2L16.6 4.4a2.05 2.05 0 0 1 2.9 2.9L8.2 18.8 4 20z" /><path
        d="M14.6 6.4l3 3"
    />
</svg>

<style lang="postcss">
    .icon {
        display: block;
    }
</style>
