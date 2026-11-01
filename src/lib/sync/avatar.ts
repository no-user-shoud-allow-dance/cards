/**
 * The profile avatar is a deterministic radial mark rendered as inline
 * SVG — no dependency, no network, no image data stored anywhere.
 *
 * Algorithm (from the UUID bit stream, no PRNG):
 *
 *   total_length = bitlength(uuid)
 *   now = 0
 *   for length, bool in uuid_stream:
 *       now += length
 *       if bool: shape(center, background_color, total_length - now)
 *       else:    shape(center, profile_color,   total_length - now)
 *
 * The first 2 bits pick the shape type — 00 rect, 01 circle, 10 rhombus,
 * 11 hexagon — and the stream continues as (length = 3 bits, bool = 1 bit)
 * pairs. Every type uses the same logic: concentric shapes with radius
 * `total_length - now` in a 100×100 viewBox, so the result is a
 * target-like radial barcode whose ring widths are the lengths and whose
 * ring colors alternate by bool. Polygons have straight, sharp edges. The
 * 8 bits after the shape pick the hue of both colors. The avatar changes
 * when the UUID rotates, and two devices can visually confirm the same
 * account.
 */

/** The UUID as a 128-bit binary string (hex without dashes). */
function uuidToBits(uuid: string): string {
    let bits = "";
    for (const ch of uuid.replaceAll("-", "")) {
        bits += parseInt(ch, 16).toString(2).padStart(4, "0");
    }
    return bits;
}

type ShapeType = 0 | 1 | 2 | 3; // rect, circle, rhombus, hexagon

export interface AvatarRing {
    /** SVG path data in the 100×100 viewBox. */
    d: string;
    fill: string;
}

export interface Avatar {
    background: string;
    rings: AvatarRing[];
}

const VIEW = 100;

/** SVG path for one shape centered at (cx, cy) with circumradius r. */
function shapePath(
    shape: ShapeType,
    cx: number,
    cy: number,
    r: number,
): string {
    if (shape === 1 || r <= 0) {
        // Circle as two arcs.
        const rr = r.toFixed(3);
        return `M ${(cx - r).toFixed(3)} ${cy} A ${rr} ${rr} 0 1 0 ${(cx + r).toFixed(3)} ${cy} A ${rr} ${rr} 0 1 0 ${(cx - r).toFixed(3)} ${cy} Z`;
    }
    const sides = shape === 3 ? 6 : 4;
    // Rect = axis-aligned square (vertices at 45°…), rhombus = diamond
    // (vertices on the axes), hexagon = pointy top.
    const rotation =
        shape === 0 ? Math.PI / 4 : shape === 2 ? 0 : -Math.PI / 2;

    let d = "";
    for (let i = 0; i < sides; i++) {
        const angle = rotation + (2 * Math.PI * i) / sides;
        const x = (cx + r * Math.cos(angle)).toFixed(3);
        const y = (cy + r * Math.sin(angle)).toFixed(3);
        d += (i === 0 ? "M" : "L") + `${x} ${y}`;
    }
    return d + "Z";
}

/** Computes the avatar (background + concentric shape rings) for a UUID. */
export function computeAvatar(uuid: string): Avatar {
    const bits = uuidToBits(uuid);
    const total_length = bits.length;
    if (total_length === 0) {
        return { background: "hsl(0, 0%, 92%)", rings: [] };
    }
    let pos = 0;
    const take = (n: number): number => {
        const slice = bits.slice(pos, pos + n);
        pos += n;
        return slice ? parseInt(slice.padEnd(n, "0"), 2) : 0;
    };

    // First 2 bits: shape type. Then 8 bits: hue for both colors.
    const shape = take(2) as ShapeType;
    const hue = Math.round((take(8) / 255) * 360);
    const profileColor = `hsl(${hue}, 70%, 50%)`;
    const backgroundColor = `hsl(${hue}, 45%, 92%)`;

    const cx = VIEW / 2;
    const cy = VIEW / 2;
    const maxRadius = VIEW / 2;

    const rings: AvatarRing[] = [];
    let now = 0;
    while (pos + 4 <= bits.length) {
        const length = take(3);
        const bool = take(1) === 1;
        now += length;
        const radius = Math.max(
            0,
            ((total_length - now) / total_length) * maxRadius,
        );
        rings.push({
            d: shapePath(shape, cx, cy, radius),
            fill: bool ? backgroundColor : profileColor,
        });
    }
    return { background: backgroundColor, rings };
}
