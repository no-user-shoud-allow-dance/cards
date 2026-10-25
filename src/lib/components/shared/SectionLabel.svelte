<script lang="ts">
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();
</script>

<!-- Section heading: small, uppercase, muted, with a quiet rule below. -->
<h2 class="section-label">{@render children()}</h2>

<style>
    .section-label {
        margin: 0 0 0.8rem;
        padding-bottom: 0.55rem;

        border-bottom: 1px solid var(--border);

        font-family: var(--font-sans);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1.4;
        text-transform: uppercase;
    }
</style>
