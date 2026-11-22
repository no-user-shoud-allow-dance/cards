<script lang="ts">
    import { untrack } from "svelte";
    import { fade } from "svelte/transition";
    import type { Snippet } from "svelte";

    // Shared fullscreen overlay (fade, close button, Escape, click
    // outside, scroll lock, focus handling) for the QR code view and
    // the QR scanner.
    let {
        open,
        label,
        onclose,
        restoreFocus,
        children,
    }: {
        open: boolean;
        /** aria-label of the dialog. */
        label: string;
        onclose: () => void;
        /** Element to refocus when the overlay closes (e.g. the trigger). */
        restoreFocus?: () => HTMLElement | null;
        children: Snippet;
    } = $props();

    let closeButton = $state<HTMLButtonElement | null>(null);

    function handleKeydown(event: KeyboardEvent): void {
        if (open && event.key === "Escape") onclose();
    }

    // While open: lock scrolling; on close restore scroll and focus.
    $effect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
            untrack(() => restoreFocus?.() ?? null)?.focus();
        };
    });

    // Move focus into the dialog when it opens.
    $effect(() => {
        if (open) closeButton?.focus();
    });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <!-- Escape is handled globally via <svelte:window>; the click handler
         is the mouse-only click-outside affordance of a modal dialog. -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="fullscreen-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabindex="-1"
        onclick={(event) => {
            if (event.target === event.currentTarget) onclose();
        }}
        transition:fade={{ duration: 150 }}
    >
        <button
            bind:this={closeButton}
            type="button"
            class="overlay-close"
            onclick={onclose}
            aria-label="Schließen"
        >
            ×
        </button>
        {@render children()}
    </div>
{/if}

<style lang="postcss">
    .fullscreen-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        padding: 1.25rem;

        background: var(--backdrop-strong);
    }

    .overlay-close {
        position: absolute;
        top: 1rem;
        right: 1rem;

        display: flex;
        align-items: center;
        justify-content: center;

        width: 2.5rem;
        height: 2.5rem;
        padding: 0;

        border: 0;
        border-radius: var(--radius-pill);

        background: color-mix(in srgb, var(--on-backdrop) 14%, transparent);
        color: var(--on-backdrop);

        font-size: 1.35rem;
        line-height: 1;

        cursor: pointer;

        transition: background var(--transition-fast);

        &:hover {
            background: color-mix(in srgb, var(--on-backdrop) 26%, transparent);
        }
    }
</style>
