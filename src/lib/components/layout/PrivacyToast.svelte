<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";

    const STORAGE_KEY = "kk_privacy_toast_dismissed";

    // Hidden until the mounted check has read the saved state.
    let dismissed = $state(true);

    onMount(() => {
        try {
            dismissed = localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            dismissed = false;
        }
    });

    // No need to point at the privacy policy while it is on screen.
    const show = $derived(
        !dismissed && !page.url.pathname.startsWith("/legal/"),
    );

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
        class="privacy-toast"
        aria-label="Hinweis zur Datenschutzerklärung"
        transition:fly={{ y: 16, duration: 200 }}
    >
        <p class="toast-text">
            Bitte lies unsere
            <a href={resolve("/legal/datenschutz")} onclick={dismiss}>Datenschutzerklärung</a>, bevor du die App nutzt.
        </p>
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
    .privacy-toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        max-width: min(22rem, calc(100vw - 2rem));
        padding: 0.7rem 0.85rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .toast-text {
        margin: 0;

        color: var(--text);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .toast-text a {
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
    }

    .toast-text a:hover {
        text-decoration: underline;
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
