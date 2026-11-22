import { rasterize } from "./rasterize";

/** Renders the SVG to PNG. `palette: true` quantizes — much smaller for flat-color icons. */
export async function renderPNG(
    svg: string,
    width: number,
    height?: number,
    opts: {
        palette?: boolean;
        colors?: number;
        compressionLevel?: number;
        background?: string;
    } = {}
): Promise<Uint8Array> {
    return rasterize(svg, width, height, opts.background)
        .png({
            compressionLevel: opts.compressionLevel ?? 6,
            ...(opts.palette ? { palette: true, colors: opts.colors ?? 256 } : {}),
        })
        .toBuffer();
}

/** Renders the SVG to JPEG. JPEG has no alpha: white background default. */
export async function renderJPG(
    svg: string,
    width: number,
    height?: number,
    opts: { quality?: number; background?: string } = {}
): Promise<Uint8Array> {
    return rasterize(svg, width, height, opts.background ?? "#ffffff")
        .jpeg({ quality: opts.quality ?? 90 })
        .toBuffer();
}

/** Renders the SVG to WebP. `lossless: true` is ideal for flat-color icons. */
export async function renderWebP(
    svg: string,
    width: number,
    height?: number,
    opts: { quality?: number; lossless?: boolean; background?: string } = {}
): Promise<Uint8Array> {
    return rasterize(svg, width, height, opts.background)
        .webp({ quality: opts.quality ?? 90, lossless: opts.lossless ?? false })
        .toBuffer();
}
