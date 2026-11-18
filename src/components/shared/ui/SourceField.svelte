<script lang="ts">
    /* eslint-disable svelte/no-dom-manipulating -- this is a contenteditable
       live-format preview: the rendered token chips must be real DOM nodes
       inside the editable, so direct DOM writes are the point of the component. */
    import { STYLES, type Style } from "#lib/core/deck/document";
    import { STYLE_DELIMITER } from "#lib/core/deck/inline";
    import {
        removeDelimiterPair,
        structureSignature,
        tokenizeEditorSource,
        wrapRange,
    } from "#lib/core/deck/editor";
    import TagIcon from "#components/icons/TagIcon.svelte";
    import { STYLE_TAG } from "#components/shared/ui/CardFace.svelte";
    import {
        domStructureSignature,
        locate,
        serialize,
        sourceOffset,
    } from "#components/model/sourceFieldDom";

    // German UI labels per style, used for the toolbar's title/aria-label.
    const STYLE_LABELS: Record<Style, string> = {
        bold: "fett",
        italic: "kursiv",
        code: "Code",
        underline: "unterstrichen",
        strike: "durchgestrichen",
        mark: "hervorgehoben",
        sup: "hochgestellt",
        sub: "tiefgestellt",
    };

    /**
     * Multi-line source editor for one card side. Shows the raw markdown
     * in a contenteditable: every allowlisted delimiter (`**`, `~`, …)
     * stays visible as a pill chip, while the content inside is wrapped
     * in the real element, so it previews live (bold, subscript, …).
     * Bracketed hints `[...]` get a hatched texture overlay, image tokens
     * `![alt](url)` the same hatch in the primary color. Clicking a chip
     * removes the delimiter
     * and its counterpart; selecting text shows a toolbar to wrap the
     * selection.
     *
     * DOM layout per pair: [chip `**`] [<b>…children…</b>] [chip `**`] —
     * the chips carry the literal source, the live element only its
     * children, so serializing the DOM reproduces the source string
     * exactly. The DOM is only re-rendered when it no longer matches the
     * source (external change, or a hand-typed allowed delimiter still
     * sitting in a text node) — while typing plain text the caret is
     * untouched. Hand-typed formatting therefore renders exactly like
     * toolbar-added one; disallowed markup stays literal text.
     */
    let {
        value = $bindable(""),
        placeholder = "",
        ariaLabel = "",
    }: {
        value?: string;
        placeholder?: string;
        ariaLabel?: string;
    } = $props();

    let host = $state<HTMLDivElement | null>(null);
    let el = $state<HTMLDivElement | null>(null);

    /** Toolbar position relative to the host while a selection is active. */
    let toolbarPos = $state<{ x: number; y: number } | null>(null);

    /** Selection to restore after the next DOM re-render. */
    let pendingSelection = $state<{ start: number; end: number } | null>(null);

    // ── Rendering ───────────────────────────────────────────────

    function appendChip(token: { raw: string; start: number }): void {
        if (!el) return;
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.contentEditable = "false";
        chip.dataset.literal = token.raw;
        chip.dataset.pos = String(token.start);
        chip.textContent = token.raw;
        chip.title = "Klick entfernt die Formatierung";
        currentContainer().appendChild(chip);
    }

    // Stack of open live elements; the bottom is the editable itself.
    const containers: Node[] = [];
    function currentContainer(): Node {
        return containers.length > 0 ? containers[containers.length - 1]! : el!;
    }

    function render(source: string): void {
        if (!el) return;
        el.textContent = "";
        containers.length = 0;
        containers.push(el);
        // Stack entries: { kind: "delim", style } | { kind: "hint" }.
        const openStack: ({ kind: "delim"; style: Style } | { kind: "hint" })[] = [];

        for (const token of tokenizeEditorSource(source)) {
            if (token.type === "text") {
                currentContainer().appendChild(document.createTextNode(token.raw));
                continue;
            }
            if (token.type === "image") {
                // Image token: a leaf live span with a dotted texture; the
                // raw `![alt](url)` stays editable text inside it.
                const img = document.createElement("span");
                img.className = "live-tag live-image";
                img.dataset.tag = "image";
                img.appendChild(document.createTextNode(token.raw));
                currentContainer().appendChild(img);
                continue;
            }
            if (token.type === "hint-open") {
                // Bracketed hint: a live span with a texture overlay; the
                // bracket characters stay editable text inside it.
                const hint = document.createElement("span");
                hint.className = "live-tag live-hint";
                hint.dataset.tag = "hint";
                currentContainer().appendChild(hint);
                containers.push(hint);
                openStack.push({ kind: "hint" });
                hint.appendChild(document.createTextNode(token.raw));
                continue;
            }
            if (token.type === "hint-close") {
                currentContainer().appendChild(document.createTextNode(token.raw));
                containers.pop();
                openStack.pop();
                continue;
            }
            if (token.type === "open") {
                appendChip(token);
                // Live preview: the content sits in the real element.
                const live = document.createElement(STYLE_TAG[token.style!]);
                live.className = `live-tag live-${token.style}`;
                live.dataset.tag = token.style!;
                currentContainer().appendChild(live);
                containers.push(live);
                openStack.push({ kind: "delim", style: token.style! });
                continue;
            }
            // Closing delimiter: pairs only with the innermost open style;
            // the chip goes after the live element, back into its parent.
            const top = openStack[openStack.length - 1];
            if (
                top &&
                top.kind === "delim" &&
                token.type === "close" &&
                top.style === token.style
            ) {
                containers.pop();
                openStack.pop();
                appendChip(token);
            } else {
                currentContainer().appendChild(document.createTextNode(token.raw));
            }
        }
        // Constructs left open at the end simply stay open (their live
        // element is not closed in the DOM either — serializing
        // reproduces the source as written).
    }

    // Re-render only when the DOM no longer matches the source: either
    // the change came from outside (serialize differs), or the user
    // hand-typed an allowed delimiter — it then sits in a plain text node, so
    // the structure signature differs and it is re-rendered as chip +
    // live preview, exactly as if added via the toolbar. While typing
    // plain text both checks pass and the caret is untouched.
    $effect(() => {
        if (!el) return;
        const current = value;
        if (
            serialize(el) === current &&
            domStructureSignature(el) === structureSignature(current)
        ) {
            pendingSelection = null;
            return;
        }
        const sel = selectionOffsets();
        render(current);
        const restore = pendingSelection ?? sel;
        if (restore) setSelection(restore.start, restore.end);
        pendingSelection = null;
    });

    // ── Caret / selection helpers ───────────────────────────────
    // locate/sourceOffset/serialize/domStructureSignature live in
    // model/sourceFieldDom.ts (pure, unit-tested there).

    function setSelection(start: number, end: number): void {
        if (!el) return;
        const s = locate(el, Math.min(start, end));
        const e = locate(el, Math.max(start, end));
        const range = document.createRange();
        // locate returns the structural SourceNode view; the values are
        // real DOM nodes here, so the cast is safe.
        range.setStart(s.node as Node, s.offset);
        range.setEnd(e.node as Node, e.offset);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }

    // Current selection as source offsets, or null when it is not
    // entirely inside this field.
    function selectionOffsets(): { start: number; end: number } | null {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !el) return null;
        const range = sel.getRangeAt(0);
        if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) {
            return null;
        }
        const start = sourceOffset(el, range.startContainer, range.startOffset);
        const end = sourceOffset(el, range.endContainer, range.endOffset);
        if (start === null || end === null) return null;
        return { start: Math.min(start, end), end: Math.max(start, end) };
    }

    // ── Events ──────────────────────────────────────────────────

    function handleInput(): void {
        if (!el) return;
        value = serialize(el);
    }

    // Inserts plain text at the caret (used for Enter and paste, so the
    // DOM stays flat: text nodes, chips and live spans only — newlines
    // are real "\n" characters in text nodes, rendered via pre-wrap).
    function insertTextAtCaret(text: string): void {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            event.preventDefault();
            insertTextAtCaret("\n");
            handleInput();
        }
        if (event.key === "Escape") toolbarPos = null;
    }

    function handlePaste(event: ClipboardEvent): void {
        event.preventDefault();
        const text = (event.clipboardData?.getData("text/plain") ?? "").replace(/\r\n?/g, "\n");
        insertTextAtCaret(text);
        handleInput();
    }

    // Click on a tag chip removes the tag (and its matching counterpart).
    function handleClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const chip = target.closest?.(".tag-chip");
        if (!chip || !el || !el.contains(chip)) return;
        event.preventDefault();
        const pos = Number((chip as HTMLElement).dataset.pos);
        const result = removeDelimiterPair(value, pos);
        if (!result) return;
        el.focus();
        pendingSelection = { start: result.caret, end: result.caret };
        value = result.text;
        toolbarPos = null;
    }

    function wrapSelection(style: Style): void {
        const sel = selectionOffsets();
        if (!sel || sel.start === sel.end) return;
        const open = STYLE_DELIMITER[style];
        value = wrapRange(value, sel.start, sel.end, style);
        // Select the wrapped text after the re-render.
        pendingSelection = {
            start: sel.start + open.length,
            end: sel.end + open.length,
        };
        toolbarPos = null;
        el?.focus();
    }

    function updateToolbar(): void {
        const sel = selectionOffsets();
        if (!sel || sel.start === sel.end || !el || !host) {
            toolbarPos = null;
            return;
        }
        const range = window.getSelection()!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        toolbarPos = {
            x: rect.left - hostRect.left + rect.width / 2,
            y: rect.top - hostRect.top,
        };
    }

    function handleBlur(event: FocusEvent): void {
        if (host?.contains(event.relatedTarget as Node | null)) return;
        toolbarPos = null;
    }

    function handleSelectionChange(): void {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && el && el.contains(sel.anchorNode)) {
            updateToolbar();
        } else if (toolbarPos) {
            toolbarPos = null;
        }
    }
