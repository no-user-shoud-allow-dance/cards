<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { detectImpersistentStorage } from "#lib/utils/persistence";

    const STORAGE_KEY = "kk_impersistent_toast_dismissed";

    // Hidden until the saved state and the storage check have run.
    let dismissed = $state(true);
    let impersistent = $state(false);

    onMount(() => {
        try {
            dismissed = localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            dismissed = false;
        }
        detectImpersistentStorage().then((detected) => {
            impersistent = detected;
        });
    });

    const show = $derived(!dismissed && impersistent);

    function dismiss(): void {
        dismissed = true;
        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch {
            /* ignore */
        }
    }
</script>

{#if show}
    <aside
        class="impersistent-toast"
        role="alert"
        aria-label="Hinweis: Daten werden nicht dauerhaft gespeichert"
        transition:fly={{ y: 16, duration: 200 }}
    >
        <div class="toast-body">
            <p class="toast-title">Daten werden nicht dauerhaft gespeichert</p>
            <p class="toast-text">
                Fortschritt und hochgeladene Stapel gehen verloren, sobald du
                den Browser schließt — etwa im Inkognito-/Privatmodus oder
                wenn der Browser Speicher blockiert.
            </p>
        </div>
        <button
            type="button"
            class="toast-close"
            aria-label="Schließen"
            onclick={dismiss}
        >
            <span aria-hidden="true">×</span>
        </button>
    </aside>
{/if}

<style>
    .impersistent-toast {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;

        max-width: min(22rem, calc(100dvw - 2rem));
        padding: 0.7rem 0.85rem;

        border: 1px solid var(--warning-border);
        border-radius: var(--radius-md);
        background: var(--warning-bg);
        box-shadow: var(--shadow-card);
    }

    .toast-body {
        min-width: 0;
    }

    .toast-title {
        margin: 0 0 0.15rem;

        color: var(--warning-text);
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.4;
    }

    .toast-text {
        margin: 0;

        color: var(--text);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .toast-close {
        display: grid;
        place-items: center;
        flex: 0 0 auto;

        width: 1.6rem;
        height: 1.6rem;
        padding: 0;

        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;

        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1;

        cursor: pointer;
        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .toast-close:hover {
        background: var(--surface-hover);
        color: var(--text);
    }
</style>
