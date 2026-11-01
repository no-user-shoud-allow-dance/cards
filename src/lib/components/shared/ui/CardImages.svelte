<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import type { CardImage } from "#lib/types";

    // `class` arrives via rest and is merged into the class expression.
    let {
        images,
        variant = "card",
        ...rest
    }: {
        /** Images of one card side, in markdown order. */
        images: CardImage[];
        /** "card" stacks images above the card text, "thumb" is a small inline row. */
        variant?: "card" | "thumb";
    } & HTMLAttributes<HTMLDivElement> = $props();

    // URLs that failed to load — the alt text is shown instead. While an
    // image is still loading, the browser shows the alt attribute.
    let failed = $state<Set<string>>(new Set());

    function markFailed(url: string): void {
        const next = new Set(failed);
        next.add(url);
        failed = next;
    }
</script>

{#if images.length > 0}
    <div {...rest} class={["card-images", rest.class]} class:thumb={variant === "thumb"}>
        {#each images as image, i (i)}
            {#if failed.has(image.url)}
                <span class="image-fallback">{image.alt || "Bild nicht verfügbar"}</span>
            {:else}
                <!-- Real img element — never {@html}; Svelte escapes src/alt. -->
                <img
                    class="card-image"
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                    onerror={() => markFailed(image.url)}
                />
            {/if}
        {/each}
    </div>
{/if}

<style>
    .card-images {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;

        max-width: 100%;
    }

    .card-image {
        display: block;

        max-width: 100%;
        /* Capped so one image plus the card text still fit the card
           without scrolling (one image per side is enforced at parse). */
        max-height: clamp(140px, 28dvh, 260px);

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface-soft);

        object-fit: contain;
    }

    .image-fallback {
        max-width: 100%;

        color: var(--text-muted);
        font-size: 0.85rem;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    /* Thumbnails for compact contexts (card list, editor rows). */
    .card-images.thumb {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .thumb .card-image {
        max-width: 4.5rem;
        max-height: 3.2rem;

        border-radius: var(--radius-md);
    }

    .thumb .image-fallback {
        font-size: 0.75rem;
    }
</style>
