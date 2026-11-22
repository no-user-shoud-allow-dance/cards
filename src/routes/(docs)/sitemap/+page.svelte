<script lang="ts">
    import { resolve } from "$app/paths";
    import { Page, PageHeader, chapterMeta, chapters, routeIdOf } from "#components";
</script>

<svelte:head>
    <title>Sitemap – NSC</title>
    <meta
        name="description"
        content="Alle Routen von NSC auf einen Blick: statische Seiten, Dokumentationskapitel, Rechtsseiten und die dynamischen Stapel-Routen."
    />
</svelte:head>

<Page>
    <PageHeader
        title="Sitemap"
        subtitle="Statische Seiten als Link, dynamische Routen als Muster — alles, was die App zu bieten hat."
    />

    <div class="sitemap">
        <section aria-labelledby="sitemap-app">
            <h2 id="sitemap-app">App</h2>
            <ul>
                <li><a href={resolve("/")}>Startseite</a></li>
                <li><a href={resolve("/(io)/create")}>Stapel erstellen</a></li>
                <li><a href={resolve("/(io)/upload")}>Hochladen</a></li>
                <li><a href={resolve("/(io)/import")}>Importieren</a></li>
                <li><a href={resolve("/account")}>Konto</a></li>
                <li><a href={resolve("/offline")}>Offline-Seite</a></li>
            </ul>
        </section>

        <section aria-labelledby="sitemap-docs">
            <h2 id="sitemap-docs">Dokumentation</h2>
            <ul>
                <li><a href={resolve("/(docs)/docs")}>Übersicht</a></li>
                {#each chapters as chapter (chapter.slug)}
                    <li>
                        <a href={resolve(routeIdOf(chapter.slug) as "/(docs)/docs")}>
                            {chapterMeta(chapter.slug).title}
                        </a>
                    </li>
                {/each}
            </ul>
        </section>

        <section aria-labelledby="sitemap-legal">
            <h2 id="sitemap-legal">Rechtliches</h2>
            <ul>
                <li><a href={resolve("/(docs)/legal/impressum")}>Impressum</a></li>
                <li><a href={resolve("/(docs)/legal/datenschutz")}>Datenschutz</a></li>
                <li><a href={resolve("/(docs)/legal/lizenzen")}>Lizenzen</a></li>
            </ul>
        </section>

        <section aria-labelledby="sitemap-decks">
            <h2 id="sitemap-decks">Stapel-Routen (pro Stapel)</h2>
            <ul class="patterns">
                <li><code>/deck/[slug]</code> — Stapelseite mit Lernfortschritt</li>
                <li>
                    <code>/draft/[slug]</code> — Entwurfs-Vorschau (alle Karten auf einer Seite)
                </li>
                <li><code>/edit/[slug]</code> — Editor</li>
                <li><code>/overview/[slug]</code> — Überblicksmodus</li>
                <li><code>/cram/[slug]</code> — Lernmodus</li>
                <li><code>/export/[slug]</code> — Exportieren &amp; Teilen</li>
                <li><code>/print/[slug]</code> — Druckansicht</li>
            </ul>
        </section>

        <section aria-labelledby="sitemap-protocols">
            <h2 id="sitemap-protocols">Protokoll-Routen (Share-Links)</h2>
            <ul class="patterns">
                <li><code>/c/[payload]</code> — Karten-Link</li>
                <li><code>/p/[payload]</code> — Fortschritts-Link</li>
                <li><code>/t/[payload]</code> — Together-Link (Karten + Fortschritt)</li>
                <li><code>/s/[payload]</code> — Server-Link</li>
                <li><code>/k/[id].[key]</code> — Schlüssel-Link</li>
            </ul>
        </section>

        <section aria-labelledby="sitemap-this">
            <h2 id="sitemap-this">Diese Seite</h2>
            <ul>
                <li><a href={resolve("/(docs)/sitemap")}>Sitemap</a></li>
            </ul>
        </section>
    </div>
</Page>

<style lang="postcss">
    .sitemap {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
        gap: 1.75rem 2.5rem;

        margin-bottom: 2rem;

        & h2 {
            margin: 0 0 0.6rem;
            font-size: var(--fs-2);
            letter-spacing: 0.06em;
            text-transform: uppercase;

            color: var(--text-muted);
        }

        & ul {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;

            margin: 0;
            padding: 0;
            list-style: none;
        }

        & a {
            color: var(--primary);
            font-weight: 500;
            text-decoration: none;
        }
    }

    .sitemap a:hover {
        text-decoration: underline;
    }

    .patterns code {
        color: var(--text);
        font-size: var(--fs-4);
    }

    .patterns li {
        color: var(--text-muted);
        font-size: var(--fs-3);
    }
</style>
