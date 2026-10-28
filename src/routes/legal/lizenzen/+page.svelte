<script lang="ts">
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";

    // Verbatim license texts of the bundled third-party libraries, taken
    // from each package's LICENSE file ("MIT License" heading added where
    // the file starts directly with the copyright line).
    const libraries = [
        {
            name: "Svelte",
            description:
                "Framework, mit dem die App gebaut ist.",
            projectUrl: "https://github.com/sveltejs/svelte",
            license: `MIT License

Copyright (c) 2016-2025 [Svelte Contributors](https://github.com/sveltejs/svelte/graphs/contributors)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
        },
        {
            name: "SvelteKit",
            description:
                "App-Rahmenwerk für Routing und Server-Rendering.",
            projectUrl: "https://github.com/sveltejs/kit",
            license: `MIT License

Copyright (c) 2020 [these people](https://github.com/sveltejs/kit/graphs/contributors)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
        },
        {
            name: "detectIncognito.js",
            description:
                "Erkennt Inkognito- und Privatfenster, um vor nicht dauerhaft gespeicherten Daten zu warnen. Läuft vollständig in Ihrem Browser.",
            projectUrl: "https://github.com/Joe12387/detectIncognito",
            license: `MIT License

Copyright (c) 2021 - 2026 Joe Rutkowski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
        },
        {
            name: "qr-code-styling",
            description:
                "Erzeugt gestaltete QR-Codes zum Teilen von Stapeln. Läuft vollständig in Ihrem Browser.",
            projectUrl: "https://github.com/kozakdenys/qr-code-styling",
            license: `MIT License

Copyright (c) 2019 Denys Kozak

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
        },
        {
            name: "qrcode-generator",
            description:
                "QR-Code-Generierungs-Engine, die von qr-code-styling verwendet wird. Läuft vollständig in Ihrem Browser.",
            projectUrl: "https://github.com/kazuhikoarase/qrcode-generator",
            license: `MIT License

Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
        },
    ];
</script>

<svelte:head>
    <title>Lizenzen – NSC</title>
</svelte:head>

<PageHeader
    title="Lizenzen"
    subtitle="Eingebundene Bibliotheken von Drittanbietern."
/>

<p>
    NSC selbst ist als Public Domain (Unlicense) freigegeben. Diese Seite
    listet die Lizenzen der in die App eingebundenen Bibliotheken.
</p>

{#each libraries as lib (lib.name)}
    <h2>{lib.name}</h2>
    <p>
        {lib.description} Projektseite:
        <a href={lib.projectUrl} target="_blank" rel="noopener noreferrer"
            >GitHub</a
        >
    </p>
    <pre class="license-text" lang="en">{lib.license}</pre>
{/each}

<style>
    .license-text {
        margin: 0;
        padding: 1rem 1.1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-soft);

        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-size: 0.8rem;
        line-height: 1.65;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
</style>
