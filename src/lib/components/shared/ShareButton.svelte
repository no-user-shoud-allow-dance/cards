<script lang="ts">
    import { onMount } from "svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { cardStore } from "#lib/store/store.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { hashDeckContent } from "#lib/utils/hash";
    import {
        canNativeShare,
        encodeDeckShare,
        encodeProgressShare,
        formatShareLength,
        nativeShare,
        SHARE_HASH_LIMIT,
    } from "#lib/utils/share";
    import Button from "./Button.svelte";
    import ShareLinkCard from "./ShareLinkCard.svelte";

    let {
        slug,
        mode = "deck",
    }: { slug: string; mode?: "deck" | "sync" } = $props();

    let dialog = $state<"closed" | "warning" | "share">("closed");
    let deckUrl = $state("");
    let progressUrl = $state("");
    let shareLength = $state(0);
    let nativeShareFailed = $state(false);
    let canShare = $state(false);

    onMount(() => {
        // Web Share API: opens the native share sheet on Android/iOS
        // (WhatsApp, Messages, AirDrop, …). Absent on most desktop
        // browsers, where copy + QR are the sharing paths instead.
        canShare = canNativeShare();
    });

    async function onShare(): Promise<void> {
        const deck = userDecks.get(slug);
        if (!deck) return;
        const origin = window.location.origin;
        deckUrl = `${origin}/#${await encodeDeckShare(deck.raw, deck.deckType)}`;
        shareLength = deckUrl.length;
        if (mode === "sync") {
            const loaded = userDecks.load(slug);
            // One box per card index; 0 = untouched (keeps the link short).
            const boxes = loaded
                ? loaded.cards.map(
                      (card) => cardStore.states[card.id]?.box ?? 0,
                  )
                : [];
            const contentHash =
                deck.contentHash ??
                (await hashDeckContent(deck.raw, deck.deckType));
            progressUrl = `${origin}/#${await encodeProgressShare(
                contentHash,
                boxes,
                {
                    overviewDone: cardStore.isOverviewDone(slug),
                    studyTimeMs: studyTimeStore.get(slug),
                },
            )}`;
            shareLength = Math.max(shareLength, progressUrl.length);
        }
        nativeShareFailed = false;
        dialog = shareLength > SHARE_HASH_LIMIT ? "warning" : "share";
    }

    async function share(): Promise<void> {
        const deck = userDecks.get(slug);
        const ok =
            mode === "sync" && progressUrl
                ? // Both links in one message: deck and progress travel together.
                  await nativeShare({
                      title: deck?.name ?? "NSC Stapel",
                      text: `NSC Stapel${deck ? ` „${deck.name}“` : ""}:\n${deckUrl}\nFortschritt:\n${progressUrl}`,
                  })
                : await nativeShare({
                      title: deck?.name ?? "NSC Stapel",
                      text: "NSC Stapel:",
                      url: deckUrl,
                  });
        if (ok) {
            dialog = "closed";
        } else {
            nativeShareFailed = true;
        }
    }

    function close(): void {
        dialog = "closed";
    }
</script>

<Button onclick={onShare}>
    {mode === "sync" ? "Synchronisieren" : "Teilen"}
</Button>

{#if dialog !== "closed"}
    <div class="share-overlay" role="dialog" aria-modal="true" aria-label="Link teilen">
        <div class="share-dialog">
            {#if dialog === "warning"}
                <h2>Großer Link</h2>
                <p>
                    Der Link ist etwa {formatShareLength(shareLength)} lang.
                    Links über ~1 MB funktionieren nicht zuverlässig — zum Beispiel in
                    Safari oder wenn der Link über Chat-Apps weitergegeben wird
                    (Chrome unterstützt bis etwa 2 MB).
                </p>
                <p>Link trotzdem teilen?</p>
                <div class="share-dialog-actions">
                    <Button variant="primary" onclick={() => (dialog = "share")}>
                        Trotzdem teilen
                    </Button>
                    <Button onclick={close}>Abbrechen</Button>
                </div>
            {:else}
                <h2>{mode === "sync" ? "Synchronisieren" : "Stapel teilen"}</h2>
                {#if mode === "sync"}
                    <p class="share-hint">
                        Teile beide Links mit einem anderen Gerät. Der
                        Fortschritt-Link wird angewendet, sobald der Stapel
                        dort bereits vorhanden ist.
                    </p>
                {/if}

                {#if mode === "sync" && progressUrl}
                    <ShareLinkCard
                        title="Fortschritt"
                        url={progressUrl}
                        copyLabel="Fortschritt-Link kopieren"
                    />
                {/if}

                <ShareLinkCard
                    title={mode === "sync" ? "Stapel" : "Stapel-Link"}
                    url={deckUrl}
                    copyLabel="Link kopieren"
                />

                {#if nativeShareFailed}
                    <p class="share-note">
                        Teilen wird von diesem Gerät nicht unterstützt.
                    </p>
                {/if}

                <div class="share-dialog-actions">
                    {#if canShare}
                        <Button variant="primary" onclick={share}>
                            Teilen …
                        </Button>
                    {/if}
                    <Button onclick={close}>Schließen</Button>
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
        width: min(100%, 42rem);
        max-height: calc(100vh - 2.5rem);
        overflow-y: auto;

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

    .share-hint {
        margin-bottom: 1rem;
    }

    .share-note {
        color: var(--danger-text);
        font-size: 0.82rem;
    }

    .share-dialog-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;

        margin-top: 1rem;
    }
</style>
