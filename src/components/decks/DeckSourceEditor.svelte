<script lang="ts">
    import { errorLinesOf, highlightDeckSource } from "#lib/core/deck/highlight";
    import type { NscError } from "#lib/core/errors";

    /**
     * Raw deck-markdown editor with syntax highlighting and
     * squiggle underlines on lines that carry a parse error. A
     * transparent textarea sits on top of a highlight layer that
     * renders the tokenized source (core/deck/highlight.ts); both
     * layers share font, padding and scrolling, so the colored tokens
     * align exactly with the caret text. The textarea is the only
     * interactive layer; the highlight layer is aria-hidden and
     * pointer-transparent. (A div with white-space: pre, not a <pre>,
     * so the compiler's whitespace removal keeps the token stream
     * byte-exact.)
     */
    let {
        value = $bindable(""),
        ariaLabel = "Stapel-Markdown bearbeiten",
        errors = [],
    }: {
        value?: string;
        ariaLabel?: string;
        /** Parse errors of `value`; their lines get a wavy underline. */
        errors?: NscError[];
    } = $props();

    // Token texts concatenate back to `value` exactly (round-trip
    // invariant of the tokenizer), so the layers never drift apart.
    const tokens = $derived(highlightDeckSource(value, errorLinesOf(errors)));

    let highlightLayer = $state<HTMLDivElement | null>(null);

    function syncScroll(event: Event): void {
        const layer = highlightLayer;
        const input = event.currentTarget as HTMLTextAreaElement;
        if (layer) {
            layer.scrollTop = input.scrollTop;
            layer.scrollLeft = input.scrollLeft;
        }
    }
</script>

<div class="source-editor">
    <!-- One line, no inter-tag whitespace: the rendered token texts must
         concatenate byte-exact to the textarea value. -->
    <div class="layer highlight-layer" aria-hidden="true" bind:this={highlightLayer}>
        {#each tokens as token, i (i)}
            <span
                class="hl hl-{token.type}{token.style ? ` hl-${token.style}` : ''}"
                class:hl-error={token.error === true}
            >
                {token.text}
            </span>
        {/each}
        <span class="hl hl-text">&NewLine;</span>
    </div>
    <textarea
        class="layer input-layer"
        bind:value
        onscroll={syncScroll}
        spellcheck="false"
        wrap="off"
        aria-label={ariaLabel}></textarea>
</div>

<style lang="postcss">
    .source-editor {
        position: relative;

        flex: 1;
        min-height: 20rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;

        &:focus-within {
            border-color: var(--primary);
            outline: 2px solid var(--focus-ring);
        }
    }

    /* Both layers occupy the same box with identical typography, so
       every token sits exactly under its characters in the textarea. */
    .layer {
        position: absolute;
        inset: 0;

        margin: 0;
        padding: 0.75rem 0.9rem;
        border: 0;

        font-family: var(--family-mono);
        font-size: var(--fs-3);
        line-height: 1.55;
        white-space: pre;
        tab-size: 4;

        overflow: auto;

        scrollbar-width: thin;
    }

    .highlight-layer {
        pointer-events: none;

        background: transparent;
        color: var(--text);
    }

    /* The textarea shows only the caret and the selection; the visible
       text comes from the highlight layer below. */
    .input-layer {
        background: transparent;
        color: transparent;
        caret-color: var(--text);

        resize: none;
        outline: none;

        &::selection {
            background: var(--focus-ring);
            color: transparent;
        }
    }

    /* ── Token colors ── */

    .hl-frontmatter-delimiter {
        color: var(--border-strong);
        font-weight: 700;
    }

    .hl-frontmatter-key {
        color: var(--primary);
        font-weight: 600;
    }

    .hl-frontmatter-value {
        color: var(--text);
    }

    .hl-title-marker,
    .hl-title-text {
        color: var(--primary);
        font-weight: 700;
    }

    .hl-comment {
        color: var(--text-muted);
        font-style: italic;
    }

    .hl-separator {
        color: var(--text-muted);
        font-weight: 700;
    }

    .hl-tag {
        color: var(--overview);
        font-weight: 600;
    }

    .hl-moon {
        color: var(--stone-text);
        font-weight: 700;
    }

    .hl-delim {
        color: var(--primary);
    }

    .hl-hint {
        color: var(--warning-text);
        font-weight: 700;
    }

    .hl-image {
        padding: 0 0.1em;

        border-radius: var(--radius-sm);

        background: var(--primary-soft);
        color: var(--primary);
    }

    /* Squiggle under every token on a line with a parse error. */
    .hl-error {
        text-decoration-line: underline;
        text-decoration-style: dotted;
        text-decoration-color: var(--danger-text);
        text-decoration-thickness: 0.1em;
        text-underline-offset: 0.1em;

        &::after {
            content: "<- Fehler";
            position: absolute;
            right: 0;

            color: var(--danger-text);
            font-style: italic;
            text-decoration-line: underline;
            text-decoration-style: dotted;
            text-decoration-color: var(--danger-text);
            text-decoration-thickness: 0.1em;
            text-underline-offset: 0.1em;
        }
    }
</style>
