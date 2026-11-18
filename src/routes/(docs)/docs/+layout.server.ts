import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LayoutServerLoad } from "./$types";

/**
 * Reads the self-contained screen SVGs from `static/docs/screens/*.svg`
 * so the layout can inline them with `{@html}`. Inlining keeps the
 * `var(--…)` references themeable in the app; opened standalone, the
 * SVGs fall back to their hardcoded light-theme values and run their
 * SMIL animations.
 *
 * All /docs pages are prerendered, so this runs once at build time.
 */
export const load: LayoutServerLoad = () => {
    const dir = resolve("static/docs/screens");
    const shotSvgs: Record<string, string> = {};
    for (const file of readdirSync(dir)) {
        if (file.endsWith(".svg")) {
            shotSvgs[file] = readFileSync(resolve(dir, file), "utf8");
        }
    }
    return { shotSvgs };
};
