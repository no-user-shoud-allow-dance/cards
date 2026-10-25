<script lang="ts">
    let { errors }: { errors: string[] } = $props();
</script>

<div class="errors">
    <h3>Fehler in der Stapel-Datei</h3>
    <ul>
        {#each errors as e}
            <li>{e}</li>
        {/each}
    </ul>
</div>

<style>
    .errors {
        margin-bottom: 1.5rem;
        padding: 1rem 1.1rem;

        border: 1px solid var(--danger-border);
        border-radius: var(--radius-md);

        background: var(--danger-bg);
        color: var(--danger-text);
        font-size: 0.9rem;
    }

    .errors h3 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
        font-weight: 700;
    }

    .errors ul {
        margin: 0;
        padding-left: 1.2rem;
    }

    .errors li {
        margin: 0.25rem 0;
        overflow-wrap: anywhere;
    }
</style>
