<script lang="ts">
    import { resolve } from "$app/paths";
    import { Button, Page, PageHeader } from "#components";

    // P2: the offline page points the user back to the decks — all
    // learning data lives locally, nothing to fetch.
</script>

<svelte:head>
    <title>Offline – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Du bist offline"
        subtitle="Diese Seite braucht eine Internetverbindung. Deine Stapel bleiben lokal gespeichert – sobald du wieder online bist, geht es weiter."
        compact
    />

    <Button variant="primary" href={resolve("/")}>Zur Startseite</Button>
</Page>
