<script lang="ts">
    import { Button, Card, PageHeader, startDraft } from "#components";
    import { UI } from "#messages/locale.svelte";

    let busy = $state(false);

    // "Create deck": an empty draft (`Draft-{n}`) in "Drafts", straight
    // into its editor.
    async function create(): Promise<void> {
        busy = true;
        try {
            await startDraft(null);
        } finally {
            busy = false;
        }
    }
</script>

<svelte:head>
    <title>Stapel erstellen – NSC</title>
</svelte:head>

<PageHeader
    title="Stapel erstellen"
    subtitle="Legt einen leeren Entwurf „Draft-{'{n}'}“ im Ordner „Drafts“ an und öffnet ihn direkt im Editor."
/>

<Card class="create-card" padding="lg" aria-label="Neuen Stapel erstellen">
    <p class="hint">
        Der Entwurf heißt automatisch <code>Draft-{"{n}"}</code> (n = letzter Entwurf + 1) und liegt
        im Ordner <code>Drafts</code>. Nach dem Speichern im Editor wählst du den endgültigen
        Ordner.
    </p>
    <div class="actions">
        <Button variant="primary" onclick={create} {busy} busyLabel={UI.busyCreating}>
            Neuen Stapel erstellen
        </Button>
    </div>
</Card>

<style lang="postcss">
    :global(.create-card) {
        margin-bottom: 2rem;
    }

    .hint {
        margin: 0 0 1rem;

        color: var(--text-muted);
        font-size: var(--fs-3);
        line-height: 1.6;

        & code {
            padding: 0.05em 0.3em;

            border: 1px solid var(--border);
            border-radius: var(--radius-sm);

            background: var(--surface-soft);

            font-family: var(--family-mono);
            font-size: 0.85em;
        }
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }
</style>
