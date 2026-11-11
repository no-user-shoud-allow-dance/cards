<script lang="ts">
    import Button from "#lib/components/shared/ui/Button.svelte";
    import ShareLinkCard from "./ShareLinkCard.svelte";
    import { uploadServerShare, ServerShareError } from "#lib/utils/serverShare";

    let {
        payload,
    }: {
        /**
         * The share payload to encrypt and upload (e.g. `c.…` / `t.…`),
         * without the leading "#" — exactly what `#c.…` links carry.
         */
        payload: string;
    } = $props();

    let busy = $state(false);
    let errorMessage = $state("");
    let url = $state("");

    // A new payload (mode/deck change) invalidates a previously created
    // link display — start over.
    $effect(() => {
        void payload;
        url = "";
        errorMessage = "";
        busy = false;
    });

    async function create(): Promise<void> {
        busy = true;
        errorMessage = "";
        try {
            const result = await uploadServerShare(payload);
            url = result.url;
        } catch (error) {
            errorMessage =
                error instanceof ServerShareError
                    ? error.message
                    : "Netzwerkfehler — bist du online?";
        } finally {
            busy = false;
        }
    }
</script>

<section class="server-link">
    <h3>Server-Link (verschlüsselt)</h3>
    {#if url}
        <ShareLinkCard
            title="Server-Link"
            {url}
            copyLabel="Server-Link kopieren"
        />
        <p class="note">
            Der Server speichert nur die verschlüsselten Daten — der Schlüssel
            ist Teil des Links (das <code>#k.…</code>-Fragment) und verlässt
            dein Gerät nie. Der Link ist <strong>2 Tage</strong> gültig.
            Behandle ihn wie ein Passwort: Alles, was die volle URL protokolliert
            (Chat-Apps, Link-Vorschauen, Browser-Sync), kann den Schlüssel
            preisgeben.
        </p>
    {:else}
        <p class="note">
            Dieser Link ist zu lang für einen QR-Code. Als verschlüsselter
            Server-Link genügt ein kurzer QR-Code: die Daten werden mit einem
            Schlüssel verschlüsselt, den nur der Link selbst enthält.
        </p>
        <div class="actions">
            <Button variant="primary" onclick={create} disabled={busy}>
                {busy ? "Wird verschlüsselt …" : "Verschlüsselt als Server-Link teilen"}
            </Button>
        </div>
    {/if}
    {#if errorMessage}
        <p class="note note--error">{errorMessage}</p>
    {/if}
</section>

<style>
    .server-link {
        margin-bottom: 1.1rem;
        padding: 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .server-link h3 {
        margin: 0 0 0.6rem;

        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
    }

    .note {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: 0.82rem;
        line-height: 1.5;
    }

    .note code {
        font-size: 0.78rem;
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
