<script lang="ts">
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import Page from "#lib/components/shared/Page.svelte";
    import Button from "#lib/components/shared/Button.svelte";

    const title = $derived(
        page.status === 404
            ? "Seite nicht gefunden"
            : "Etwas ist schiefgelaufen",
    );

    const message = $derived(
        page.status === 404
            ? "Die angeforderte Seite existiert nicht oder wurde verschoben."
            : (page.error?.message ??
              "Ein unerwarteter Fehler ist aufgetreten."),
    );
</script>

<svelte:head>
    <title>{page.status} – NSC</title>
</svelte:head>

<Page class="error-page">
    <div class="error-card" in:fade={{ duration: 250 }}>
        <p class="error-status" aria-hidden="true">{page.status}</p>
        <h1>{title}</h1>
        <p class="error-message">{message}</p>
        <div class="error-actions">
            <Button variant="primary" href={resolve("/")}>Zur Startseite</Button>
        </div>
    </div>
</Page>

<!-- svelte-ignore css_unused_selector -->
<style>
    .error-page {
        display: flex;
        align-items: center;
        justify-content: center;

        min-height: calc(100vh - 3.5rem - var(--footer-h));
    }

    .error-card {
        width: min(100%, 32rem);
        padding: clamp(2rem, 7vw, 3.5rem) 1.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;
    }

    .error-status {
        margin: 0 0 0.5rem;

        font-family: var(--font-serif);
        font-size: clamp(2.5rem, 7vw, 3.5rem);
        font-weight: 600;
        line-height: 1;
        color: var(--primary);
        font-variant-numeric: tabular-nums;
    }

    .error-card h1 {
        margin: 0 0 0.6rem;

        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .error-message {
        max-width: 28rem;
        margin: 0 auto 1.75rem;

        color: var(--text-muted);
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .error-actions {
        display: flex;
        justify-content: center;
    }

    @media (max-width: 540px) {
        .error-actions :global(.btn) {
            width: 100%;
        }
    }
</style>
