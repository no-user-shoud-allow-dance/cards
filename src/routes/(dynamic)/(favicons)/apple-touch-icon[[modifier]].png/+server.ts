/* eslint-disable nsc/routes-use-barrel */
import type { RequestHandler } from "./$types.js";
import { renderPNG } from "#lib/dynamic/render/formats.ts";
import { getSVG, VARIANTS } from "#lib/dynamic/favicon";

export const prerender = true;
export const entries = () => VARIANTS.flatMap((v) => ({ modifier: v }));

export const GET: RequestHandler = async ({ params }) => {
    const svg = getSVG(
        params.modifier?.includes("monochrome") ?? false,
        params.modifier?.includes("maskable") ?? false
    );

    return new Response((await renderPNG(svg, 180)) as BodyInit, {
        headers: { "content-type": "image/png" },
    });
};
