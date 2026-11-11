import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        sveltekit({
            // .md files (the docs in /docs) are compiled as Svelte components.
            extensions: [".svelte", ".md"],
            compilerOptions: {
                // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes("node_modules")
                        ? undefined
                        : true,
            },
            preprocess: [
                vitePreprocess(),
                // Renders the markdown docs in /docs as Svelte components.
                // smartypants stays off: the docs are German and must
                // render verbatim.
                mdsvex({ extension: ".md", smartypants: false }),
            ],
            adapter: adapter(),
        }),
    ],
});
