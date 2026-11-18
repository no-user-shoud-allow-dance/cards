<script module lang="ts">
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import type { Span, StyledText } from "#lib/core/deck/document";

    // One style → one real element; the renderer never parses markup.
    export const STYLE_TAG: Record<Span["style"], string> = {
        bold: "b",
        italic: "i",
        code: "code",
        underline: "u",
        strike: "s",
        mark: "mark",
        sup: "sup",
        sub: "sub",
    };

    export type Segment =
        | { kind: "text"; start: number; end: number; styles: Span["style"][] }
        | { kind: "image"; start: number; alt: string; url: string };

    const IMAGE_TOKEN = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

    /**
     * Splits `plain` at every span boundary and image-token edge in a
     * single pass; each text run carries the styles covering it
     * (overlaps = nesting). Image segments are only emitted when the URL
     * is in the parse-time-validated `images` list — anything else stays
     * literal text.
     */
    export function splitSegments(text: StyledText): Segment[] {
        const { plain, spans, images } = text;
        const bounds = new SvelteSet<number>([0, plain.length]);
        for (const span of spans) {
            bounds.add(span.start);
            bounds.add(span.end);
        }
        const validated = new SvelteSet(images.map((img) => img.url));
        const imageAt = new SvelteMap<number, { end: number; alt: string; url: string }>();
        for (const match of plain.matchAll(IMAGE_TOKEN)) {
            if (!validated.has(match[2]!)) continue;
            bounds.add(match.index);
            bounds.add(match.index + match[0].length);
            imageAt.set(match.index, {
                end: match.index + match[0].length,
                alt: match[1]!,
                url: match[2]!,
            });
        }
        const sorted = [...bounds].sort((a, b) => a - b);
        const out: Segment[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const start = sorted[i]!;
            const end = sorted[i + 1]!;
            const image = imageAt.get(start);
            if (image && image.end === end) {
                out.push({ kind: "image", start, alt: image.alt, url: image.url });
            } else {
                out.push({
                    kind: "text",
                    start,
                    end,
                    styles: spans
                        .filter((span) => span.start <= start && span.end >= end)
                        .map((span) => span.style),
                });
            }
        }
        return out;
    }
</script>

<script lang="ts">
    interface Props {
        /** The parsed side: one `plain` string plus offset `spans` — never markup. */
        text: StyledText;
    }

    let { text }: Props = $props();

    const segments = $derived(splitSegments(text));
</script>

{#snippet wrap(content: string, styles: Span["style"][])}
    {#if styles.length === 0}
        {content}
    {:else}
        <svelte:element this={STYLE_TAG[styles[0]!]} class="rich-{styles[0]}">
            {@render wrap(content, styles.slice(1))}
        </svelte:element>
    {/if}
{/snippet}

{#each segments as segment (segment.start)}
    {#if segment.kind === "image"}
        <img class="card-image" src={segment.url} alt={segment.alt} loading="lazy" />
    {:else}
        {@render wrap(text.plain.slice(segment.start, segment.end), segment.styles)}
    {/if}
{/each}

<style lang="postcss">
    /* code reads as inline code inside the serif card text; mark gets a
       soft highlight. b/i/u/s/sup/sub use the browser's default rendering
       of the real elements. */
    .rich-code {
        padding: 0.06em 0.35em;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: var(--surface-soft);

        font-family: var(--family-mono);
        font-size: 0.82em;
    }

    .rich-mark {
        padding: 0 0.15em;

        border-radius: var(--radius-sm);

        background: var(--warning-bg);
    }

    .card-image {
        display: block;
        max-width: 100%;
        max-height: 16rem;
        margin: 0.4rem 0;

        border-radius: var(--radius-md);
    }
</style>
