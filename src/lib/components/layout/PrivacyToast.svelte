<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";

    const STORAGE_KEY = "kk_privacy_toast_dismissed";

    let dismissed = $state(false);
    let toastId: string | null = $state(null);

    function persistDismiss(): void {
        dismissed = true;
        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch {
            /* ignore */
        }
    }

    onMount(() => {
        try {
            dismissed = localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            dismissed = false;
        }
    });

    // Show/hide the toast based on dismissal state and current page.
    // No need to point at the privacy policy while it is on screen.
    $effect(() => {
        const onLegalPage = page.url.pathname.startsWith("/legal/");
        if (!dismissed && !onLegalPage && !toastId) {
            toastId = toastStore.show(
                "Bitte lies unsere Datenschutzerklärung, bevor du die App nutzt.",
                "info",
                0,
                {
                    actionLabel: "Datenschutzerklärung",
                    onAction: () => {
                        persistDismiss();
                        goto(resolve("/legal/datenschutz"));
                    },
                    onDismiss: persistDismiss,
                },
            );
        } else if (onLegalPage && toastId) {
            toastStore.dismiss(toastId);
            toastId = null;
        }
    });
</script>

<!-- Logic-only component: renders nothing. The toast is displayed by ToastHost. -->
