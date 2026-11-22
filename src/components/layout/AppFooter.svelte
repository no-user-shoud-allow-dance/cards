<script lang="ts">
    import { resolve } from "$app/paths";
</script>

<footer class="app-footer">
    <nav class="footer-nav" aria-label="Rechtliches">
        <a href={resolve("/(docs)/docs")}>Dokumentation</a>
        <span class="separator" aria-hidden="true">·</span>
        <a href={resolve("/(docs)/legal/impressum")}>Impressum</a>
        <span class="separator" aria-hidden="true">·</span>
        <a href={resolve("/(docs)/legal/datenschutz")}>Datenschutz</a>
        <span class="separator" aria-hidden="true">·</span>
        <a href={resolve("/(docs)/legal/lizenzen")}>Lizenzen</a>
    </nav>
</footer>

<style lang="postcss">
    .app-footer {
        display: flex;
        align-items: center;
        justify-content: center;

        min-height: var(--footer-h);
        padding: 0.75rem 1.5rem;

        border-top: 1px solid var(--border);
        background: var(--surface);
    }

    .footer-nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 500;

        & a {
            color: var(--text-muted);
            text-decoration: none;
            transition: color var(--transition-fast);
        }
    }

    .footer-nav a:hover {
        color: var(--primary);
    }

    .footer-nav .separator {
        color: var(--border-strong);
        user-select: none;
    }
</style>
