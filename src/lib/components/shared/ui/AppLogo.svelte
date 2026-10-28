<script lang="ts">
    let { size = 18 }: { size?: number } = $props();
</script>

<span class="app-logo" aria-hidden="true">
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <rect
            x="3.2"
            y="6.2"
            width="11.5"
            height="14.5"
            rx="2.6"
            transform="rotate(-8 8.95 13.45)"
            stroke="currentColor"
            stroke-width="1.8"
        />
        <rect
            x="9.3"
            y="3.8"
            width="11.5"
            height="14.5"
            rx="2.6"
            transform="rotate(8 15.05 11.05)"
            fill="rgb(255 255 255 / 22%)"
            stroke="currentColor"
            stroke-width="1.8"
        />
    </svg>
</span>

<style>
    .app-logo {
        display: grid;
        place-items: center;

        width: 1.95rem;
        height: 1.95rem;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        background: var(--surface);

        color: var(--primary);
    }
</style>
