<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { route, useSettingsReady } from "#components";
    import { toastStore } from "#lib/state/toasts.svelte";
    import { settingsStore } from "#lib/state/settings.svelte";

    const settingsReady = useSettingsReady();
    let toastId: number | null = $state(null);

    function persistDismiss(): void {
        void settingsStore.setPrivacyToastDismissed(true);
    }

    // Show/hide the toast based on dismissal state and current page.
    // No need to point at the privacy policy while it is on screen.
    // The layout's settings gate guarantees that the store carries the
    // persisted values once `ready` is true (null context outside the
    // layout tree keeps the component passive).
    $effect(() => {
        if (settingsReady?.ready !== true) return;
        const onLegalPage = route.isLegalPage;
        const dismissed = settingsStore.privacyToastDismissed;
        if (!dismissed && !onLegalPage && toastId === null) {
            toastId = toastStore.show(
                "Bitte lies unsere Datenschutzerklärung, bevor du die App nutzt.",
                "info",
                0,
                {
                    actionLabel: "Datenschutzerklärung",
                    onAction: () => {
                        persistDismiss();
                        goto(resolve("/(docs)/legal/datenschutz"));
                    },
                    onDismiss: persistDismiss,
                }
            );
        } else if ((dismissed || onLegalPage) && toastId !== null) {
            // Either the dismissal flipped while the toast was up (click,
            // settings reset) or a legal page is on screen — take it down.
            toastStore.dismiss(toastId);
            toastId = null;
        }
    });
</script>

<!-- Logic-only component: renders nothing. The toast is displayed by ToastHost. -->
