<script lang="ts">
    import Spinner from "#components/shared/ui/Spinner.svelte";

    interface Props {
        /** Non-empty error message → error state; empty → loading state. */
        error: string;
        /** Label shown next to the spinner while loading. */
        loading: string;
    }

    let { error, loading }: Props = $props();
</script>

{#if error}
    <p class="error">{error}</p>
{:else}
    <p class="loading">
        <Spinner size={18} />
        {loading}
    </p>
{/if}

<style lang="postcss">
    .loading {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin: 0;
    }

    .error {
        margin: 0;
        color: var(--danger);
    }
</style>
