import { type Config } from "prettier";

const config: Config = {
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    tabWidth: 4,
    printWidth: 100,
    endOfLine: "lf",
    useTabs: false,
    singleAttributePerLine: false,
    plugins: [
        "prettier-plugin-svelte",
        "prettier-plugin-sh",
        "prettier-plugin-markdown-html",
        "@prettier/plugin-xml",
    ],
    overrides: [
        {
            files: "*.svelte",
            options: { parser: "svelte" },
        },
        {
            files: "*.svg",
            options: { parser: "xml" },
        },
        {
            files: "*.html",
            options: { printWidth: 120 },
        },

        //

        {
            files: "*.sh",
            options: { parser: "sh" },
        },
    ],
};

export default config;
