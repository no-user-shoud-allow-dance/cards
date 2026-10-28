<script lang="ts">
    import { onMount } from "svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import { detectImpersistentStorage } from "#lib/utils/persistence";

    const STORAGE_KEY = "kk_impersistent_toast_dismissed";

    function persistDismiss(): void {
        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch {
            /* ignore */
        }
    }

    onMount(() => {
        let dismissed = false;
        try {
            dismissed = localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            dismissed = false;
        }
        if (dismissed) return;

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
