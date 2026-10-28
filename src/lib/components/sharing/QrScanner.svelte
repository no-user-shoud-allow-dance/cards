<script lang="ts">
    import { untrack } from "svelte";
    import { fade } from "svelte/transition";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";

    let { onScan }: { onScan: (value: string) => void } = $props();

    // BarcodeDetector is a native browser API (Chrome/Edge, Safari 17+);
    // the types are declared locally because lib.dom does not ship them
    // everywhere yet.
    interface DetectedBarcode {
        rawValue: string;
    }

    interface BarcodeDetectorLike {
        detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
    }

    type BarcodeDetectorConstructor = new (options?: {
        formats?: string[];
    }) => BarcodeDetectorLike;

    let scanButton = $state<HTMLDivElement | null>(null);
    let closeButton = $state<HTMLButtonElement | null>(null);
    let video = $state<HTMLVideoElement | null>(null);
    let scanning = $state(false);

    let stream: MediaStream | null = null;
    let detector: BarcodeDetectorLike | null = null;
    let scanTimer: number | null = null;

    function getBarcodeDetector(): BarcodeDetectorConstructor | null {
        return (
            (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
                .BarcodeDetector ?? null
        );
    }

    function scannerSupported(): boolean {
        return (
            typeof navigator !== "undefined" &&
            typeof navigator.mediaDevices?.getUserMedia === "function" &&
            getBarcodeDetector() !== null
        );
    }

    function openScanner(): void {
        if (!scannerSupported()) {
            toastStore.error(
                "QR-Scanner wird von diesem Browser nicht unterstützt — füge den Link stattdessen manuell ein.",
            );
            return;
        }
        scanning = true;
    }

    function closeScanner(): void {
        scanning = false;
    }

    function stopCamera(): void {
        if (scanTimer !== null) {
            clearInterval(scanTimer);
            scanTimer = null;
        }
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        detector = null;
        if (video) video.srcObject = null;
    }

    async function scan(): Promise<void> {
        if (!detector || !video || video.readyState < video.HAVE_CURRENT_DATA) {
            return;
        }
        try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) {
                closeScanner();
                onScan(value);
            }
        } catch {
            // Transient detection errors (empty frame, …) are ignored.
        }
    }

    // Start the camera once the overlay's video element exists; the
    // cleanup stops it again when the overlay closes.
    $effect(() => {
        if (!scanning) return;
        const element = video;
        const Detector = getBarcodeDetector();
        if (!element || !Detector) return;
        let cancelled = false;
        void (async () => {
            try {
                detector = new Detector({ formats: ["qr_code"] });
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    // The rear camera scans codes far more reliably.
                    video: { facingMode: { ideal: "environment" } },
                });
                if (cancelled) {
                    stopCamera();
                    return;
                }
                element.srcObject = stream;
                element.muted = true;
                await element.play();
                if (cancelled) {
                    stopCamera();
                    return;
                }
                scanTimer = window.setInterval(() => void scan(), 300);
            } catch {
                if (!cancelled) {
                    // Close the overlay again — the toast explains what
                    // happened.
                    scanning = false;
                    toastStore.error(
                        "Kamera nicht verfügbar — bitte erlaube den Kamerazugriff oder füge den Link manuell ein.",
                    );
                }
            }
        })();
        return () => {
            cancelled = true;
            stopCamera();
        };
    });

    // While the scanner is open: lock scrolling and close on Escape;
    // restore scroll and focus when it closes.
    $effect(() => {
        if (!scanning) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeydown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") closeScanner();
        };
        window.addEventListener("keydown", onKeydown);
        return () => {
            window.removeEventListener("keydown", onKeydown);
            document.body.style.overflow = previousOverflow;
            untrack(() => scanButton)?.focus();
        };
    });

    // Move focus into the dialog when it opens.
    $effect(() => {
        if (scanning) closeButton?.focus();
    });
</script>

<div class="qr-scanner" bind:this={scanButton} tabindex="-1">
    <Button onclick={openScanner}>QR-Code scannen</Button>
</div>

{#if scanning}
    <div
        class="scanner-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="QR-Code scannen"
        tabindex="-1"
        onclick={(event) => {
            if (event.target === event.currentTarget) closeScanner();
        }}
        onkeydown={(event) => {
            if (event.key === "Escape") closeScanner();
        }}
        transition:fade={{ duration: 150 }}
    >
        <button
            bind:this={closeButton}
            type="button"
            class="scanner-close"
            onclick={closeScanner}
            aria-label="Schließen"
        >
            ×
        </button>
        <div class="scanner-frame">
            <video
                bind:this={video}
                class="scanner-video"
                autoplay
                playsinline
                muted
            ></video>
            <div class="scanner-reticle" aria-hidden="true"></div>
        </div>
        <p class="scanner-hint">
            QR-Code vor die Kamera halten — der Link wird automatisch
            übernommen
        </p>
    </div>
{/if}

<style>
    .qr-scanner {
        margin-top: 0.6rem;
    }

    .scanner-overlay {
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

    .scanner-frame {
        position: relative;

        width: min(100%, 22rem);
        aspect-ratio: 1;
        overflow: hidden;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-lg);

        background: #000000;
        box-shadow: var(--shadow-card);
    }

    .scanner-video {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* Reticle: the square the QR code should be held into. */
    .scanner-reticle {
        position: absolute;
        inset: 12%;

        border: 2px solid rgb(255 255 255 / 85%);
        border-radius: var(--radius-md);

        animation: reticle-pulse 2.2s ease-in-out infinite;

        pointer-events: none;
    }

    @keyframes reticle-pulse {
        50% {
            opacity: 0.45;
        }
    }

    .scanner-close {
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

    .scanner-close:hover {
        background: rgb(255 255 255 / 26%);
    }

    .scanner-hint {
        margin: 0;

        color: rgb(255 255 255 / 80%);
        font-size: 0.8rem;
        line-height: 1.5;
        text-align: center;
    }
</style>
