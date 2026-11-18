/* eslint-disable nsc/routes-use-barrel */
import type { RequestHandler } from "./$types.js";
import { renderICO } from "#lib/dynamic/render/ico.ts";
import { renderPNG } from "#lib/dynamic/render/formats.ts";
import { getSVG, VARIANTS, VARSIZES } from "#lib/dynamic/favicon";
import { error } from "@sveltejs/kit";

export const prerender = true;
export const entries = () =>
    [
        ...VARSIZES.flatMap((vs) => ({ modifier: `${vs}.png` })),
        ...VARIANTS.flatMap((v) => [{ modifier: `${v}.svg` }, { modifier: `${v}.ico` }]),
    ].filter((v) => ![".svg", "-maskable.svg"].includes(v.modifier));

export const GET: RequestHandler = async ({ params }) => {
    const svg = getSVG(
        params.modifier.includes("monochrome"),
        params.modifier.includes("maskable")
    );

    if (params.modifier.endsWith(".ico")) {
        return new Response(
            (await renderICO(svg, [
                [16, 16],
                [32, 32],
                [48, 48],
            ])) as BodyInit,
            {
                headers: { "content-type": "image/x-icon" },
            }
        );
    } else if (params.modifier.endsWith(".png")) {
        return new Response(
            (await renderPNG(svg, params.modifier.includes("192") ? 192 : 512)) as BodyInit,
            {
                headers: { "content-type": "image/png" },
            }
        );
    } else if (params.modifier.endsWith("svg")) {
        return new Response(svg, {
            headers: { "content-type": "image/svg+xml" },
        });
    }

    return error(500);
};
