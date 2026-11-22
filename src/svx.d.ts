declare module "*.svx" {
    import type { Component } from "svelte";

    // Frontmatter of the .svx file, extracted by mdsvex at build time.
    export interface SvxFrontmatter {
        title?: string;
        description?: string;
        icon?: string;
    }

    export const metadata: SvxFrontmatter;

    const component: Component;
    export default component;
}
