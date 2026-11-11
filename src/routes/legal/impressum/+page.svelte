<script lang="ts">
    import { resolve } from "$app/paths";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";

    let { data } = $props();

    // Imprint data comes from the environment (.env / Vercel env settings),
    // never from the source code — see +page.server.ts and .env.example.
    const imprintComplete = $derived(
        Boolean(
            data.impressum.name && data.impressum.street && data.impressum.city,
        ),
    );
</script>

<svelte:head>
    <title>Impressum – NSC</title>
</svelte:head>

<PageHeader
    title="Impressum"
    subtitle="NSC ist ein privates, nicht-kommerzielles Projekt."
/>

<h2>Diensteanbieter</h2>

<Card bg="danger" padding="md" class="legal-notice">
    {#if data.impressum.email}
        <a href="mailto:{data.impressum.email}">{data.impressum.email}</a>
        <i>
            — schnelle elektronische Kontaktaufnahme nach § 5 Abs. 1 Nr. 2 DDG.
        </i>
    {/if}

    {#if imprintComplete}
        <hr />
        <p>
            Verantwortlich für diese Website nach § 5 Abs. 1 DDG und
            Verantwortlicher im Sinne von Art. 4 Nr. 7 DSGVO:
        </p>
        <address class="impressum-address">
            {data.impressum.name}<br />
            {data.impressum.street}<br />
            {#if data.impressum.zip}{data.impressum.zip}{/if}
            {data.impressum.city}<br />
            {#if data.impressum.country}{data.impressum.country}{/if}
        </address>
    {/if}
</Card>

<h2>Software und Inhalte</h2>
<p>
    Die Software ist als Public Domain (Unlicense) freigegeben und darf ohne
    Einschränkungen genutzt, verändert und weitergegeben werden. Die Rechte an
    den Lerninhalten (Stapel und Karten) verbleiben bei den jeweiligen
    Autorinnen und Autoren.
</p>
<p>
    Eingebundene Bibliotheken von Drittanbietern — derzeit
    <strong>Svelte</strong>, <strong>SvelteKit</strong>,
    <strong>detectIncognito.js</strong>, <strong>qr-code-styling</strong>
    und <strong>qrcode-generator</strong> (jeweils MIT License) — sind auf der
    Seite
    <a href={resolve("/legal/lizenzen")}>Lizenzen</a> mit vollständigem Lizenztext
    aufgeführt.
</p>
<p>
    Hinweise zur Verarbeitung personenbezogener Daten und zu den Rechten an den
    Inhalten finden Sie in der
    <a href={resolve("/legal/datenschutz")}>Datenschutzerklärung</a>.
</p>

<style>
    .impressum-address {
        margin: 0.5rem 0 1rem;

        font-style: normal;
        line-height: 1.7;
    }
</style>
