<script lang="ts">
    import Button from "#components/shared/ui/Button.svelte";
    import ShareLinkCard from "#components/sharing/ShareLinkCard.svelte";
    import { UI } from "#messages/locale.svelte";
    import { uploadServerLink, ServerShareError } from "#lib/sync/serverShare.ts";

    let {
        markdown,
    }: {
        /**
         * The raw deck markdown to encrypt and upload. The server link
         * (`/k/{id}.{key}`) carries the deck file — the key lives only in
         * the link path and never reaches the API.
         */
        markdown: string;
    } = $props();

    let busy = $state(false);
    let errorMessage = $state("");
    let url = $state("");

    // A new deck/mode invalidates a previously created link — start over.
    $effect(() => {
        void markdown;
        url = "";
        errorMessage = "";
        busy = false;
    });

    async function create(): Promise<void> {
        busy = true;
        errorMessage = "";
        try {
            const result = await uploadServerLink(markdown);
            url = result.url;
        } catch (error) {
            errorMessage =
                error instanceof ServerShareError
                    ? error.message
                    : "Netzwerkfehler – bist du online?";
        } finally {
            busy = false;
        }
    }
</script>

<section class="server-link">
    <h3>Server-Link (verschlüsselt)</h3>
    {#if url}
        <ShareLinkCard title="Server-Link" {url} copyLabel="Server-Link kopieren" />
        <p class="note">
            Der Server speichert nur die verschlüsselten Daten – der Schlüssel steckt im Pfad des
            Links (<code>/k/&#123;id&#125;.&#123;key&#125;</code>); an die Server-API wird nur die
            <code>id</code> gesendet. Der Link ist <strong>2 Tage</strong> gültig. Behandle ihn wie ein
            Passwort: Alles, was die volle URL protokolliert (Chat-Apps, Link-Vorschauen, Browser-Sync),
            kann den Schlüssel preisgeben.
        </p>
    {:else}
        <p class="note">
            Dieser Stapel ist zu groß für einen Link in der URL (und erst recht für einen QR-Code).
            Als verschlüsselter Server-Link genügt ein kurzer QR-Code: die Daten werden mit einem
            Schlüssel verschlüsselt, den nur der Link selbst enthält.
        </p>
        <div class="actions">
            <Button variant="primary" onclick={create} {busy} busyLabel={UI.busyEncrypting}>
                Verschlüsselt als Server-Link teilen
            </Button>
        </div>
    {/if}
    {#if errorMessage}
        <p class="note note--error">{errorMessage}</p>
    {/if}
</section>

<style lang="postcss">
    .server-link {
        margin-bottom: 1.1rem;
        padding: 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        & h3 {
            margin: 0 0 0.6rem;

            font-size: var(--fs-3);
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-muted);
        }
    }

    .note {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.5;

        & code {
            font-size: var(--fs-2);
        }
    }

    .note--error {
        color: var(--danger-text);
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-top: 0.75rem;
    }

    @media (max-width: 540px) {
        .server-link {
            padding: 0.85rem;
        }
    }
</style>
