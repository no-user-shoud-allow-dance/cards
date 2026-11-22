export default {
    plugins: {
        "postcss-each": {},
        // postcss-each declares its loop variables ($name, $hue, …) only in
        // the @each params, which postcss-simple-vars resolves during the
        // same traversal before the loop is expanded. Let @each params pass;
        // any other undefined variable still throws.
        "postcss-simple-vars": {
            unknown: (
                node: { type: string; name?: string; error: (message: string) => Error },
                name: string
            ) => {
                if (node.type === "atrule" && node.name === "each") return;
                throw node.error(`Undefined variable $${name}`);
            },
        },
        "postcss-nesting": {},
        "postcss-color-converter": {
            outputColorFormat: "hex",
        },
        "@csstools/postcss-color-mix-function": { preserve: false },
        autoprefixer: {},
    },
};
