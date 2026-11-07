<script lang="ts">
    import { untrack } from "svelte";
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

    // True when the payload is too long for a QR code ("code length
    // overflow") — instead of letting the error escape as a 500, the
    // component shows a clear warning and no code.
    let qrFailed = $state(false);

    // Styled to match the app: rounded dots and corners in the primary
    // color, the app icon as a centered logo. The color is read from the
    // theme at runtime so dark mode is followed. The background stays
    // white in both themes — scanners need the contrast.
    function createQr(
        target: HTMLDivElement,
        qrSize: number,
        data: string,
    ): QRCodeStyling | null {
        try {
            const css = getComputedStyle(document.documentElement);
            const primary =
                css.getPropertyValue("--primary").trim() ||
                css.getPropertyValue("--text").trim();
            const background = css.getPropertyValue("--qr-bg").trim();
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
                backgroundOptions: { color: background },
            });
            instance.append(target);
            return instance;
        } catch {
            return null;
        }
    }

    // Create on mount and re-create whenever there is no instance (e.g.
    // the first link was too long and the user switches to a shorter
    // mode) — update otherwise. Any failure (payload too long for a QR
    // code) lands in qrFailed and shows the warning instead of throwing.
    $effect(() => {
        const data = value;
        if (!container) return;
        try {
            if (qr) qr.update({ data });
            else qr = createQr(container, size, data);
            fullscreenQr?.update({ data });
            qrFailed = qr === null;
        } catch {
            qrFailed = true;
        }
    });

    // Build the enlarged QR once the fullscreen container exists.
    $effect(() => {
        if (!fullscreen || qrFailed) return;
        const target = fullscreenContainer;
        if (!target) return;
        fullscreenQr = createQr(target, fullscreenSize, untrack(() => value));
        if (!fullscreenQr) qrFailed = true;
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

<!-- The button stays mounted (hidden) in the failed state so the QR
     can be re-created when the link becomes short enough again. -->
<div class="qr-wrap">
    <button
        bind:this={trigger}
        type="button"
        class="qr-code"
        class:qr-code--hidden={qrFailed}
        onclick={openFullscreen}
        title="QR-Code vergrößern"
        aria-label="QR-Code vergrößern"
        aria-haspopup="dialog"
        tabindex={qrFailed ? -1 : 0}
    >
        <div bind:this={container} role="img" aria-label="QR-Code"></div>
    </button>
    {#if qrFailed}
        <!-- Payload too long for a QR code: clear warning instead of an
             uncaught "code length overflow" error (which surfaced as 500). -->
        <div class="qr-failed" role="alert">
            <svg
                class="qr-failed-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M10.3 4.1 2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                />
                <path
                    d="M12 9.5v5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                />
                <circle cx="12" cy="17.3" r="1.1" fill="currentColor" />
            </svg>
            <p class="qr-failed-title">QR-Code nicht möglich</p>
            <p class="qr-failed-text">
                Der Stapel ist zu groß für einen QR-Code. Kopiere den Link
                oder nutze „Teilen …“.
            </p>
        </div>
    {/if}
</div>

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
    .qr-wrap {
        display: inline-flex;
        flex: 0 0 auto;
    }

    /* Failed state: keep the button (and its container) in the DOM so
       the QR can be rebuilt when the link shrinks, but hide it. */
    .qr-code.qr-code--hidden {
        display: none;
    }

    .qr-code {
        display: inline-flex;
        flex: 0 0 auto;

        padding: 0.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--qr-bg);
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

    /* Warning box shown when the payload exceeds the QR capacity —
       roughly the size of the clickable code button, with a hatched
       warning background and a triangle icon. */
    .qr-failed {
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;

        width: 200px;
        min-height: 200px;
        padding: 1rem;

        border: 1px dashed var(--warning-border);
        border-radius: var(--radius-lg);

        background: repeating-linear-gradient(
            -45deg,
            var(--warning-bg) 0,
            var(--warning-bg) 6px,
            var(--warning-hover) 6px,
            var(--warning-hover) 12px
        );
        box-shadow: var(--shadow-card);
        color: var(--warning-text);

        text-align: center;
    }

    .qr-failed-icon {
        width: 2rem;
        height: 2rem;

        padding: 0.45rem;

        border-radius: var(--radius-pill);

        background: var(--warning-hover);
        box-shadow: inset 0 0 0 1px var(--warning-border);
    }

    .qr-failed-title {
        margin: 0;

        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.3;
    }

    .qr-failed-text {
        margin: 0;

        font-size: 0.78rem;
        line-height: 1.5;
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

        background: var(--backdrop-strong);
    }

    /* White card behind the enlarged code — scanners need the contrast. */
    .qr-fullscreen {
        padding: 0.75rem;

        border-radius: var(--radius-lg);

        background: var(--qr-bg);
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

        background: color-mix(in srgb, var(--on-backdrop) 14%, transparent);
        color: var(--on-backdrop);

        font-size: 1.35rem;
        line-height: 1;

        cursor: pointer;

        transition: background var(--transition-fast);
    }

    .qr-close:hover {
        background: color-mix(in srgb, var(--on-backdrop) 26%, transparent);
    }

    .qr-hint {
        margin: 0;

        color: color-mix(in srgb, var(--on-backdrop) 80%, transparent);
        font-size: 0.8rem;
    }
</style>
