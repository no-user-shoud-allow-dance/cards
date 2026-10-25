<script lang="ts">
    import { onMount } from "svelte";
    import QRCodeStyling from "qr-code-styling";

    let { value, size = 200 }: { value: string; size?: number } = $props();

    let container = $state<HTMLDivElement | null>(null);
    let qr = $state<QRCodeStyling | null>(null);

    // Styled to match the app: rounded dots and corners in the primary
    // color, the app icon as a centered logo. The color is read from the
    // theme at runtime so dark mode is followed. The background stays
    // white in both themes — scanners need the contrast.
    onMount(() => {
        const primary =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                .trim() || "#3d5a80";
        qr = new QRCodeStyling({
            width: size,
            height: size,
            type: "svg",
            data: value,
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
        if (container) qr.append(container);
    });

    $effect(() => {
        qr?.update({ data: value });
    });
</script>

<div bind:this={container} class="qr-code" role="img" aria-label="QR-Code"></div>

<style>
    .qr-code {
        display: inline-flex;
        flex: 0 0 auto;

        padding: 0.5rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: #ffffff;
        box-shadow: var(--shadow-card);
    }

    .qr-code :global(svg) {
        display: block;
        border-radius: var(--radius-md);
    }
</style>
