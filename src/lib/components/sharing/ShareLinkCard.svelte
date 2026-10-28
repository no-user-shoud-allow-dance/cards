<script lang="ts">
    import Button from "#lib/components/shared/ui/Button.svelte";
    import QrCode from "./QrCode.svelte";

    let {
        title,
        url,
        copyLabel = "Link kopieren",
        warning = false,
        warningText = "",
    }: {
        /** Section heading above the QR code. */
        title: string;
        /** The share link to display. */
        url: string;
        /** Label of the copy button. */
        copyLabel?: string;
        /** Show a warning note (e.g. the link exceeds the size limit). */
        warning?: boolean;
        warningText?: string;
    } = $props();

    let copied = $state(false);
    let copyFailed = $state(false);

    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            copied = true;
            copyFailed = false;
            setTimeout(() => {
                copied = false;
            }, 2000);
        } catch {
            copyFailed = true;
        }
    }
</script>

<section class="share-section">
    <h3>{title}</h3>
    <div class="share-section-body">
        <QrCode value={url} />
        <div class="share-section-links">
            <input
                class="share-url"
                readonly
                value={url}
                onclick={(event) => event.currentTarget.select()}
            />
            <Button onclick={copy}>
                {copied ? "Kopiert ✓" : copyLabel}
            </Button>
            {#if copyFailed}
                <p class="share-note">
                    Kopieren nicht möglich — bitte kopiere den Link manuell
                    aus dem Feld.
                </p>
            {/if}
            {#if warning}
                <p class="share-note share-note--warning">{warningText}</p>
            {/if}
        </div>
    </div>
</section>

<style>
    .share-section {
        margin-bottom: 1.1rem;
    }

    .share-section h3 {
        margin: 0 0 0.6rem;

        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
    }

    .share-section-body {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1rem;
    }

    .share-section-links {
        display: flex;
        flex: 1 1 16rem;
        flex-direction: column;
        gap: 0.6rem;
        min-width: 0;
    }

    .share-url {
        width: 100%;

        font: inherit;
        font-size: 0.78rem;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface-soft);
        color: var(--text);
    }

    .share-note {
        margin: 0;

        color: var(--danger-text);
        font-size: 0.82rem;
        line-height: 1.5;
    }

    .share-note--warning {
        color: var(--warning-text);
    }
</style>
