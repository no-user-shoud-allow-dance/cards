<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { InlineStatus, goToImport, handOffMarkdown } from "#components";
    import { ServerShareError, core, fetchServerLinkMarkdown, messages } from "#lib";

    let errorText = $state("");

    onMount(() => {
        void (async () => {
            try {
                // id and key are dot-separated in the path — no URL fragment.
                const id = core.makeShareId(page.params.id ?? "");
                const key = core.makeShareKey(page.params.key ?? "");
                // The key never leaves this device: only the id is sent.
                const markdown = await fetchServerLinkMarkdown(id, key);
                handOffMarkdown(markdown);
                await goToImport();
            } catch (e) {
                errorText = e instanceof ServerShareError ? e.message : messages.messageOf(e);
            }
        })();
    });
</script>

<svelte:head>
    <title>{messages.UI.serverLink} – NSC</title>
</svelte:head>

<InlineStatus error={errorText} loading="Server-Link wird entschlüsselt …" />
