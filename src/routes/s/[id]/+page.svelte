<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { isServerShareId, parseServerShareHash } from "#lib/utils/share";
    import {
        fetchServerSharePayload,
        ServerShareError,
    } from "#lib/utils/serverShare";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    // "loading" while the payload is fetched + decrypted, then the page
    // redirects to the import flow — so only "error" renders long.
    let errorMessage = $state("");

    onMount(() => {
        // The fragment is read locally and never sent anywhere: the fetch
        // inside fetchServerSharePayload goes to /api/share/{id} only.
        // Compact links carry only the key in the fragment (`#k.{key}`)
        // and the id in the path; the legacy `#k.{id}.{key}` form is
        // still accepted.
        const parsed = parseServerShareHash(window.location.hash);
        if (!parsed) {
            errorMessage =
                "Der Link enthält keinen Schlüssel — erwartet wird ein Fragment der Form #k.… im Link.";
            return;
        }
        const pathId = page.params.id ?? "";
        const id = parsed.id ?? pathId;
        if (!id || !isServerShareId(id)) {
            errorMessage = "Die Link-ID fehlt oder ist ungültig.";
            return;
        }
        if (pathId && parsed.id && pathId !== parsed.id) {
            errorMessage = "Link-ID und Schlüssel passen nicht zusammen.";
            return;
        }
        const ref = { id, key: parsed.key };
        void fetchServerSharePayload(ref)
            .then((hash) => {
                // The decrypted string is an ordinary share hash
                // (c.… / t.… / p.…) — hand it to the existing import flow.
                goto(resolve("/(io)/import") + "#" + hash);
            })
            .catch((error: unknown) => {
                errorMessage =
                    error instanceof ServerShareError
                        ? error.message
                        : "Netzwerkfehler — bist du online?";
            });
    });
</script>

<svelte:head>
    <title>Server-Link öffnen – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Server-Link"
        subtitle="Der Stapel wird entschlüsselt — der Schlüssel verlässt dafür nie dein Gerät."
    />
    <Card padding="lg">
        {#if errorMessage}
            <p class="status status--error">{errorMessage}</p>
            <div class="actions">
                <Button variant="primary" href={resolve("/(io)/import")}>
                    Zum Import
                </Button>
            </div>
        {:else}
            <p class="status">Entschlüssele und lade den Stapel …</p>
        {/if}
    </Card>
</Page>

<style>
    .status {
        margin: 0;

        font-size: 0.95rem;
        line-height: 1.6;
    }

    .status--error {
        color: var(--danger-text);
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-top: 1rem;
    }
</style>
