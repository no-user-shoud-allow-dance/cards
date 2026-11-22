import faviconSvg from "#static/favicon.svg?raw";
import faviconMaskableSvg from "#static/favicon-maskable.svg?raw";

export const VARIANTS = ["", "-monochrome", "-maskable", "-maskable-monochrome"];
export const SIZES = ["", "-192", "-512"];
export const VARSIZES = [...SIZES.flatMap((s) => [...VARIANTS.flatMap((v) => v + s)])];

export function getSVG(monochrome: boolean, maskable: boolean): string {
    const base = maskable ? faviconMaskableSvg : faviconSvg;
    const svg = monochrome ? base.replaceAll("#3d5a80", "#5e5e5e") : base;
    return svg;
}
