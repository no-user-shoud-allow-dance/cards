import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores, includeIgnoreFile, type ConfigObject } from "eslint/config";
import type { ESLint } from "eslint";
import globals from "globals";
import ts from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

// Local plugin that enforces the v2 import boundaries from ARCHITECTURE.md —
// no extra dependency required.
//
// Rules:
//  - routes import only through the #lib barrel (never "#lib/<subpath>").
//  - core/ is pure: no imports of storage/state/sync/ui/messages, no DOM,
//    no Svelte, no fetch, no $app.
//  - server-only modules (src/lib/server/) are never imported from
//    routes, ui, state, sync, or core.
//  - raw markdown stays in storage: only storage/ and the editor route may
//    reference getRaw/putRaw.

const boundaryPlugin: ESLint.Plugin = {
    meta: { name: "nsc-boundaries" },
    rules: {
        "routes-use-barrel": {
            meta: {
                type: "problem",
                docs: { description: "routes must import only from '#lib'" },
                schema: [],
                messages: { bad: "Routes import only via the '#lib' barrel, not '{{value}}'." },
            },
            create(context) {
                if (!context.filename.replace(/\\/g, "/").includes("/src/routes/")) return {};
                return {
                    ImportDeclaration(node) {
                        const value = node.source.value;
                        // +server.ts endpoints are the one allowed consumer of server-only modules.
                        const serverEndpoint = /\+server\.ts$/.test(context.filename);
                        if (
                            typeof value === "string" &&
                            value.startsWith("#lib/") &&
                            !(serverEndpoint && value.startsWith("#lib/server/"))
                        ) {
                            context.report({
                                node: node.source,
                                messageId: "bad",
                                data: { value },
                            });
                        }
                    },
                };
            },
        },
        "core-is-pure": {
            meta: {
                type: "problem",
                docs: { description: "core/ must not import upper layers or platform APIs" },
                schema: [],
                messages: { bad: "core/ is pure — '{{value}}' is not allowed here." },
            },
            create(context) {
                if (!context.filename.replace(/\\/g, "/").includes("/src/lib/core/")) return {};
                const banned = [
                    /^\.\.\/(storage|state|sync|ui|messages|server)\b/,
                    /^\$app/,
                    /^svelte/,
                ];
                return {
                    ImportDeclaration(node) {
                        const value = node.source.value;
                        if (typeof value === "string" && banned.some((re) => re.test(value))) {
                            context.report({
                                node: node.source,
                                messageId: "bad",
                                data: { value },
                            });
                        }
                    },
                };
            },
        },
        "server-only": {
            meta: {
                type: "problem",
                docs: { description: "server modules stay server-only" },
                schema: [],
                messages: { bad: "Server-only module '{{value}}' imported from client code." },
            },
            create(context) {
                const file = context.filename.replace(/\\/g, "/");
                if (file.includes("/src/lib/server/")) return {};
                // +server.ts endpoints are the one allowed consumer of server-only modules.
                if (/\+server\.ts$/.test(file)) return {};
                return {
                    ImportDeclaration(node) {
                        const value = node.source.value;
                        if (typeof value === "string" && /(^|\/)server\/(kv|hash)/.test(value)) {
                            context.report({
                                node: node.source,
                                messageId: "bad",
                                data: { value },
                            });
                        }
                    },
                };
            },
        },
        "no-markdown-leak": {
            meta: {
                type: "problem",
                docs: { description: "getRaw/putRaw exist only in storage and the editor" },
                schema: [],
                messages: {
                    bad: "'{{name}}' is the markdown exception — only storage/ and the editor route may use it.",
                },
            },
            create(context) {
                const file = context.filename.replace(/\\/g, "/");
                const allowed =
                    file.includes("/src/lib/storage/") || /\/src\/routes\/.*editor/.test(file);
                if (allowed) return {};
                return {
                    ImportDeclaration(node) {
                        for (const spec of node.specifiers) {
                            if (spec.type !== "ImportSpecifier") continue;
                            const name = spec.imported.name;
                            if (name === "getRaw" || name === "putRaw") {
                                context.report({ node: spec, messageId: "bad", data: { name } });
                            }
                        }
                    },
                };
            },
        },
    },
};

export default defineConfig(
    // .gitignore
    includeIgnoreFile(gitignorePath),

    // mdsvex compiles .svx/.md pages into Svelte components at build time, so the
    // raw markdown cannot be parsed by ESLint and is excluded from linting.
    // .vibe/ holds vendored agent skills, not project code.
    globalIgnores(["**/*.svx", "**/*.md", ".vibe/**"]),

    // JS/TS
    js.configs.recommended,
    ts.configs.recommended,

    // Svelte
    svelte.configs.recommended,

    // Prettier
    prettier,
    svelte.configs.prettier,

    // Webbrowser and NodeJS globals
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    } satisfies ConfigObject,

    // TypeScript in Svelte files
    {
        files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: [".svelte"],
                parser: ts.parser,
            },
        },
    } satisfies ConfigObject,

    // Import boundaries from ARCHITECTURE.md
    {
        plugins: { nsc: boundaryPlugin },
        rules: {
            "nsc/routes-use-barrel": "error",
            "nsc/core-is-pure": "error",
            "nsc/server-only": "error",
            "nsc/no-markdown-leak": "error",
        },
    } satisfies ConfigObject,

    // Conventions: intentionally unused params/vars are prefixed with "_".
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
        },
    } satisfies ConfigObject,

    // TSDoc: validate that /** */ doc comments conform to the TSDoc spec
    // (tsdoc.org). Scoped to .ts files — the plugin targets TypeScript
    // doc comments and would flag plain JSDoc in .js files.
    {
        files: ["**/*.ts"],
        plugins: { tsdoc },
        rules: {
            "tsdoc/syntax": "error",
        },
    } satisfies ConfigObject
);
