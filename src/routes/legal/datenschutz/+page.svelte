<script lang="ts">
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";
</script>

<svelte:head>
    <title>Datenschutz – NSC</title>
</svelte:head>

<PageHeader
    title="Datenschutzerklärung"
    subtitle="Kurz und verständlich erklärt."
/>

<Card bg="primary" padding="md" class="legal-notice">
    <strong>Hinweis:</strong>
    <br />
    Diese App speichert <Badge variant="primary">alle Daten</Badge> – Ordner, Stapel,
    Karten und Lernfortschritt – ausschließlich <Badge variant="overview"
        >lokal</Badge
    > auf deinem Gerät. Es findet keine Übertragung an einen Server statt; es gibt
    keine Konten, kein Tracking und keine Analyse-Tools.
</Card>

<p>
    Haben Sie Fragen? Schreiben Sie an <a href="mailto:nousad@web.de"
        >nousad@web.de</a
    >.
</p>

<h2>Ihre Daten bleiben auf Ihrem Gerät</h2>
<p>
    NSC ist eine reine Browser-App ohne Nutzerkonten.
    <span class="key-statement">
        Es gibt <strong>keine</strong> Registrierung, und es werden
        <strong>keine</strong> Daten auf einem Server gespeichert.
    </span>
    Alles, was anfällt, liegt lokal in Ihrem Browser:
</p>
<ul>
    <li>
        <Badge variant="primary">Local Storage</Badge>: Lernfortschritt,
        Einstellungen (z. B.
        <Badge variant="primary">Pur-Modus</Badge>), Lernzeit und Timer.
    </li>
    <li>
        <Badge variant="primary">IndexedDB</Badge>: Stapel, die Sie selbst
        hochladen (Ordner, Name und Kartentext).
    </li>
</ul>
<p>
    <span class="key-statement">
        Es werden <strong>keine</strong> Cookies gesetzt,
        <strong>keine</strong> Tracker oder Analyse-Dienste eingesetzt und
        <strong>keine</strong> Werbung angezeigt.
    </span>
    Die Übertragung der Seite erfolgt verschlüsselt über
    <Badge variant="primary">HTTPS</Badge>.
</p>
<p>
    Um vor nicht dauerhaft gespeicherten Daten zu warnen, prüft die App beim
    Laden einmalig, ob Ihr Browser im Inkognito-/Privatmodus läuft. Diese
    Prüfung läuft vollständig lokal in Ihrem Browser; es werden dabei keine
    Daten übertragen.
</p>

<strong>Teilen-Links:</strong> Geteilte Stapel stecken komprimiert in der URL
(im Hash).
<span class="key-statement">
    Der Hash wird <strong>nicht</strong> an den Server gesendet.
</span>

<h2>Dienste von Drittanbietern</h2>
<ul>
    <li>
        <strong>Hosting:</strong>
        <br />
        Die App wird über
        <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer"
            >Vercel</a
        >
        ausgeliefert. Dabei verarbeitet der Anbieter technisch notwendige
        <Badge variant="primary">Verbindungsdaten</Badge> (z. B. Ihre
        <Badge variant="primary">IP-Adresse</Badge>), um die Seite zu laden.
        Datenschutzerklärung:
        <a
            href="https://vercel.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer">Vercel</a
        >
    </li>
    <li>
        <strong>Schriftarten:</strong>
        <br />
        {#if settingStore.googleDisabled}
            <i
                >Ausgeschaltet — über den Schalter unten können Sie Google
                wieder aktivieren.</i
            >
        {:else}
            Beim Laden der App werden Schriftarten von
            <Badge variant="primary">Google Fonts</Badge>
            nachgeladen; dabei wird Ihre
            <Badge variant="primary">IP-Adresse</Badge>
            an Google übertragen. Datenschutzerklärung:
            <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer">Google</a
            >
        {/if}
    </li>
    <li>
        <strong>Hilfe- und Mnemotechnik-Suche:</strong>
        <br />
        {#if settingStore.googleDisabled}
            <i
                >Ausgeschaltet — über den Schalter unten können Sie Google
                wieder aktivieren.</i
            >
        {:else}
            Diese Schaltflächen öffnen eine
            <Badge variant="primary">Google-Suche</Badge> in einem neuen Tab. Dabei
            wird eine Suchanfrage mit dem jeweiligen Wort an Google übertragen —
            erst auf Ihren Klick hin. Datenschutzerklärung:
            <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer">Google</a
            >
        {/if}
    </li>
</ul>

<div class="google-toggle">
    <Toggle
        label="Google erlauben"
        checked={!settingStore.googleDisabled}
        onchange={(value) => settingStore.setGoogleDisabled(!value)}
    />
    <p>
        Lädt Schriftarten von Google Fonts nach und blendet die Hilfe- und
        Mnemotechnik-Suche ein, die eine Google-Suche öffnet.
    </p>
</div>

<h2>Inhalte und Urheberrecht</h2>
<ul>
    <li>
        <strong>Hochgeladene Stapel</strong> stammen von Ihnen. Sie sind dafür verantwortlich,
        dass Sie die nötigen Rechte an den Inhalten besitzen.
    </li>
    <li>
        <strong>Geteilte Stapel</strong> gehen an die Personen, denen Sie den Link
        schicken. Teilen Sie nur Inhalte, die Sie verbreiten dürfen.
    </li>
</ul>
<p>
    Die Software selbst ist als Public Domain (Unlicense) freigegeben und darf
    frei genutzt, verändert und weitergegeben werden.
</p>

<h2>Fragen oder Daten löschen?</h2>
<p>
    Da alles lokal in Ihrem Browser gespeichert ist, können Sie Ihre Daten
    jederzeit löschen, indem Sie die
    <Badge variant="primary">Website-Daten</Badge> dieser Seite in den Einstellungen
    Ihres Browsers entfernen. Bei Fragen schreiben Sie an
    <a href="mailto:nousad@web.de">nousad@web.de</a>.
</p>

<style>
    i {
        color: var(--text-muted);
    }

    .key-statement {
        text-decoration: underline;
        text-decoration-color: var(--primary);
        text-decoration-thickness: 1.5px;
        text-underline-offset: 3px;
    }

    /* Card provides bg-primary; only the left accent border + spacing remain. */
    .legal-notice {
        margin: 1.5rem 0;
        border-left: 4px solid var(--primary);
    }

    .legal-notice :global(.card-body p) {
        margin: 0;
        line-height: 1.7;
    }

    .google-toggle {
        margin: 0.25rem 0 1.25rem;
    }

    .google-toggle p {
        margin: 0.45rem 0 0;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }
</style>
