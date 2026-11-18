// import { PUBLIC_APP_NAME } from "$app/env/public";

export const prerender = true;

export function GET() {
    const manifest = {
        name: "NSC",
        short_name: "NSC",

        lang: "de",
        dir: "ltr",

        description: "Vokabeln in Stapeln lernen – wiederholt bis sie sitzen.",
        description_localized: {
            en: "Learn vocabulary in decks – repeated until it sticks.",
            de: "Vokabeln in Stapeln lernen – wiederholt bis sie sitzen.",
        },

        categories: ["education", "productivity", "utilities"],

        start_url: "/",
        scope: "/",

        display: "standalone",
        display_override: ["window-controls-overlay"],
        orientation: "portrait",

        background_color: "#faf9f5",
        theme_color: "#3d5a80",

        icons: [
            {
                src: "/favicon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/favicon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/favicon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },

            {
                src: "/favicon-monochrome.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "monochrome",
            },
            {
                src: "/favicon-monochrome-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "monochrome",
            },
            {
                src: "/favicon-monochrome-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "monochrome",
            },

            {
                src: "/favicon-maskable.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
            {
                src: "/favicon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },

            {
                src: "/favicon-maskable-monochrome.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable monochrome",
            },
            {
                src: "/favicon-maskable-monochrome-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable monochrome",
            },
        ],
    };

    return Response.json(manifest, {
        headers: {
            "content-type": "application/manifest+json",
        },
    });
}
