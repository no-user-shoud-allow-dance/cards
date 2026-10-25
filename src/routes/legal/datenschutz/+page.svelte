<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";
    import Toggle from "#lib/components/shared/Toggle.svelte";
</script>

<svelte:head>
    <title>Datenschutz – NSC</title>
</svelte:head>

<div class="page legal">
    <h1>Datenschutzerklärung</h1>
    <p class="subtitle">Kurz und verständlich erklärt.</p>

    <p>
        Wenn Sie weiterhin irgendwelche Fragen haben, bitte wenden Sie sich an <a
            href="mailto:nousad@web.de">nousad@web.de</a
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
            <span class="term term--primary">Local Storage</span>:
            Lernfortschritt, Einstellungen (z. B.
            <span class="term term--primary">Pur-Modus</span>), Lernzeit und
            Timer.
        </li>
        <li>
            <span class="term term--primary">IndexedDB</span>: Stapel, die Sie
            selbst hochladen (Name, Ordner und Kartentext).
        </li>
    </ul>
    <p>
        <span class="key-statement">
            Es werden <strong>keine</strong> Cookies gesetzt,
            <strong>keine</strong> Tracker oder Analyse-Dienste eingesetzt und
            <strong>keine</strong> Werbung angezeigt.
        </span>
        Die Übertragung der Seite erfolgt verschlüsselt über
        <span class="term term--primary">HTTPS</span>.
    </p>

    <strong>Teilen-Links:</strong> Geteilte Stapel stecken komprimiert in der
    URL (im Hash).
    <span class="key-statement">
        Der Hash wird <strong>nicht</strong> an den Server gesendet.
    </span>

    <h2>Dienste von Drittanbietern</h2>
    <ul>
        <li>
            <strong>Hosting:</strong>
            <br />
            Die App wird über
            <a
                href="https://vercel.com/"
                target="_blank"
                rel="noopener noreferrer">Vercel</a
            >
            ausgeliefert. Dabei verarbeitet der Anbieter technisch notwendige
            <span class="term term--primary">Verbindungsdaten</span> (z. B. Ihre
            <span class="term term--primary">IP-Adresse</span>), um die Seite zu
            laden.
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
            {#if cardStore.googleDisabled}
                <i
                    >Ausgeschaltet — über den Schalter unten können Sie die
                    Suche wieder aktivieren.</i
                >
            {:else}
                Beim Laden der App werden Schriftarten von
                <span class="term term--primary">Google Fonts</span> nachgeladen;
                dabei wird Ihre <span class="term term--primary">IP-Adresse</span>
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
            {#if cardStore.googleDisabled}
                <i
                    >Ausgeschaltet — über den Schalter unten können Sie die
                    Suche wieder aktivieren.</i
                >
            {:else}
                Diese Schaltflächen öffnen eine
                <span class="term term--primary">Google-Suche</span> in einem
                neuen Tab. Dabei wird eine Suchanfrage mit dem jeweiligen Wort
                an Google übertragen — erst auf Ihren Klick hin.
                Datenschutzerklärung:
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
            label="Allow google"
            checked={!cardStore.googleDisabled}
            onchange={(value) => cardStore.setGoogleDisabled(!value)}
        />
        <p>
            Blendet die Hilfe- und Mnemotechnik-Suche ein, die eine Google-Suche
            öffnet.
        </p>
    </div>

    <h2>Inhalte und Urheberrecht</h2>
    <ul>
        <li>
            <strong>Mitgelieferte Stapel</strong> stammen von ihren ursprünglichen
            Autorinnen und Autoren; die Rechte daran bleiben bei ihnen.
        </li>
        <li>
            <strong>Hochgeladene Stapel</strong> stammen von Ihnen. Sie sind dafür
            verantwortlich, dass Sie die nötigen Rechte an den Inhalten besitzen.
        </li>
        <li>
            <strong>Geteilte Stapel</strong> gehen an die Personen, denen Sie den
            Link schicken. Teilen Sie nur Inhalte, die Sie verbreiten dürfen.
        </li>
    </ul>
    <p>
        Die Software selbst ist als Public Domain (Unlicense) freigegeben und
        darf frei genutzt, verändert und weitergegeben werden.
    </p>

    <h2>Fragen oder Daten löschen?</h2>
    <p>
        Da alles lokal in Ihrem Browser gespeichert ist, können Sie Ihre Daten
        jederzeit löschen, indem Sie die
        <span class="term term--primary">Website-Daten</span> dieser Seite in
        den Einstellungen Ihres Browsers entfernen. Bei Fragen schreiben Sie an
        <a href="mailto:nousad@web.de">nousad@web.de</a>.
    </p>
</div>

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
