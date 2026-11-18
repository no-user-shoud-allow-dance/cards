<script lang="ts">
    let { children } = $props();
</script>

<div class="protocol-landing">
    {@render children()}
</div>

<style lang="postcss">
    .protocol-landing {
        display: grid;
        place-items: center;

        min-height: 60vh;

        color: var(--text-muted);
        font-size: var(--fs-5);
    }
</style>
