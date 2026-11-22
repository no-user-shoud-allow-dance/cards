<script lang="ts">
    import WarningIcon from "#components/icons/WarningIcon.svelte";

    let { errors }: { errors: string[] } = $props();
</script>

<div class="errors">
    <h3><WarningIcon size={15} /> Fehler beim Parsen</h3>
    <ul>
        {#each errors as e (e)}
            <li>{e}</li>
        {/each}
    </ul>
</div>

<style lang="postcss">
    .errors {
        margin-bottom: 1.5rem;
        padding: 1rem 1.1rem;

        border: 1px solid var(--danger-border);
        border-radius: var(--radius-md);

        background: var(--danger-bg);
        color: var(--danger-text);
        font-size: var(--fs-4);

        & h3 {
            display: flex;
            align-items: center;
            gap: 0.4rem;

            margin: 0 0 0.5rem;
            font-size: var(--fs-4);
            font-weight: 700;
        }

        & ul {
            margin: 0;
            padding-left: 1.2rem;
        }

        & li {
            margin: 0.25rem 0;
            overflow-wrap: anywhere;
        }
    }
</style>
