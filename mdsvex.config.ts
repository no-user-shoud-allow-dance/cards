import { defineMDSveXConfig as defineConfig } from "mdsvex";

export default defineConfig({
    extensions: [".svelte.md", ".md", ".svx"],
    smartypants: {
        dashes: "oldschool",
        quotes: true,
        ellipses: true,
    },
});
