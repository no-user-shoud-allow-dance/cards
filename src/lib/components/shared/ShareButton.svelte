<script lang="ts">
    import { getDeck, getDeckRaw } from "#lib/decks/loader";
    import {
        encodeDeckShare,
        formatShareLength,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";

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
        const raw = getDeckRaw(slug);
        if (raw === null) return;
        const deckType = getDeck(slug)?.deckType ?? "latin";
        const payload = await encodeDeckShare(raw, deckType);
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

<button type="button" class="share-button" onclick={onShare}>
    {shareState === "copied" ? "Link kopiert ✓" : "Teilen"}
</button>

{#if shareState === "warning" || shareState === "failed"}
    <div class="share-overlay" role="dialog" aria-modal="true" aria-label="Link teilen">
        <div class="share-dialog">
            {#if shareState === "warning"}
                <h2>Großer Link</h2>
                <p>
                    Der Link enthält etwa {formatShareLength(shareLength)} an Daten.
                    Links über ~1 MB funktionieren nicht zuverlässig — zum Beispiel in
                    Safari oder wenn der Link über Chat-Apps weitergegeben wird
                    (Chrome unterstützt bis etwa 2 MB).
                </p>
                <p>Link trotzdem kopieren?</p>
                <div class="share-dialog-actions">
                    <button type="button" class="primary" onclick={() => copy(shareUrl)}>
                        Trotzdem kopieren
                    </button>
                    <button type="button" class="secondary" onclick={() => (shareState = "idle")}>
                        Abbrechen
                    </button>
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
                    <button type="button" class="primary" onclick={() => (shareState = "idle")}>
                        Schließen
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .share-button {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .share-button:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

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

    .share-dialog-actions .primary {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.7rem 1.15rem;

        border: 0;
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .share-dialog-actions .primary:hover {
        background: var(--primary-hover);
    }

    .share-dialog-actions .secondary {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .share-dialog-actions .secondary:hover {
        background: var(--surface-hover);
    }
</style>
