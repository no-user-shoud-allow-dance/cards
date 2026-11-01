<script lang="ts">
    import { onMount } from "svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import { detectImpersistentStorage } from "#lib/utils/persistence";
    import { read, write } from "#lib/storages/localStorage";

    function persistDismiss(): void {
        write("impersistent_toast_dismissed", true);
    }

    onMount(() => {
        if (read("impersistent_toast_dismissed") ?? false) return;

        detectImpersistentStorage().then((detected) => {
            if (!detected) return;
            toastStore.show(
                "Fortschritt und hochgeladene Stapel gehen verloren, sobald du den Browser schließt — etwa im Inkognito-/Privatmodus oder wenn der Browser Speicher blockiert.",
                "warning",
                0,
                {
                    title: "Daten werden nicht dauerhaft gespeichert",
                    onDismiss: persistDismiss,
                },
            );
        });
    });
</script>

<!-- Logic-only component: renders nothing. The toast is displayed by ToastHost. -->
