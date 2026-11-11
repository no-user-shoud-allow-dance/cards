<script lang="ts">
    import { resolve } from "$app/paths";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";

    let { data } = $props();

    // Contact email from the environment (IMPRESSUM_EMAIL), never hardcoded
    // in the source — loaded server-side in +page.server.ts.
    const contactEmail = $derived(data.contactEmail);
</script>

<svelte:head>
    <title>Datenschutz – NSC</title>
</svelte:head>

<PageHeader
    title="Datenschutzerklärung"
    subtitle="Klar und verständlich formuliert."
/>

<Card bg="primary" padding="md" class="legal-notice">
    <strong>Das Wichtigste vorab:</strong>
    <br />
    Ihre Stapel, Karten und Ihr Lernfortschritt werden ausschließlich
    <Badge variant="primary">lokal auf Ihrem Gerät</Badge> gespeichert. Es gibt
    keine Konten, keine Werbung und kein Tracking. Nur wenn Sie freiwillig einen
    verschlüsselten Server-Link für einen zu großen Stapel erstellen, werden
    ausschließlich <strong>Chiffrat und technische Metadaten</strong> auf einem
    Server gespeichert — Details siehe „Verschlüsselte Server-Links“ unten.
</Card>

<p>
    Bei Fragen schreiben Sie an
    {#if contactEmail}
        <a href="mailto:{contactEmail}">{contactEmail}</a>.
    {:else}
        den im <a href={resolve("/legal/impressum")}>Impressum</a> genannten
        Verantwortlichen.
    {/if}
</p>

<h2>Lokal-first: Ihre Daten bleiben auf Ihrem Gerät</h2>
<p>
    NSC ist eine reine Browser-App ohne Nutzerkonten.
    <span class="key-statement">
        Es gibt <strong>keine</strong> Registrierung, und es werden
        <strong>grundsätzlich keine</strong> Daten auf einem Server gespeichert
    </span>
    — die einzige Ausnahme ist der freiwillige verschlüsselte Server-Link
    (siehe unten), bei dem nur Chiffrat und technische Metadaten anfallen.
    Alle übrigen Daten liegen lokal in Ihrem Browser:
</p>
<ul>
    <li>
        <strong>Ihre Stapel</strong> — Ordner, Name und Kartentext der
        hochgeladenen oder selbst erstellten Decks.
    </li>
    <li>
        <strong>Ihr Lernfortschritt und Ihre Einstellungen</strong> — in
        welcher Box jede Karte liegt, Pur-Modus, Lernzeit und Timer sowie
        die lokal erzeugte Profil-ID für die Synchronisation.
    </li>
</ul>
<p>
    Es werden <strong>keine</strong> Cookies gesetzt,
    <strong>keine</strong> Tracker oder Analyse-Dienste eingesetzt und
    <strong>keine</strong> Werbung angezeigt. Die Seite wird verschlüsselt
    über <Badge variant="primary">HTTPS</Badge> übertragen.
</p>
<p>
    Beim Laden prüft die App einmalig, ob Ihr Browser im Inkognito-/Privatmodus
    läuft, um Sie darauf hinzuweisen, dass lokal gespeicherte Daten in diesem
    Modus nicht dauerhaft erhalten bleiben. Diese Prüfung läuft vollständig
    lokal in Ihrem Browser; es werden dabei keine Daten übertragen.
</p>

<h2>Teilen-Links</h2>
<p>
    Geteilte Stapel stecken komprimiert in der URL, hinter dem
    <Badge variant="primary">#</Badge> (dem Hash). Der Hash wird
    <span class="key-statement">
        <strong>nicht</strong> an den Server gesendet
    </span>
    und verlässt Ihren Browser nicht. Beachten Sie: Jeder, der den Link erhält,
    kann den Stapel lesen. Teilen Sie Links daher nur mit Personen, die die
    Inhalte sehen dürfen.
</p>

<h2>Verschlüsselte Server-Links für große Stapel (freiwillig)</h2>
<p>
    Ist ein Stapel zu groß für einen QR-Code, kann er als
    <strong>verschlüsselter Server-Link</strong> geteilt werden
    (<Badge variant="primary">…/#k.…</Badge>). Dafür wird der Stapel im
    Browser mit <Badge variant="primary">AES-256-GCM</Badge> verschlüsselt;
    der 256-Bit-Schlüssel liegt ausschließlich im URL-Fragment
    (<Badge variant="primary">#k.…</Badge>). Das Fragment ist ein rein
    clientseitiger Teil der URL und wird
    <span class="key-statement">
        <strong>nie</strong> in einer HTTP-Anfrage an den Server gesendet
    </span>
    — der Server (Vercel KV / Upstash) speichert und liefert ausschließlich
    das Chiffrat. Erst nach dem Entschlüsseln im Browser steht der Stapel
    wieder im Klartext vor, und der normale Import läuft weiter.
</p>
<p>
    <span class="key-statement">
        Beachten Sie: Alles, was die volle URL protokolliert oder überträgt
        (Chat-Apps, Link-Vorschau-Bots, Browser-Synchronisation, Proxys),
        kann den Schlüssel preisgeben.
    </span>
    Behandeln Sie den Link daher wie ein Passwort. Jeder, der Link <em>und</em>
    Schlüssel kennt, kann den Stapel lesen.
</p>

<h3>Welche Daten dabei auf dem Server anfallen (Art. 13 DSGVO)</h3>
<ul>
    <li>
        <strong>Das Chiffrat</strong> des Stapels (unlesbar ohne Schlüssel) sowie
        <strong>Metadaten</strong>: Erstellungszeitpunkt, Größe des Chiffrats
        und Abrufzähler — unter einer zufälligen 128-Bit-ID.
    </li>
    <li>
        <strong>Rate-Limit-Daten:</strong> Zur Missbrauchsverhinderung wird
        Ihre <strong>IP-Adresse nicht im Klartext</strong> gespeichert, sondern
        nur als keyed Hash (HMAC-SHA-256 mit einem server-seitigen geheimen
        Schlüssel — Pseudonymisierung nach Art. 4 Nr. 5 DSGVO), zusammen mit
        einem Zeitstempel des Abrufs.
    </li>
</ul>

<h3>Zweck, Rechtsgrundlage und Speicherdauer</h3>
<p>
    <strong>Zweck:</strong> Bereitstellung und Absicherung der freiwilligen
    Server-Link-Funktion (Abruf der Chiffrate, Missbrauchs-/Rate-Limit-Schutz).
    <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO — die
    vorübergehende, pseudonymisierte Speicherung zum Schutz des Dienstes vor
    Missbrauch ist ein berechtigtes Interesse; Ihre Interessen an der
    Nichtverarbeitung überwiegen nicht, da die Roh-IP nicht gespeichert wird
    und die Daten nur kurz vorgehalten werden.
    <strong>Speicherdauer:</strong> Chiffrat + Metadaten <strong>2 Tage</strong>
    (danach automatische Löschung durch Zeitablauf, keine manuelle Löschung);
    Rate-Limit-Daten <strong>1 Stunde</strong>. Es erfolgen
    <strong>kein Profiling und keine automatisierte Entscheidungsfindung</strong>
    (Art. 22 DSGVO).
</p>

<h3>Empfänger und Drittlandtransfer</h3>
<p>
    Die Daten liegen bei <strong>Vercel Inc.</strong> (Hosting) und der
    Redis-Datenbank <strong>Upstash</strong> (Vercel KV). Beide handeln als
    Auftragsverarbeiter nach Art. 28 DSGVO (Verträge zur Auftragsverarbeitung;
    Vercel ist unter dem <strong>EU-US Data Privacy Framework</strong>
    zertifiziert). Soweit dabei Daten in die USA übertragen werden, dienen
    Art. 44 ff. DSGVO bzw. das Data Privacy Framework als Garantien; für die
    Upstash-Datenbank kann eine <strong>EU-Region</strong> gewählt werden.
    Aufgrund der Ende-zu-Ende-Verschlüsselung können die Anbieter die Inhalte
    nicht lesen. Technisch notwendige Verbindungsdaten (inkl. IP) verarbeitet
    außerdem Vercel beim Ausliefern der Seite selbst — siehe „Hosting“ oben.
</p>

<h3>Ihre Rechte</h3>
<p>
    Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
    Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie
    das Recht, sich bei einer <strong>Aufsichtsbehörde</strong> zu beschweren
    (Art. 77 DSGVO — z. B. die für Ihren Wohnsitz zuständige Behörde). Der
    Verantwortliche im Sinne der DSGVO ist die im
    <a href={resolve("/legal/impressum")}>Impressum</a> genannte Person;
    {#if contactEmail}Kontakt: <a href="mailto:{contactEmail}">{contactEmail}</a>.{/if}
    Aufgrund der kurzen
    Speicherdauer und der Pseudonymisierung können Rechteanfragen nur
    eingeschränkt umgesetzt werden, soweit die Daten noch vorhanden und Ihnen
    zuordenbar sind.
</p>

<h2>Synchronisation zwischen zwei Geräten (PeerJS)</h2>
<p>
    Die einzige Funktion, bei der Daten Ihr Gerät verlassen, ist die
    Synchronisation zweier Ihrer eigenen Geräte (z. B. Laptop und Telefon) über
    <Badge variant="primary">PeerJS</Badge>. Sie ist freiwillig: Sie starten sie
    selbst auf der <a href={resolve("/account")}>Konto-Seite</a> und können sie
    jederzeit beenden. Im Folgenden ist genau beschrieben, welche Daten wohin
    fließen.
</p>
<p>
    <strong>Verbindungsaufbau über einen Signalisierungs-Server.</strong>
    Damit zwei Geräte eine direkte Verbindung aufbauen können, tauschen sie
    zunächst Verbindungsdaten (IP-Adresse, Port und Peer-ID) über den
    Signalisierungs-Server von PeerJS aus. In dieser Phase werden
    <strong>ausschließlich technisch notwendige Verbindungsdaten</strong>
    übertragen — keine Stapel, Karten, Namen oder Fortschrittsdaten.
</p>
<p>
    <strong>Direkte, verschlüsselte Verbindung zwischen den Geräten.</strong>
    Nach dem Verbindungsaufbau kommunizieren die beiden Geräte direkt über
    WebRTC. WebRTC-Verbindungen sind standardmäßig verschlüsselt (DTLS); die
    übertragenen Daten laufen nach dem Handschlag nicht mehr über den
    Signalisierungs-Server.
</p>
<p>
    <strong>Die Peer-ID ist der einzige Zugangsschlüssel.</strong> Das hostende
    Gerät erhält eine zufällige ID (Format
    <Badge variant="primary">nsc-…</Badge>), die Sie per QR-Code oder
    Texteingabe an das zweite Gerät übergeben. Nur wer diese ID kennt, kann
    eine Verbindung herstellen; es gibt keine zusätzliche Konto-ID. Die
    unerratbare ID ist damit das alleinige Vertrauensanker.
</p>
<p>Ein Sync läuft konkret so ab:</p>
<ol>
    <li>
        Auf dem ersten Gerät starten Sie auf der
        <a href={resolve("/account")}>Konto-Seite</a> den Host-Modus. Die App
        zeigt die Peer-ID als Text und als QR-Code an.
    </li>
    <li>
        Auf dem zweiten Gerät scannen Sie den QR-Code oder fügen die ID ein und
        stellen die Verbindung her.
    </li>
    <li>
        Über den Signalisierungs-Server werden einmalig die Verbindungsdaten
        ausgetauscht (IP-Adresse, Port, Peer-ID — keine Inhalte).
    </li>
    <li>Danach baut sich die direkte, verschlüsselte WebRTC-Verbindung auf.</li>
    <li>
        Beide Geräte senden sich ihr Sync-Paket: alle Stapel inklusive
        Markdown-Quelltext sowie der Lernfortschritt je Stapel. Bereits
        vorhandene Stapel werden anhand ihres Inhalts-Hash erkannt und nicht
        dupliziert; beim Fortschritt wird zusammengeführt („die höhere Box
        gewinnt“). Die Lernzeit bleibt gerätelokal und wird nicht synchronisiert.
    </li>
</ol>
<p>
    <span class="key-statement">
        Zusammengefasst: Der Signalisierungs-Server sieht lediglich den kurzen
        Verbindungsaufbau mit IP-Adressen — niemals Inhalte. Übertragen werden
        ausschließlich die Sync-Daten zwischen Ihren beiden Geräten, verschlüsselt
        über die direkte WebRTC-Verbindung.
    </span>
</p>

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
        <strong>Server-Links (Vercel KV / Upstash):</strong>
        <br />
        Nur bei freiwilliger Nutzung der verschlüsselten Server-Links werden
        Chiffrat, Metadaten und pseudonymisierte Rate-Limit-Daten bei Vercel
        (Hosting) und Upstash (Datenbank) verarbeitet — Details und
        Rechtsgrundlagen siehe „Verschlüsselte Server-Links“ oben.
        Datenschutzerklärung:
        <a
            href="https://vercel.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer">Vercel</a
        >,
        <a
            href="https://upstash.com/privacy"
            target="_blank"
            rel="noopener noreferrer">Upstash</a
        >.
    </li>
    <li>
        <strong>Schriftarten:</strong>
        <br />
        {#if settingStore.googleDisabled}
            <i
                >Ausgeschaltet — auf der Konto-Seite können Sie Google wieder
                aktivieren.</i
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
                >Ausgeschaltet — auf der Konto-Seite können Sie Google wieder
                aktivieren.</i
            >
        {:else}
            Diese Schaltflächen öffnen eine
            <Badge variant="primary">Google-Suche</Badge> in einem neuen Tab.
            Dabei wird erst auf Ihren Klick hin eine Suchanfrage mit dem
            jeweiligen Wort an Google übertragen. Datenschutzerklärung:
            <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer">Google</a
            >
        {/if}
    </li>
</ul>

<h2>Inhalte und Urheberrecht</h2>
<ul>
    <li>
        <strong>Hochgeladene Stapel</strong> stammen von Ihnen. Sie sind
        verantwortlich dafür, dass Sie die nötigen Rechte an den Inhalten
        besitzen.
    </li>
    <li>
        <strong>Geteilte Stapel</strong> gehen an die Personen, denen Sie den
        Link senden. Teilen Sie nur Inhalte, die Sie verbreiten dürfen.
    </li>
</ul>
<p>
    Die Software selbst ist als Public Domain (Unlicense) freigegeben und darf
    frei genutzt, verändert und weitergegeben werden.
</p>

<h2>Fragen oder Daten löschen?</h2>
<p>
    Ihre lokal gespeicherten Daten können Sie jederzeit löschen, indem Sie die
    <Badge variant="primary">Website-Daten</Badge> dieser Seite in den
    Einstellungen Ihres Browsers entfernen — oder direkt in der App über
    <strong>„Alle Daten löschen“</strong> auf der
    <a href={resolve("/account")}>Konto-Seite</a>. Server-Links laufen nach
    spätestens <strong>2 Tagen automatisch ab</strong> und werden vom Server
    gelöscht; eine frühere Löschung ist über den Anbieter (Vercel/Upstash) bzw.
    per E-Mail an den Verantwortlichen möglich. Bei Fragen nutzen Sie den
    Kontakt im <a href={resolve("/legal/impressum")}>Impressum</a>.
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

    /* Card provides bg-primary; only the left accent border + spacing remain.
       The class lands on the Card root (a child component), so :global. */
    :global(.legal-notice) {
        margin: 1.5rem 0;
        border-left: 4px solid var(--primary);
    }
</style>
