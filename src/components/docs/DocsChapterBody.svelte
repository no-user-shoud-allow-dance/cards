<script lang="ts">
    import { chapters } from "./chapters";

    interface Props {
        slug: string;
    }

    let { slug }: Props = $props();

    const Chapter = $derived(chapters.find((c) => c.slug === slug)?.mod.default ?? null);
</script>

{#if Chapter}<Chapter />{/if}
