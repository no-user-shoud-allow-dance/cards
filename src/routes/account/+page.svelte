<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import { syncStore } from "#lib/sync/store/syncStore.svelte";
    import ProfileAvatar from "#lib/sync/components/ProfileAvatar.svelte";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import TextInput from "#lib/components/shared/ui/TextInput.svelte";
    import ResetButton from "#lib/components/shared/ResetButton.svelte";
    import Toggle from "#lib/components/shared/ui/Toggle.svelte";

    onMount(() => {
        syncStore.init();
        settingStore.init();
    });

    function handleRotate(): void {
        syncStore.rotateUuid();
        toastStore.success("Neue UUID erstellt — der Avatar wurde erneuert.");
    }
</script>

<svelte:head>
    <title>Konto – NSC</title>
</svelte:head>

<Page>
    <PageHeader
        title="Konto"
        subtitle="Lokales Profil ohne Server — Name, Gerätename und Konto-UUID bleiben auf diesem Gerät."
        compact
    />

    <Card padding="lg" class="profile-card">
        <div class="profile-row">
            <ProfileAvatar size={96} class="profile-avatar" />
            <div class="profile-fields">
                <TextInput
                    label="Name"
                    id="account-name"
                    value={syncStore.profile.name}
                    oninput={(v) => syncStore.setName(v)}
                    placeholder="z. B. Noah"
                />
                <TextInput
                    label="Gerätename"
                    id="account-device"
                    value={syncStore.profile.deviceName}
                    oninput={(v) => syncStore.setDeviceName(v)}
                    placeholder="z. B. Laptop"
                />
            </div>
        </div>
        <div class="uuid-row">
            <span class="uuid-label">Konto-UUID</span>
            <code class="uuid">{syncStore.profile.uuid}</code>
            <ResetButton
                variant="neutral"
                label="UUID erneuern"
                confirmText="UUID wirklich erneuern? Der Avatar ändert sich und bestehende Verknüpfungen mit anderen Geräten gehen verloren."
                onReset={handleRotate}
            />
        </div>
    </Card>

    <Card padding="lg" class="google-card">
        <h2 class="card-title">Dienste von Drittanbietern</h2>
        <Toggle
            label="Google erlauben"
            checked={!settingStore.googleDisabled}
            onchange={(value) => settingStore.setGoogleDisabled(!value)}
        />
        <p class="card-note">
            Lädt Schriftarten von Google Fonts nach und blendet die Hilfe- und
            Mnemotechnik-Suche ein, die eine Google-Suche öffnet. Details in
            der
            <a href={resolve("/legal/datenschutz")}>Datenschutzerklärung</a>.
        </p>
    </Card>

    <Card padding="lg" class="sync-card" bg="soft">
        <h2 class="sync-title">Synchronisieren</h2>
        <p class="placeholder">In Arbeit …</p>
        <p class="placeholder-note">
            Die Synchronisation zwischen deinen Geräten (QR-Code / WebRTC)
            ist noch in Entwicklung und erscheint in einer späteren Version.
        </p>
    </Card>
</Page>

<style>
    /* Classes passed to Card/ProfileAvatar land on child component roots, so
       they are targeted via :global. */
    :global(.profile-card),
    :global(.google-card),
    :global(.sync-card) {
        margin-bottom: 1.25rem;
    }

    .card-title {
        margin: 0 0 0.75rem;

        font-size: 1rem;
        font-weight: 600;
    }

    .card-note {
        margin: 0.6rem 0 0;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    .card-note a {
        color: var(--primary);
    }

    .profile-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;
    }

    .profile-fields {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.9rem;
        min-width: min(100%, 14rem);
    }

    .uuid-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.6rem 0.9rem;

        margin-top: 1.25rem;
        padding-top: 1rem;

        border-top: 1px solid var(--border);
    }

    .uuid-label {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .uuid {
        flex: 1;
        min-width: 12rem;

        padding: 0.3rem 0.55rem;

        border-radius: var(--radius-md);
        background: var(--surface-soft);

        font-size: 0.78rem;
        overflow-wrap: anywhere;
    }

    .sync-title {
        margin: 0 0 0.5rem;

        font-size: 1rem;
        font-weight: 600;
    }

    .placeholder {
        margin: 0.25rem 0;

        color: var(--text-muted);
        font-size: 1.15rem;
        font-weight: 600;
    }

    .placeholder-note {
        margin: 0;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.6;
    }

    @media (max-width: 540px) {
        .profile-row {
            flex-direction: column;
            align-items: stretch;
        }

        .profile-row :global(.profile-avatar) {
            align-self: center;
        }
    }
</style>
