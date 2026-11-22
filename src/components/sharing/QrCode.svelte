<script lang="ts">
    import QRCodeStyling from "qr-code-styling";
    import FullscreenOverlay from "#components/sharing/FullscreenOverlay.svelte";

    let { value, size = 200 }: { value: string; size?: number } = $props();

    let container = $state<HTMLDivElement | null>(null);
    let trigger = $state<HTMLButtonElement | null>(null);
    let fullscreenContainer = $state<HTMLDivElement | null>(null);
    let fullscreen = $state(false);
    let fullscreenSize = $state(320);

    // The QRCodeStyling instances are plain (non-reactive) variables:
    // they are class instances, and making them $state would create a
    // reactive cycle between the two effects below (an object assigned
    // to $state always counts as "changed", so each effect would
    // reschedule the other — the page froze when opening fullscreen).
    let qr: QRCodeStyling | null = null;
    let fullscreenQr: QRCodeStyling | null = null;

    // True when the payload is too long for a QR code ("code length
    // overflow") — instead of letting the error escape as a 500, the
    // component shows a clear warning and no code.
    let qrFailed = $state(false);

    // Styled to match the app: rounded dots and corners in the primary
    // color, the app icon as a centered logo. The color is read from the
    // theme at runtime so dark mode is followed. The background stays
    // white in both themes — scanners need the contrast.
    function createQr(target: HTMLDivElement, qrSize: number, data: string): QRCodeStyling | null {
        try {
            const css = getComputedStyle(document.documentElement);
            const primary =
                css.getPropertyValue("--primary").trim() || css.getPropertyValue("--text").trim();
            const background = css.getPropertyValue("--qr-bg").trim();
            const instance = new QRCodeStyling({
                width: qrSize,
                height: qrSize,
                type: "svg",
                data,
                margin: 0,
                image: "/favicon-192.png",
                imageOptions: {
                    hideBackgroundDots: true,
                    imageSize: 1,
                    margin: 6,
                },
                qrOptions: { errorCorrectionLevel: "M" },
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
    // This effect only writes qrFailed (never read here) — the fullscreen
    // instance is owned by the effect below, so no reactive cycle.
    $effect(() => {
        const data = value;
        const target = container;
        if (!target) return;
        try {
            if (qr) qr.update({ data });
            else qr = createQr(target, size, data);
            qrFailed = qr === null;
        } catch {
            qrFailed = true;
        }
    });

    // Build the enlarged QR while the fullscreen view is open; re-create
    // on size/link changes (clearing the target first so SVGs never pile
    // up). Owns fullscreenQr — a plain variable, so nothing reschedules
    // the effect above.
    $effect(() => {
        if (!fullscreen || qrFailed) return;
        const target = fullscreenContainer;
        if (!target) return;
        target.replaceChildren();
        fullscreenQr = createQr(target, fullscreenSize, value);
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
            Math.min(480, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.75))
        );
        fullscreen = true;
    }

    function closeFullscreen(): void {
        fullscreen = false;
    }
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
                Der Stapel ist zu groß für einen QR-Code. Kopiere den Link oder nutze „Teilen …“.
            </p>
        </div>
    {/if}
</div>

<FullscreenOverlay
    open={fullscreen}
    label="QR-Code"
    onclose={closeFullscreen}
    restoreFocus={() => trigger}
>
    <div class="qr-fullscreen">
        <div bind:this={fullscreenContainer} class="qr-fullscreen-canvas"></div>
    </div>
    <p class="qr-hint">Klicken oder Esc zum Schließen</p>
</FullscreenOverlay>

<style lang="postcss">
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

        &:hover {
            border-color: var(--border-strong);
        }

        & :global(svg) {
            display: block;
            border-radius: var(--radius-md);
        }
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

        font-size: var(--fs-4);
        font-weight: 700;
        line-height: 1.3;
    }

    .qr-failed-text {
        margin: 0;

        font-size: var(--fs-2);
        line-height: 1.5;
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

    .qr-hint {
        margin: 0;

        color: color-mix(in srgb, var(--on-backdrop) 80%, transparent);
        font-size: var(--fs-3);
    }
</style>
