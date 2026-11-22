<script lang="ts">
    import { onMount } from "svelte";
    import { toastStore } from "#lib/state/toasts.svelte";
    import { settingsStore } from "#lib/state/settings.svelte";
    import { detectImpersistentStorage } from "#lib/storage/impersistent";

    function persistDismiss(): void {
        void settingsStore.setImpersistentToastDismissed(true);
    }

    onMount(() => {
        void settingsStore.init().then(() => {
            if (settingsStore.impersistentToastDismissed) return;

            detectImpersistentStorage().then((detected) => {
                if (!detected) return;
                toastStore.show(
                    "Fortschritt und hochgeladene Stapel gehen verloren, sobald du den Browser schließt – etwa im Inkognito-/Privatmodus oder wenn der Browser Speicher blockiert.",
                    "warning",
                    0,
                    {
                        title: "Daten werden nicht dauerhaft gespeichert",
                        onDismiss: persistDismiss,
                    }
                );
            });
        });
    });
</script>

<!-- Logic-only component: renders nothing. The toast is displayed by ToastHost. -->
