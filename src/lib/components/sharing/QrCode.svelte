<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { fade } from "svelte/transition";
    import QRCodeStyling from "qr-code-styling";

    let { value, size = 200 }: { value: string; size?: number } = $props();

    let container = $state<HTMLDivElement | null>(null);
    let qr = $state<QRCodeStyling | null>(null);
    let trigger = $state<HTMLButtonElement | null>(null);
    let closeButton = $state<HTMLButtonElement | null>(null);
    let fullscreenContainer = $state<HTMLDivElement | null>(null);
    let fullscreenQr = $state<QRCodeStyling | null>(null);
    let fullscreen = $state(false);
    let fullscreenSize = $state(320);

    // Styled to match the app: rounded dots and corners in the primary
    // color, the app icon as a centered logo. The color is read from the
    // theme at runtime so dark mode is followed. The background stays
    // white in both themes — scanners need the contrast.
    function createQr(
        target: HTMLDivElement,
        qrSize: number,
        data: string,
    ): QRCodeStyling {
        const primary =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                .trim() || "#3d5a80";
        const instance = new QRCodeStyling({
            width: qrSize,
            height: qrSize,
            type: "svg",
            data,
            margin: 8,
            image: "/icon-192.png",
            qrOptions: { errorCorrectionLevel: "M" },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 6,
            },
            dotsOptions: { color: primary, type: "rounded" },
            cornersSquareOptions: { color: primary, type: "extra-rounded" },
            cornersDotOptions: { color: primary, type: "dot" },
            backgroundOptions: { color: "#ffffff" },
        });
        instance.append(target);
        return instance;
    }

    onMount(() => {
        if (container) qr = createQr(container, size, value);
    });

    $effect(() => {
        qr?.update({ data: value });
        fullscreenQr?.update({ data: value });
    });

    // Build the enlarged QR once the fullscreen container exists.
    $effect(() => {
        if (!fullscreen) return;
        const target = fullscreenContainer;
        if (!target) return;
        fullscreenQr = createQr(target, fullscreenSize, untrack(() => value));
        return () => {
            fullscreenQr = null;
        };
    });

    function openFullscreen(): void {
        // Large enough to scan comfortably, small enough to leave room
        // for the hint and the close button on small screens.
        fullscreenSize = Math.max(
            240,
            Math.min(
                480,
                Math.floor(
                    Math.min(window.innerWidth, window.innerHeight) * 0.75,
                ),
            ),
        );
        fullscreen = true;
    }

    function closeFullscreen(): void {
        fullscreen = false;
    }

    // While the fullscreen view is open: lock scrolling and close on
    // Escape; restore scroll and focus when it closes.
    $effect(() => {
        if (!fullscreen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeydown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") closeFullscreen();
        };
        window.addEventListener("keydown", onKeydown);
        return () => {
            window.removeEventListener("keydown", onKeydown);
            document.body.style.overflow = previousOverflow;
            untrack(() => trigger)?.focus();
        };
    });

    // Move focus into the dialog when it opens.
    $effect(() => {
        if (fullscreen) closeButton?.focus();
    });
</script>

<button
    bind:this={trigger}
    type="button"
    class="qr-code"
    onclick={openFullscreen}
    title="QR-Code vergrößern"
    aria-label="QR-Code vergrößern"
    aria-haspopup="dialog"
>
    <div bind:this={container} role="img" aria-label="QR-Code"></div>
</button>

{#if fullscreen}
    <div
        class="qr-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="QR-Code"
        tabindex="-1"
        onclick={(event) => {
            if (event.target === event.currentTarget) closeFullscreen();
        }}
        onkeydown={(event) => {
            if (event.key === "Escape") closeFullscreen();
        }}
        transition:fade={{ duration: 150 }}
    >
        <button
            bind:this={closeButton}
            type="button"
            class="qr-close"
            onclick={closeFullscreen}
            aria-label="Schließen"
        >
            ×
        </button>
        <div class="qr-fullscreen">
            <div bind:this={fullscreenContainer} class="qr-fullscreen-canvas"></div>
        </div>
        <p class="qr-hint">Klicken oder Esc zum Schließen</p>
    </div>
{/if}

<style>
    .qr-code {
        display: inline-flex;
        flex: 0 0 auto;

        padding: 0.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: #ffffff;
        box-shadow: var(--shadow-card);

        font: inherit;
        color: inherit;
        cursor: zoom-in;

        transition: border-color var(--transition-fast);
    }

    .qr-code:hover {
        border-color: var(--border-strong);
    }

    .qr-code :global(svg) {
        display: block;
        border-radius: var(--radius-md);
    }

    .qr-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        padding: 1.25rem;

        background: rgb(33 32 28 / 82%);
    }

    /* White card behind the enlarged code — scanners need the contrast. */
    .qr-fullscreen {
        padding: 0.75rem;

        border-radius: var(--radius-lg);

        background: #ffffff;
        box-shadow: var(--shadow-card);
    }

    .qr-fullscreen-canvas :global(svg) {
        display: block;
    }

    .qr-close {
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

        background: rgb(255 255 255 / 14%);
        color: #ffffff;

        font-size: 1.35rem;
        line-height: 1;

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .qr-close:hover {
        background: rgb(255 255 255 / 26%);
    }

    .qr-hint {
        margin: 0;

        color: rgb(255 255 255 / 80%);
        font-size: 0.8rem;
    }
</style>
