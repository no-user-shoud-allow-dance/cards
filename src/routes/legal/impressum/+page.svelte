<script lang="ts">
    import { resolve } from "$app/paths";
    import PageHeader from "#lib/components/shared/PageHeader.svelte";
</script>

<svelte:head>
    <title>Impressum – NSC</title>
</svelte:head>

<PageHeader
    title="Impressum"
    subtitle="NSC ist ein privates, nicht-kommerzielles Projekt."
/>

<p>
    Haben Sie Fragen? Schreiben Sie an
    <a href="mailto:nousad@web.de">nousad@web.de</a>.
</p>

<h2>Software und Inhalte</h2>
<p>
    Die Software ist als Public Domain (Unlicense) freigegeben und darf
    ohne Einschränkungen genutzt, verändert und weitergegeben werden. Die
    Rechte an den Lerninhalten (Stapel und Karten) verbleiben bei den
    jeweiligen Autorinnen und Autoren.
</p>
<p>
    Eingebundene Bibliotheken von Drittanbietern — derzeit
    <strong>Svelte</strong>, <strong>SvelteKit</strong> und
    <strong>detectIncognito.js</strong> (jeweils MIT License) — sind auf
    der Seite
    <a href={resolve("/legal/lizenzen")}>Lizenzen</a> mit vollständigem
    Lizenztext aufgeführt.
</p>
<p>
    Hinweise zur Verarbeitung personenbezogener Daten und zu den Rechten
    an den Inhalten finden Sie in der
    <a href={resolve("/legal/datenschutz")}>Datenschutzerklärung</a>.
</p>
