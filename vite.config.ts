import { mdsvex } from "mdsvex";
import { defineConfig } from "vite";
import adapter from "@sveltejs/adapter-vercel";

import { sveltekit } from "@sveltejs/kit/vite";

import mdsvexConfig from "./mdsvex.config.ts";

export default defineConfig({
    plugins: [
        sveltekit({
            compilerOptions: {
                // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
            },
            adapter: adapter(),
            preprocess: [mdsvex(mdsvexConfig)],
            extensions: [".svelte", ".svx", ".md"],
        }),
    ],
});
