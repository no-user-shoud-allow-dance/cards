<script lang="ts">
    let { href }: { href: string } = $props();
</script>

<a class="back-button" {href} aria-label="Zurück">
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <path
            d="M19 12H5m6 7-7-7 7-7"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</a>

<style>
    /* Hidden on desktop, where the breadcrumb path already provides
       navigation. Shown on mobile (≤700px) via the layout's media query. */
    .back-button {
        display: none;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;

        width: 2.2rem;
        height: 2.2rem;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        background: var(--surface);

        color: var(--primary);
        text-decoration: none;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast);
    }

    .back-button:hover {
        border-color: var(--primary);
        background: var(--primary-soft);
    }
</style>
