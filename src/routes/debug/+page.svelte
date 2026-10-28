<script lang="ts">
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import SectionLabel from "#lib/components/shared/ui/SectionLabel.svelte";

    import Button from "#lib/components/shared/ui/Button.svelte";
    import CheckBox from "#lib/components/shared/ui/CheckBox.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Dialog from "#lib/components/shared/ui/Dialog.svelte";
    import Dropdown from "#lib/components/shared/ui/Dropdown.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import Badge from "#lib/components/shared/ui/Badge.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";

    import ProgressBar from "#lib/components/shared/ui/ProgressBar.svelte";

    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import { dialogStore } from "#lib/stores/session/dialogStore.svelte";

    // Interactive state for demos.
    let modalOpen = $state(false);
    let checkboxChecked = $state(true);
    let checkboxUnchecked = $state(false);
    let toggleChecked = $state(false);
    let textValue = $state("");
    let textDisabled = $state("Nur lesen");

    // Dialog demos.
    let bgDialogOpen = $state(false);
    let bgDialogVariant = $state<"surface" | "soft" | "primary" | "success" | "danger" | "warning" | "info" | "overview">("surface");
</script>

<svelte:head>
    <title>Komponenten – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Komponenten-Bibliothek"
        subtitle="Alle geteilten UI-Komponenten mit ihren Varianten."
    />

    <!-- ── Button ─────────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Button</SectionLabel>
        <div class="row">
            <Button variant="primary">Primär</Button>
            <Button variant="secondary">Sekundär</Button>
            <Button variant="danger">Löschen</Button>
            <Button variant="overview">Übersicht</Button>
            <Button variant="warning">Achtung</Button>
        </div>
        <div class="row">
            <Button variant="primary" disabled>Deaktiviert</Button>
            <Button href="#">Als Link</Button>
            <Button variant="secondary" onclick={() => toastStore.show("Klick!", "info", 2000)}>
                Mit Klick-Handler
            </Button>
        </div>
    </section>

    <!-- ── Badge ──────────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Badge</SectionLabel>
        <div class="row">
            <Badge>Standard</Badge>
            <Badge variant="primary">Primär</Badge>
            <Badge variant="success">Erfolg</Badge>
            <Badge variant="danger">Fehler</Badge>
            <Badge variant="warning">Warnung</Badge>
            <Badge variant="overview">Übersicht</Badge>
            <Badge variant="info">Info</Badge>
        </div>
    </section>

    <!-- ── CheckBox ───────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>CheckBox</SectionLabel>

        <h3 class="sub-label">Basis</h3>
        <div class="col">
            <CheckBox label="Ausgewählt" bind:checked={checkboxChecked} />
            <CheckBox label="Nicht ausgewählt" bind:checked={checkboxUnchecked} />
            <CheckBox label="Deaktiviert (an)" checked={true} disabled />
            <CheckBox label="Deaktiviert (aus)" checked={false} disabled />
        </div>
        <p class="state-readout">
            State: {checkboxChecked ? "an" : "aus"} / {checkboxUnchecked ? "an" : "aus"}
        </p>

        <h3 class="sub-label">Farbvarianten (ausgewählt)</h3>
        <div class="col">
            <CheckBox label="Primär" variant="primary" checked={true} onchange={() => {}} />
            <CheckBox label="Erfolg" variant="success" checked={true} onchange={() => {}} />
            <CheckBox label="Gefahr" variant="danger" checked={true} onchange={() => {}} />
            <CheckBox label="Warnung" variant="warning" checked={true} onchange={() => {}} />
            <CheckBox label="Info" variant="info" checked={true} onchange={() => {}} />
            <CheckBox label="Übersicht" variant="overview" checked={true} onchange={() => {}} />
        </div>

        <h3 class="sub-label">Größen</h3>
        <div class="col">
            <CheckBox label="Größe: sm" size="sm" bind:checked={checkboxChecked} />
            <CheckBox label="Größe: md (Standard)" size="md" bind:checked={checkboxChecked} />
            <CheckBox label="Größe: lg" size="lg" bind:checked={checkboxChecked} />
        </div>

        <h3 class="sub-label">Variante + Größe kombiniert</h3>
        <div class="col">
            <CheckBox label="Erfolg, klein" variant="success" size="sm" checked={true} onchange={() => {}} />
            <CheckBox label="Gefahr, groß" variant="danger" size="lg" checked={true} onchange={() => {}} />
            <CheckBox label="Warnung, mittel" variant="warning" size="md" checked={true} onchange={() => {}} />
        </div>
    </section>

    <!-- ── Toggle ─────────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Toggle (Switch)</SectionLabel>

        <h3 class="sub-label">Basis</h3>
        <div class="col">
            <Toggle label="Einstellung aktivieren" checked={toggleChecked} onchange={(v) => (toggleChecked = v)} />
            <Toggle label="Deaktiviert (aus)" checked={false} disabled onchange={() => {}} />
            <Toggle label="Deaktiviert (an)" checked={true} disabled onchange={() => {}} />
        </div>
        <p class="state-readout">State: {toggleChecked ? "an" : "aus"}</p>

        <h3 class="sub-label">Farbvarianten (aktiviert)</h3>
        <div class="col">
            <Toggle label="Primär" variant="primary" checked={true} onchange={() => {}} />
            <Toggle label="Erfolg" variant="success" checked={true} onchange={() => {}} />
            <Toggle label="Gefahr" variant="danger" checked={true} onchange={() => {}} />
            <Toggle label="Warnung" variant="warning" checked={true} onchange={() => {}} />
            <Toggle label="Info" variant="info" checked={true} onchange={() => {}} />
            <Toggle label="Übersicht" variant="overview" checked={true} onchange={() => {}} />
        </div>

        <h3 class="sub-label">Größen</h3>
        <div class="col">
            <Toggle label="Größe: sm" size="sm" checked={toggleChecked} onchange={(v) => (toggleChecked = v)} />
            <Toggle label="Größe: md (Standard)" size="md" checked={toggleChecked} onchange={(v) => (toggleChecked = v)} />
            <Toggle label="Größe: lg" size="lg" checked={toggleChecked} onchange={(v) => (toggleChecked = v)} />
        </div>

        <h3 class="sub-label">Variante + Größe kombiniert</h3>
        <div class="col">
            <Toggle label="Erfolg, klein" variant="success" size="sm" checked={true} onchange={() => {}} />
            <Toggle label="Gefahr, groß" variant="danger" size="lg" checked={true} onchange={() => {}} />
            <Toggle label="Info, mittel" variant="info" size="md" checked={true} onchange={() => {}} />
        </div>
    </section>

    <!-- ── TextInput ──────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>TextInput</SectionLabel>
        <div class="col-narrow">
            <TextInput label="Name" placeholder="Ihr Name" bind:value={textValue} />
            <TextInput label="E-Mail" type="email" placeholder="beispiel@domain.de" />
            <TextInput label="Pflichtfeld" required placeholder="Muss ausgefüllt werden" />
            <TextInput label="Deaktiviert" value={textDisabled} disabled />
            <TextInput label="Passwort" type="password" placeholder="••••••••" />
        </div>
        {#if textValue}
            <p class="state-readout">Eingabe: {textValue}</p>
        {/if}
    </section>

    <!-- ── Card ───────────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Card</SectionLabel>

        <h3 class="sub-label">Padding-Varianten</h3>
        <div class="card-grid">
            <Card padding="sm"><strong>Padding: sm</strong><p>Kleine Polsterung.</p></Card>
            <Card padding="md"><strong>Padding: md</strong><p>Standard-Polsterung (Default).</p></Card>
            <Card padding="lg"><strong>Padding: lg</strong><p>Große Polsterung.</p></Card>
        </div>

        <h3 class="sub-label">Mit Hover-Effekt</h3>
        <div class="card-grid">
            <Card hover><strong>Ohne Link</strong><p>Hebt sich beim Hovern an.</p></Card>
            <Card hover href="#"><strong>Als Link</strong><p>Klickbare Karte mit Hover.</p></Card>
        </div>

        <h3 class="sub-label">Mit Header &amp; Footer</h3>
        <div class="card-grid">
            <Card>
                {#snippet header()}Kartentitel{/snippet}
                Hauptinhalt der Karte mit beliebigem Text.
                {#snippet footer()}
                    <Button variant="primary">Aktion</Button>
                    <Button variant="secondary">Abbrechen</Button>
                {/snippet}
            </Card>
            <Card hover href="#">
                {#snippet header()}Klickbarer Titel{/snippet}
                Diese gesamte Karte ist ein Link.
            </Card>
        </div>

        <h3 class="sub-label">Hintergrundfarben (ohne Hover)</h3>
        <div class="card-grid">
            <Card bg="surface"><strong>surface</strong><p>Standard-Weiß</p></Card>
            <Card bg="soft"><strong>soft</strong><p>Leicht getönt</p></Card>
            <Card bg="primary"><strong>primary</strong><p>Primär-soft</p></Card>
            <Card bg="success"><strong>success</strong><p>Erfolg</p></Card>
            <Card bg="danger"><strong>danger</strong><p>Gefahr</p></Card>
            <Card bg="warning"><strong>warning</strong><p>Warnung</p></Card>
            <Card bg="info"><strong>info</strong><p>Info</p></Card>
            <Card bg="overview"><strong>overview</strong><p>Übersicht</p></Card>
        </div>

        <h3 class="sub-label">Hintergrundfarben mit Hover-Grad</h3>
        <div class="card-grid">
            <Card bg="surface" hover><strong>surface</strong><p>Hover: surface-hover</p></Card>
            <Card bg="soft" hover><strong>soft</strong><p>Hover: surface-hover</p></Card>
            <Card bg="primary" hover><strong>primary</strong><p>Hover: dunklere Stufe</p></Card>
            <Card bg="success" hover><strong>success</strong><p>Hover: success-hover</p></Card>
            <Card bg="danger" hover><strong>danger</strong><p>Hover: danger-hover</p></Card>
            <Card bg="warning" hover><strong>warning</strong><p>Hover: warning-hover</p></Card>
            <Card bg="info" hover><strong>info</strong><p>Hover: info-hover</p></Card>
            <Card bg="overview" hover><strong>overview</strong><p>Hover: dunklere Stufe</p></Card>
        </div>
    </section>

    <!-- ── Dialog (Modal) ─────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Dialog – Modal</SectionLabel>
        <div class="row">
            <Button variant="primary" onclick={() => (modalOpen = true)}>
                Modal öffnen
            </Button>
        </div>
        <Dialog title="Beispieldialog" bind:open={modalOpen}>
            <p>Dies ist ein modales Dialogfenster über einem halbtransparenten Hintergrund.</p>
            <p>Schließen Sie es über den X-Button, einen Klick auf den Hintergrund oder die Escape-Taste.</p>
            {#snippet footer()}
                <Button variant="secondary" onclick={() => (modalOpen = false)}>Abbrechen</Button>
                <Button variant="primary" onclick={() => (modalOpen = false)}>Bestätigen</Button>
            {/snippet}
        </Dialog>
    </section>

    <!-- ── Dialog: Hintergrundfarben ──────────────────────────── -->
    <section class="section">
        <SectionLabel>Dialog – Hintergrundfarben</SectionLabel>
        <div class="row">
            <Button variant="secondary" onclick={() => { bgDialogVariant = "surface"; bgDialogOpen = true; }}>surface</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "soft"; bgDialogOpen = true; }}>soft</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "primary"; bgDialogOpen = true; }}>primary</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "success"; bgDialogOpen = true; }}>success</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "danger"; bgDialogOpen = true; }}>danger</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "warning"; bgDialogOpen = true; }}>warning</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "info"; bgDialogOpen = true; }}>info</Button>
            <Button variant="secondary" onclick={() => { bgDialogVariant = "overview"; bgDialogOpen = true; }}>overview</Button>
        </div>
        <Dialog title="Hintergrund: {bgDialogVariant}" bg={bgDialogVariant} bind:open={bgDialogOpen}>
            <p>Dieser Dialog hat die Hintergrundfarbe <strong>{bgDialogVariant}</strong>. Header und Footer verwenden eine leicht abgedunkelte Stufe.</p>
            {#snippet footer()}
                <Button variant="primary" onclick={() => (bgDialogOpen = false)}>Schließen</Button>
            {/snippet}
        </Dialog>
    </section>

    <!-- ── Dropdown ───────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Dropdown (einklappbar)</SectionLabel>

        <h3 class="sub-label">Einklappbar</h3>
        <Dropdown title="Standardmäßig geöffnet" open={true}>
            <p>Dieser Inhalt ist zunächst sichtbar und kann über den Header eingeklappt werden.</p>
            <p>Das Chevron dreht sich je nach Zustand.</p>
            {#snippet footer()}
                <Button variant="secondary">Aktion</Button>
            {/snippet}
        </Dropdown>

        <div style="margin-top: 0.8rem;">
            <Dropdown title="Standardmäßig eingeklappt" open={false}>
                <p>Dieser Inhalt ist zunächst verborgen.</p>
            </Dropdown>
        </div>

        <h3 class="sub-label">Nicht schließbar (persistent)</h3>
        <Dropdown title="Immer geöffnet" persistent>
            <p>Dieser Dropdown ist <strong>nicht schließbar</strong>: Die Kopfzeile ist statisch (kein Klick, kein Chevron) und der Inhalt ist immer sichtbar.</p>
        </Dropdown>

        <div style="margin-top: 0.8rem;">
            <Dropdown title="Persistent mit Hintergrund" persistent bg="info">
                <p>Nicht schließbar mit Hintergrund <strong>info</strong>.</p>
                {#snippet footer()}
                    <Button variant="secondary">Aktion</Button>
                {/snippet}
            </Dropdown>
        </div>

        <h3 class="sub-label">Hintergrundfarben (einklappbar)</h3>
        <div class="dropdown-grid">
            <Dropdown title="surface" bg="surface" open={true}><p>Standard-Weiß</p></Dropdown>
            <Dropdown title="soft" bg="soft" open={true}><p>Leicht getönt</p></Dropdown>
            <Dropdown title="primary" bg="primary" open={true}><p>Primär-soft</p></Dropdown>
            <Dropdown title="success" bg="success" open={true}><p>Erfolg</p></Dropdown>
            <Dropdown title="danger" bg="danger" open={true}><p>Gefahr</p></Dropdown>
            <Dropdown title="warning" bg="warning" open={true}><p>Warnung</p></Dropdown>
            <Dropdown title="info" bg="info" open={true}><p>Info</p></Dropdown>
            <Dropdown title="overview" bg="overview" open={true}><p>Übersicht</p></Dropdown>
        </div>
    </section>

    <!-- ── ProgressBar ────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>ProgressBar</SectionLabel>

        <h3 class="sub-label">Füllgrade</h3>
        <div class="col-narrow">
            <div><p class="progress-label">0 %</p><ProgressBar ratio={0} /></div>
            <div><p class="progress-label">25 %</p><ProgressBar ratio={0.25} /></div>
            <div><p class="progress-label">50 %</p><ProgressBar ratio={0.5} /></div>
            <div><p class="progress-label">75 %</p><ProgressBar ratio={0.75} /></div>
            <div><p class="progress-label">100 %</p><ProgressBar ratio={1} /></div>
            <div><p class="progress-label">Höhe: 8px</p><ProgressBar ratio={0.6} height="8px" /></div>
        </div>

        <h3 class="sub-label">Farbvarianten (jeweils 60 %)</h3>
        <div class="col-narrow">
            <div><p class="progress-label">primary</p><ProgressBar ratio={0.6} color="primary" /></div>
            <div><p class="progress-label">success</p><ProgressBar ratio={0.6} color="success" /></div>
            <div><p class="progress-label">danger</p><ProgressBar ratio={0.6} color="danger" /></div>
            <div><p class="progress-label">warning</p><ProgressBar ratio={0.6} color="warning" /></div>
            <div><p class="progress-label">info</p><ProgressBar ratio={0.6} color="info" /></div>
            <div><p class="progress-label">overview</p><ProgressBar ratio={0.6} color="overview" /></div>
        </div>
    </section>

    <!-- ── EmptyNote ──────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>EmptyNote</SectionLabel>
        <p class="empty">Keine Stapel gefunden. Lade einen eigenen Stapel hoch.</p>
    </section>

    <!-- ── Toast Store ────────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Toast Store</SectionLabel>
        <p class="section-desc">
            Programmatische Toasts über <code>toastStore.show()</code>. Werden vom <code>ToastHost</code> im Layout gerendert.
        </p>
        <div class="row">
            <Button variant="secondary" onclick={() => toastStore.show("Dies ist eine Info-Meldung.", "info", 0)}>Info (persistent)</Button>
            <Button variant="secondary" onclick={() => toastStore.success("Erfolgreich gespeichert!")}>Erfolg (3 s)</Button>
            <Button variant="secondary" onclick={() => toastStore.warning("Achtung, etwas ist schiefgelaufen.")}>Warnung (5 s)</Button>
            <Button variant="secondary" onclick={() => toastStore.error("Ein Fehler ist aufgetreten.")}>Fehler (persistent)</Button>
        </div>
        <div class="row">
            <Button variant="secondary" onclick={() => toastStore.show("Bitte bestätige diese Aktion.", "info", 0, { title: "Aktion erforderlich", actionLabel: "Bestätigen", onAction: () => toastStore.success("Bestätigt!") })}>
                Mit Titel + Aktion
            </Button>
            <Button variant="secondary" onclick={() => toastStore.clear()}>Alle entfernen</Button>
        </div>
    </section>

    <!-- ── Dialog Store ───────────────────────────────────────── -->
    <section class="section">
        <SectionLabel>Dialog Store</SectionLabel>
        <p class="section-desc">
            Programmatische Dialoge über <code>dialogStore</code>. <code>open()</code> gibt ein Promise zurück.
        </p>
        <div class="row">
            <Button
                variant="primary"
                onclick={async () => {
                    const ok = await dialogStore.open({
                        title: "Aktion bestätigen",
                        message: "Möchtest du diese Aktion wirklich ausführen?",
                        confirmLabel: "Bestätigen",
                        cancelLabel: "Abbrechen",
                    });
                    if (ok) toastStore.success("Aktion bestätigt!");
                    else toastStore.show("Aktion abgebrochen.", "info", 2000);
                }}
            >
                Confirm-Dialog
            </Button>
            <Button
                variant="danger"
                onclick={async () => {
                    const ok = await dialogStore.open({
                        title: "Stapel löschen",
                        message: "Dieser Stapel wird endgültig gelöscht. Fortfahren?",
                        bg: "danger",
                        confirmLabel: "Löschen",
                        cancelLabel: "Abbrechen",
                    });
                    if (ok) toastStore.success("Stapel gelöscht.");
                }}
            >
                Confirm (danger)
            </Button>
            <Button
                variant="warning"
                onclick={() => {
                    dialogStore.open({
                        title: "Nur Information",
                        message: "Dieser Dialog hat nur einen Schließen-Button.",
                        bg: "warning",
                        confirmLabel: "Verstanden",
                        cancelLabel: undefined,
                    });
                }}
            >
                Info-Dialog (kein Abbrechen)
            </Button>
        </div>
    </section>
</Page>

<style>
    .section { margin-bottom: 2.5rem; }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: 0.95rem;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.7rem;
    }

    .col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.7rem;
    }

    .col-narrow {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 22rem;
    }

    .sub-label {
        margin: 1.25rem 0 0.6rem;
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .sub-label:first-of-type { margin-top: 0.9rem; }

    .section-desc {
        margin: 0 0 0.9rem;
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.6;
    }

    .section-desc code {
        padding: 0.1rem 0.35rem;
        border-radius: var(--radius-sm);
        background: var(--surface-soft);
        font-size: 0.82rem;
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
        gap: 0.8rem;
    }

    .dropdown-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        gap: 0.8rem;
        align-items: start;
    }

    .card-grid p {
        margin: 0.3rem 0 0;
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .state-readout {
        margin: 0.6rem 0 0;
        color: var(--text-muted);
        font-size: 0.82rem;
        font-variant-numeric: tabular-nums;
    }

    .progress-label {
        margin: 0 0 0.3rem;
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    @media (max-width: 540px) {
        .row { gap: 0.5rem; }
        .card-grid { grid-template-columns: 1fr; }
    }
</style>
