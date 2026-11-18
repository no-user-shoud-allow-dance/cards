import sharp from "sharp";
import { type Sharp } from "sharp";

/**
 * Parses the intrinsic size of an SVG's root element (viewBox preferred,
 * width/height attributes otherwise, 100×100 as last resort — the same
 * default librsvg uses for dimensionless SVGs). Throws if there is no
 * root <svg> element.
 */
export function intrinsicSize(svg: string): { width: number; height: number } {
    const open = /<svg\b[^>]*>/i.exec(svg)?.[0];
    if (!open) throw new Error("render: no root <svg> element");
    const attr = (name: string): string | undefined => {
        const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(open);
        return m ? (m[1] ?? m[2]) : undefined;
    };
    const viewBox = attr("viewBox") ?? attr("viewbox");
    if (viewBox !== undefined) {
        const parts = viewBox
            .trim()
            .split(/[\s,]+/)
            .map(Number);
        if (
            parts.length === 4 &&
            parts.every((n) => Number.isFinite(n)) &&
            parts[2]! > 0 &&
            parts[3]! > 0
        ) {
            return { width: parts[2]!, height: parts[3]! };
        }
    }
    const w = attr("width"),
        h = attr("height");
    if (w !== undefined && h !== undefined) {
        const pw = parseFloat(w),
            ph = parseFloat(h);
        if (Number.isFinite(pw) && Number.isFinite(ph) && pw > 0 && ph > 0)
            return { width: pw, height: ph };
    }
    return { width: 100, height: 100 };
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Rasterizes an SVG via sharp (librsvg) and returns the configured
 * pipeline — call .png()/.jpeg()/.webp() on it to pick the output format.
 *
 * Rasterization happens at the *target* resolution via the `density`
 * option: sharp renders vectors at 72 DPI intrinsic size by default,
 * so without this, upscaling (e.g. a 100-unit icon to 512 px) would
 * rasterize small and scale blurry. Exact `width`×`height` is then
 * enforced with `resize({ fit: "contain" })`, which letterboxes with
 * `background` — sharp's native replacement for the old carrier wrapper.
 * Omit `height` for aspect-preserving output.
 */
export function rasterize(svg: string, width: number, height?: number, background?: string): Sharp {
    const w = Math.round(width);
    const h = height !== undefined ? Math.round(height) : undefined;
    if (!(w > 0) || (h !== undefined && !(h > 0))) {
        throw new RangeError(
            `rasterize: width and height must be positive (got ${width}×${height ?? "auto"})`
        );
    }
    const { width: intrinsicWidth } = intrinsicSize(svg);
    const density = (72 * w) / intrinsicWidth;
    return sharp(Buffer.from(svg), { density }).resize({
        width: w,
        height: h,
        fit: "contain",
        background: background ?? TRANSPARENT,
    });
}
