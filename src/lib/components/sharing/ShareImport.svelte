<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { applyAllPendingProgress } from "#lib/utils/pendingProgress";
    import { isShareHash } from "#lib/utils/share";

    onMount(() => {
        // A progress link may have been stashed earlier; if its deck has
        // arrived since (other tab, upload), apply it now.
        void applyAllPendingProgress();

        // Share links open the home page with the payload in the URL hash.
        // Hand them to the import page, which prefills the textarea and
        // shows the preview right away.
        const hash = window.location.hash;
        if (isShareHash(hash)) {
            goto(resolve("/(io)/import") + hash);
        }
    });
</script>
