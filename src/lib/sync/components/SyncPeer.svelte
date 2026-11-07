<script lang="ts">
    import { syncStore } from "../store/syncStore.svelte";
    import { hostSync, joinSync, PEER_LINK_PREFIX } from "../peer";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import QrCode from "#lib/components/sharing/QrCode.svelte";
    import QrScanner from "#lib/components/sharing/QrScanner.svelte";

    let hostPeerId = $state("");

    // Toast once when a connection is established.
    let wasConnected = $state(false);
    $effect(() => {
        if (syncStore.status === "connected" && !wasConnected) {
            toastStore.success("Verbunden — die Daten werden synchronisiert.");
        }
        wasConnected = syncStore.status === "connected";
    });

    const busy = $derived(
        syncStore.status === "hosting" ||
            syncStore.status === "connecting" ||
            syncStore.status === "connected",
    );

    const statusText = $derived(
        syncStore.status === "hosting"
            ? "Host offen — warte auf das andere Gerät."
            : syncStore.status === "connecting"
              ? "Verbinde …"
              : syncStore.status === "connected"
                ? "Verbunden — Sync läuft."
                : null,
    );

    function handleJoin(): void {
        joinSync(hostPeerId);
    }

    // A scanned host QR carries "nsc-peer:<id>" — strip the prefix so the
    // input shows the plain peer ID (joinSync strips it as well).
    function handleScan(value: string): void {
        hostPeerId = value.trim().replace(PEER_LINK_PREFIX, "");
    }
</script>

<div class="sync-peer">
    <p class="sync-note">
        Synchronisiere dieses Gerät direkt mit einem anderen Gerät (WebRTC
        über PeerJS — die Daten verlassen die Geräte nicht, nur die Peer-ID
        läuft über den Signalisierungs-Server). Beide Geräte müssen online
        sein. Die Peer-ID ist das gemeinsame Secret: sie wird per QR-Code
        oder abgetippt übertragen.
    </p>

    {#if syncStore.status === "hosting" && syncStore.peerId}
        <p class="host-label">
            Peer-ID dieses Geräts — auf dem anderen Gerät eingeben oder QR
            scannen:
        </p>
        <div class="host-body">
            <QrCode value="{PEER_LINK_PREFIX}{syncStore.peerId}" size={160} />
            <code class="peer-id">{PEER_LINK_PREFIX}{syncStore.peerId}</code>
        </div>
    {/if}

    {#if statusText}
        <p class="status" class:connected={syncStore.status === "connected"}>
            {statusText}
        </p>
    {/if}

    {#if syncStore.error}
        <p class="error" role="alert">{syncStore.error}</p>
    {/if}

    {#if !busy}
        <div class="actions">
            <Button variant="primary" onclick={hostSync}>
                Als Host öffnen
            </Button>
        </div>
        <div class="join">
            <TextInput
                label="Peer-ID des anderen Geräts"
                id="sync-host-peer-id"
                bind:value={hostPeerId}
                placeholder="nsc-peer:nsc-…"
            />
            <Button
                variant="secondary"
                onclick={handleJoin}
                disabled={!hostPeerId.trim()}
            >
                Verbinden
            </Button>
            <QrScanner onScan={handleScan} />
        </div>
    {:else}
        <div class="actions">
            <Button variant="secondary" onclick={() => syncStore.destroyPeer()}>
                Trennen
            </Button>
        </div>
    {/if}

    {#if syncStore.logs.length > 0}
        <textarea
            class="sync-log"
            rows="6"
            readonly
            value={syncStore.logs.join("\n")}
            aria-label="Sync-Protokoll"
            spellcheck="false"
        ></textarea>
    {/if}
</div>

<style>
    .sync-peer {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .sync-note {
        margin: 0;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    .host-label {
        margin: 0;

        font-size: 0.85rem;
        font-weight: 600;
    }

    .host-body {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
    }

    .peer-id {
        flex: 1;
        min-width: 12rem;

        padding: 0.3rem 0.55rem;

        border-radius: var(--radius-md);
        background: var(--surface);

        font-size: 0.75rem;
        overflow-wrap: anywhere;
    }

    .status {
        margin: 0;

        color: var(--text-muted);
        font-size: 0.88rem;
    }

    .status.connected {
        color: var(--success-text);
        font-weight: 600;
    }

    .error {
        margin: 0;

        color: var(--danger-text);
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
    }

    .join {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 0.6rem;
    }

    .join :global(.text-input) {
        flex: 1;
        min-width: min(100%, 14rem);
    }

    /* Readonly protocol of the sync session (same lines as the console). */
    .sync-log {
        width: 100%;
        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface-soft);
        color: var(--text-muted);

        font-family:
            ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.72rem;
        line-height: 1.5;

        resize: vertical;
    }
</style>
