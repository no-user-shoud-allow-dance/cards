<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import {
        Button,
        Card,
        InlineStatus,
        PageHeader,
        goToAccount,
        handOffPairing,
    } from "#components";
    import { joinSync, messages } from "#lib";

    let peerId = $state("");
    let errorText = $state("");
    let busy = $state(false);

    onMount(() => {
        handOffPairing(page.params.payload ?? "")
            .then((id) => (peerId = id))
            .catch((e: unknown) => {
                errorText = messages.messageOf(e);
            });
    });

    // External opens (any third-party QR app → browser) land here and get
    // an explicit consent dialog before joinSync runs — a scanned link must
    // never connect a peer automatically.
    function confirm(): void {
        if (!peerId) return;
        busy = true;
        joinSync(peerId);
        void goToAccount();
    }

    function cancel(): void {
        window.history.back();
    }
</script>

<svelte:head>
    <title>{messages.UI.pairing} – NSC</title>
</svelte:head>

<div class="wrap">
    <PageHeader title={messages.UI.pairing} />
    <Card padding="lg">
        {#if peerId}
            <h2 class="consent-title">{messages.UI.pairingConsentTitle}</h2>
            <p class="consent-body">{messages.UI.pairingConsentBody}</p>
            <div class="actions">
                <Button variant="primary" onclick={confirm} disabled={busy}>
                    {messages.UI.pairingConsentConfirm}
                </Button>
                <Button onclick={cancel}>{messages.UI.pairingConsentCancel}</Button>
            </div>
        {:else}
            <InlineStatus error={errorText} loading="Link wird geöffnet …" />
        {/if}
    </Card>
</div>

<style lang="postcss">
    .wrap {
        max-width: 34rem;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .consent-title {
        margin: 0 0 0.6rem;
        font-size: 1.15rem;
        font-weight: 600;
    }

    .consent-body {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-4);
        line-height: 1.6;
    }

    .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
    }
</style>
