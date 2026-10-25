<script lang="ts">
    import { userDecks } from "#lib/store/userDecks.svelte";
    import {
        encodeDeckShare,
        formatShareLength,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import Button from "./Button.svelte";

    let { slug }: { slug: string } = $props();

    let shareState = $state<"idle" | "copied" | "warning" | "failed">("idle");
    let shareUrl = $state("");
    let shareLength = $state(0);

    async function copy(url: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            shareState = "copied";
            setTimeout(() => {
                if (shareState === "copied") shareState = "idle";
            }, 2000);
        } catch {
            shareUrl = url;
            shareState = "failed";
        }
    }

    async function onShare(): Promise<void> {
        const deck = userDecks.get(slug);
        if (!deck) return;
        const payload = await encodeDeckShare(deck.raw, deck.deckType);
        shareLength = payload.length;
        const url = `${window.location.origin}/#${payload}`;
        if (shareLength > SHARE_HASH_LIMIT) {
            shareUrl = url;
            shareState = "warning";
            return;
        }
        await copy(url);
    }
</script>

<Button onclick={onShare}>
    {shareState === "copied" ? "Link kopiert ✓" : "Teilen"}
</Button>

{#if shareState === "warning" || shareState === "failed"}
    <div class="share-overlay" role="dialog" aria-modal="true" aria-label="Link teilen">
        <div class="share-dialog">
            {#if shareState === "warning"}
                <h2>Großer Link</h2>
                <p>
                    Der Link ist etwa {formatShareLength(shareLength)} lang.
                    Links über ~1 MB funktionieren nicht zuverlässig — zum Beispiel in
                    Safari oder wenn der Link über Chat-Apps weitergegeben wird
                    (Chrome unterstützt bis etwa 2 MB).
                </p>
                <p>Link trotzdem kopieren?</p>
                <div class="share-dialog-actions">
                    <Button variant="primary" onclick={() => copy(shareUrl)}>
                        Trotzdem kopieren
                    </Button>
                    <Button onclick={() => (shareState = "idle")}>
                        Abbrechen
                    </Button>
                </div>
            {:else}
                <h2>Link teilen</h2>
                <p>
                    Der Link konnte nicht automatisch in die Zwischenablage kopiert
                    werden. Bitte kopiere ihn manuell:
                </p>
                <input
                    class="share-url"
                    readonly
                    value={shareUrl}
                    onclick={(event) => event.currentTarget.select()}
                />
                <div class="share-dialog-actions">
                    <Button variant="primary" onclick={() => (shareState = "idle")}>
                        Schließen
                    </Button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .share-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;

        display: flex;
        align-items: center;
        justify-content: center;

        padding: 1.25rem;

        background: rgb(33 32 28 / 45%);
    }

    .share-dialog {
        width: min(100%, 30rem);
        padding: 1.4rem 1.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .share-dialog h2 {
        margin: 0 0 0.6rem;

        font-size: 1.15rem;
        font-weight: 600;
    }

    .share-dialog p {
        margin: 0 0 0.75rem;

        color: var(--text-muted);
        font-size: 0.9rem;
        line-height: 1.6;
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

    .share-dialog-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;

        margin-top: 1rem;
    }
</style>
