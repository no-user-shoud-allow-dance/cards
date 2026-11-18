<script lang="ts">
    import type { Snippet } from "svelte";
    import Spinner from "#components/shared/ui/Spinner.svelte";
    import { UI } from "#messages/locale.svelte";

    let {
        ready = $bindable(false),
        delay = 250,
        monochrome = false,
        children,
    }: {
        ready: boolean;
        /** Spinner appears only after this delay, so fast loads never flash it (H17). */
        delay?: number;
        monochrome?: boolean;
        children: Snippet;
    } = $props();

    let _ready = $state(ready);
    let timer: ReturnType<typeof setTimeout> | undefined;

    $effect(() => {
        const target = ready;
        const ms = delay;

        timer = setTimeout(() => (_ready = target), ms);

        return () => clearTimeout(timer);
    });
</script>

{#if _ready}
    {@render children()}
{:else}
    <div class="ready-gate-loading">
        <Spinner size={56} {monochrome} label={UI.loadingDecks} />
    </div>
{/if}

<style lang="postcss">
    .ready-gate-loading {
        display: grid;
        place-items: center;
        min-height: 60vh;
    }
</style>
