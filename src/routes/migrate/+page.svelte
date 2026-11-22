<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { Button, Page, PageHeader, Spinner } from "#components";
    import { migrateV1Once } from "#lib";
    import { MIGRATION } from "#messages/locale.svelte";

    // One-shot landing page of the 1.0.0 → 2.0.0 data migration. The
    // root layout's boot gate bounces every path here while a pending
    // v1 migration exists; this page runs it and bounces back to the
    // originally requested path (a hard navigation, so every store
    // re-initializes with the migrated records).
    //
    // The migration is idempotent per record and marks itself done even
    // on failure — the user always gets the app back, never a redirect
    // loop. A failed run leaves all v1 records intact; the wording says
    // exactly that.

    /** True when the migration run rejected (explanation + exit below). */
    let failed = $state(false);

    /** The originally requested path captured by the boot gate; "/" as fallback. */
    const back = $derived.by(() => {
        const target = page.url.searchParams.get("back") ?? "/";
        // Same-origin paths only — never a protocol-relative jump.
        return target.startsWith("/") && !target.startsWith("//") ? target : "/";
    });

    function backToApp(): void {
        window.location.replace(back);
    }

    onMount(() => {
        void migrateV1Once()
            .then(backToApp)
            .catch(() => {
                failed = true;
            });
    });
</script>

<svelte:head>
    <title>{MIGRATION.title}</title>
</svelte:head>

<Page>
    {#if failed}
        <PageHeader title={MIGRATION.failedTitle} subtitle={MIGRATION.failedText} compact />
        <Button variant="primary" onclick={backToApp}>{MIGRATION.continueAction}</Button>
    {:else}
        <PageHeader title={MIGRATION.title} subtitle={MIGRATION.running} compact />
        <div class="spinner">
            <Spinner size={56} label={MIGRATION.running} />
        </div>
    {/if}
</Page>

<style lang="postcss">
    .spinner {
        display: grid;
        place-items: center;
        min-height: 30vh;
    }
</style>
