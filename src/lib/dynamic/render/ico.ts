import { renderPNG } from "./formats";

/**
 * Builds a multi-size .ico (ICONDIR + 16-byte ICONDIRENTRY per image +
 * PNG payloads). ICO stores one byte per dimension (0 = 256), so
 * dimensions must be integers in [1, 256].
 */
export async function renderICO(svg: string, sizes: [number, number][]): Promise<Uint8Array> {
    if (sizes.length === 0) throw new RangeError("renderICO: sizes must not be empty");
    for (const [w, h] of sizes) {
        if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || w > 256 || h < 1 || h > 256) {
            throw new RangeError(
                `renderICO: dimensions must be integers in [1, 256] (got ${w}×${h})`
            );
        }
    }
    const images = await Promise.all(
        sizes.map(async ([w, h]) => ({ w, h, png: await renderPNG(svg, w, h) }))
    );
    const headerSize = 6 + images.length * 16;
    const total = headerSize + images.reduce((n, { png }) => n + png.length, 0);
    const out = new Uint8Array(total);
    const view = new DataView(out.buffer);
    view.setUint16(0, 0, true); // reserved
    view.setUint16(2, 1, true); // type: 1 = icon
    view.setUint16(4, images.length, true);
    let offset = headerSize;
    for (const [i, { w, h, png }] of images.entries()) {
        const entry = 6 + i * 16;
        out[entry] = w === 256 ? 0 : w;
        out[entry + 1] = h === 256 ? 0 : h;
        view.setUint16(entry + 4, 1, true); // color planes
        view.setUint16(entry + 6, 32, true); // bits per pixel
        view.setUint32(entry + 8, png.length, true);
        view.setUint32(entry + 12, offset, true);
        out.set(png, offset);
        offset += png.length;
    }
    return out;
}
