<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { Button, Card, PageHeader, QrScanner, decks, startDraft } from "#components";
    import { UI } from "#messages/locale.svelte";
    import {
        STORAGE,
        ServerShareError,
        core,
        fetchServerLinkMarkdown,
        messages,
        progressBodyToState,
        toastStore,
    } from "#lib";

    let linkInput = $state("");
    let busy = $state(false);

    onMount(() => {
        // The (protocols) routes decode share/sync links and hand them over
        // via the sessionStorage key kk-import — read once, then cleared.
        // This is the ONLY link input besides the textarea below.
        const pending = sessionStorage.getItem(STORAGE.sessionStorage.importHandoff);
        if (pending) {
            sessionStorage.removeItem(STORAGE.sessionStorage.importHandoff);
            void handlePending(pending);
        }
    });

    /** Handles a {kind, body} record handed over by the (protocols) routes. */
    async function handlePending(raw: string): Promise<void> {
        let record: { kind?: string; body?: unknown; peerId?: string };
        try {
            record = JSON.parse(raw) as typeof record;
        } catch {
            toastStore.error("Der Link ist ungültig oder beschädigt. (JSON)");
            return;
        }
        if (record.kind === "c" || record.kind === "k") {
            const body = record.body as { c?: string } | undefined;
            const markdown = body?.c;
            if (typeof markdown !== "string") {
                toastStore.error("Der Link ist ungültig oder beschädigt. (Type)");
                return;
            }
            // Deck link: a draft (`Draft-{n}`) in "Drafts" is created with
            // the shared content and opened in the editor.
            await startDraft(markdown);
            return;
        }
        if (record.kind === "t") {
            // head + all card lines in deck order = a valid deck file.
            const body = record.body as
                | {
                      head?: string;
                      c?: [string, ...unknown[]][];
                  }
                | undefined;
            if (typeof body?.head !== "string" || !Array.isArray(body.c)) {
                toastStore.error("Der Link ist ungültig oder beschädigt. (Array)");
                return;
            }
            const markdown = body.head + "\n" + body.c.map((t) => t[0]).join("\n") + "\n";
            await startDraft(markdown);
            return;
        }
        if (record.kind === "p") {
            try {
                const body = core.validateBody("p", record.body) as core.ProgressBody;
                const state = progressBodyToState(body);
                // Compiled decks match by content hash: the p body carries
                // the sender deck's hash, so the local deck with identical
                // content takes the progress.
                await decks.init();
                const target = decks.findByHash(body.h);
                if (!target) {
                    toastStore.error(UI.progressNoDeck);
                    return;
                }
                await decks.importProgress(target.slug, state);
                toastStore.success("Fortschritt übernommen.");
                goto(resolve("/"));
            } catch (e) {
                toastStore.error(
                    e instanceof core.NscError
                        ? messages.errorMessage(e.code)
                        : "Der Link ist ungültig oder beschädigt. (Progress)"
                );
            }
            return;
        }
        if (record.kind === "s" && record.peerId) {
            goto(resolve("/account"));
            return;
        }
        toastStore.error("Der Link ist ungültig oder beschädigt. (Protocol)");
    }

    async function importLink(): Promise<void> {
        const rawInput = linkInput.trim();
        if (!rawInput) {
            toastStore.error("Bitte füge einen Link ein.");
            return;
        }
        // Canonical path links — `/c/…`, `/p/…`, `/t/…`, `/s/…` and
        // `/k/{id}.{key}`, as a full URL or a bare path — decode via core
        // and flow through the same hand-off as the (protocols) routes.
        let link: core.ShareLink;
        try {
            link = await core.parseLink(rawInput);
        } catch (e) {
            toastStore.error(
                e instanceof core.NscError
                    ? messages.errorMessage(e.code)
                    : "Der Link ist ungültig oder beschädigt."
            );
            return;
        }
        if (link.kind === "k") {
            // Server link: fetch the ciphertext by id only and decrypt
            // locally with the key from the link path.
            busy = true;
            try {
                const markdown = await fetchServerLinkMarkdown(link.id, link.key);
                await handlePending(JSON.stringify({ kind: "k", body: { c: markdown } }));
            } catch (error) {
                toastStore.error(
                    error instanceof ServerShareError
                        ? error.message
                        : "Der Link ist ungültig oder beschädigt."
                );
            } finally {
                busy = false;
            }
            return;
        }
        await handlePending(
            JSON.stringify(
                link.kind === "s"
                    ? { kind: "s", peerId: link.peerId }
                    : { kind: link.kind, body: link.body }
            )
        );
    }
</script>

<svelte:head>
    <title>Importieren – NSC</title>
</svelte:head>

<PageHeader
    title="Importieren"
    subtitle="Füge einen geteilten Link ein. Stapel-Links (/c/…, /t/…) werden als Entwurf „Draft-{'{n}'}“ im Ordner „Drafts“ im Editor geöffnet; Fortschritt-Links (/p/…) gelten für einen bestehenden Stapel; Server-Links (/k/…) werden lokal entschlüsselt."
/>

<Card class="panel" padding="lg">
    <label class="field-label" for="import-link">Link</label>
    <textarea
        id="import-link"
        rows="3"
        bind:value={linkInput}
        placeholder={"https://…/c/…, /p/…, /t/… oder Server-Link …/k/{id}.{key}"}
        spellcheck="false"></textarea>
    <QrScanner onScan={(value) => (linkInput = value)} />
    <div class="actions">
        <Button variant="primary" onclick={importLink} {busy} busyLabel={UI.busyDecrypting}>
            Importieren
        </Button>
    </div>
</Card>

<style lang="postcss">
    /* Card provides border, radius, bg, shadow, padding; the passed class
       lands on the Card root (a child component), so :global. */
    :global(.panel) {
        margin-bottom: 1.5rem;
    }

    .field-label {
        display: block;

        margin-bottom: 0.3rem;

        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    textarea {
        font: inherit;
        width: 100%;

        padding: 0.5rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        &:focus {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
        }
    }

    textarea {
        resize: vertical;
        font-size: var(--fs-3);
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 1rem;
    }
</style>