</script>

<svelte:document onselectionchange={handleSelectionChange} />

<div class="source-field" bind:this={host}>
    <div
        bind:this={el}
        class="source-editable"
        class:empty={value === ""}
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        tabindex="0"
        data-placeholder={placeholder}
        spellcheck="false"
        oninput={handleInput}
        onkeydown={handleKeydown}
        onpaste={handlePaste}
        onclick={handleClick}
        onmouseup={updateToolbar}
        onkeyup={updateToolbar}
        onblur={handleBlur}
    ></div>
    {#if toolbarPos}
        <!-- mousedown is prevented so the editor selection survives
             until the button's click wraps it. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="tag-toolbar"
            style="left: {toolbarPos.x}px; top: {toolbarPos.y}px"
            onmousedown={(event) => event.preventDefault()}
        >
            {#each STYLES as style (style)}
                {@const delim = STYLE_DELIMITER[style]}
                <button
                    type="button"
                    class="tag-btn"
                    title="Auswahl {STYLE_LABELS[style]} ({delim}…{delim})"
                    aria-label="Auswahl als {STYLE_LABELS[style]} formatieren"
                    onclick={() => wrapSelection(style)}
                >
                    <TagIcon {style} />
                </button>
            {/each}
        </div>
    {/if}
</div>

<style lang="postcss">
    /* Matches the plain text inputs it replaces. */
    .source-field {
        position: relative;

        width: 100%;
        padding: 0.4rem 0.55rem;

        border: 1px solid transparent;
        border-radius: var(--radius-md);

        background: transparent;
        color: var(--text);

        font: inherit;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);

        &:hover {
            border-color: var(--border);
        }

        &:focus-within {
            border-color: var(--border);
            background: var(--surface);
            outline: 2px solid var(--focus-ring);
        }
    }

    .source-editable {
        min-height: 1.4em;

        font: inherit;

        white-space: pre-wrap;
        overflow-wrap: anywhere;

        outline: none;

        cursor: text;

        &.empty::before {
            content: attr(data-placeholder);

            color: var(--text-muted);

            pointer-events: none;
        }

        & :global(.tag-chip:hover) {
            border-color: var(--danger-border);
            background: var(--danger-bg);
            color: var(--danger-text);
        }
    }

    /* Chips and live tag elements are created imperatively in render(),
       so their styles need :global — anchored under this component's
       own template elements to stay scoped. */

    /* A tag token shown as source: a pill. Clicking it deletes the tag,
       so the pointer cursor and the danger hover state signal removal. */
    .source-editable :global(.tag-chip) {
        padding: 0.04em 0.4em;

        border: 1px solid var(--primary-soft);
        border-radius: var(--radius-pill);

        background: var(--primary-soft);
        color: var(--primary);

        font-family: var(--family-mono);
        font-size: 0.78em;

        cursor: pointer;
        user-select: none;

        transition:
            background var(--transition-fast),
            color var(--transition-fast),
            border-color var(--transition-fast);
    }

    /* Live preview of the tag content inside the editable. sup/sub/b/i/
       u/s use the browser's default rendering of the real
       element; code and mark get the same look as in the card views. */
    .source-editable :global(.live-code) {
        padding: 0 0.3em;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: var(--surface-soft);

        font-family: var(--family-mono);
        font-size: 0.85em;
    }

    .source-editable :global(.live-mark) {
        padding: 0 0.15em;

        border-radius: var(--radius-sm);

        background: var(--warning-bg);
    }

    /* Bracketed hint `[...]`: a hatched texture overlay so the region
       stands out from plain text and formatting delimiters. */
    .source-editable :global(.live-hint) {
        padding: 0 0.1em;

        border-radius: var(--radius-sm);

        background: repeating-linear-gradient(
            -45deg,
            var(--surface-soft) 0,
            var(--surface-soft) 3px,
            transparent 3px,
            transparent 7px
        );
        box-shadow: inset 0 0 0 1px var(--border);
    }

    /* Image token `![alt](url)`: the same hatch texture as a hint, but
       in the primary color (thumbnails render separately below). */
    .source-editable :global(.live-image) {
        padding: 0 0.1em;

        border-radius: var(--radius-sm);

        background: repeating-linear-gradient(
            -45deg,
            var(--primary-soft) 0,
            var(--primary-soft) 3px,
            transparent 3px,
            transparent 7px
        );
        box-shadow: inset 0 0 0 1px var(--primary);
    }

    .tag-toolbar {
        position: absolute;
        z-index: 100;

        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
        gap: 0.2rem;

        max-width: 100%;
        padding: 0.25rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        transform: translate(-50%, calc(-100% - 6px));
    }

    .tag-btn {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 1.9rem;
        height: 1.9rem;
        padding: 0;

        border: 0;
        border-radius: var(--radius-pill);

        background: transparent;
        color: var(--text);

        cursor: pointer;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);

        &:hover {
            background: var(--primary-soft);
            color: var(--primary);
        }

        &:focus-visible {
            outline: 2px solid var(--focus-ring);
            outline-offset: 1px;
        }
    }
</style>
