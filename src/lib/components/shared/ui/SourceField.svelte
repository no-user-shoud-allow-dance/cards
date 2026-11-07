<script lang="ts">
    import { onMount } from "svelte";
    import {
        ALLOWED_TAGS,
        TAG_DELIMITER,
        removeTagPair,
        tagStructureSignature,
        tokenizeEditorSource,
        wrapRange,
        type AllowedTag,
    } from "#lib/utils/inlineFormat";
    import TagIcon from "#lib/components/shared/ui/TagIcon.svelte";

    // German UI labels per tag, used for the toolbar's title/aria-label.
    const TAG_LABELS: Record<AllowedTag, string> = {
        code: "Code",
        b: "fett",
        i: "kursiv",
        u: "unterstrichen",
        s: "durchgestrichen",
        mark: "hervorgehoben",
        sup: "hochgestellt",
        sub: "tiefgestellt",
    };

    /**
     * Single-line source editor for one card side. Shows the raw markdown
     * in a contenteditable: every allowlisted delimiter (`**`, `~`, …)
     * stays visible as a pill chip, while the content inside is wrapped
     * in the real element, so it previews live (bold, subscript, …).
     * Bracketed hints `[...]` get a hatched texture overlay. Clicking a
     * chip removes the delimiter and its counterpart; selecting text shows
     * a toolbar to wrap the selection.
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

    // ── DOM ↔ source serialization ──────────────────────────────

    // Length of a DOM node in source characters: text nodes count their
    // value, tag chips their literal markup, live tag elements their
    // children (the tag source itself lives in the chips). Anything
    // else (e.g. a stray <br>) counts 0.
    function innerLength(node: Node): number {
        if (node.nodeType === Node.TEXT_NODE) return node.nodeValue?.length ?? 0;
        if (node.nodeType !== Node.ELEMENT_NODE) return 0;
        if ((node as HTMLElement).dataset.literal !== undefined) {
            return (node as HTMLElement).dataset.literal!.length;
        }
        let sum = 0;
        for (const child of Array.from(node.childNodes)) sum += innerLength(child);
        return sum;
    }

    function serialize(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        const element = node as HTMLElement;
        if (element.dataset.literal !== undefined) return element.dataset.literal;
        let out = "";
        for (const child of Array.from(node.childNodes)) out += serialize(child);
        return out;
    }

    // Same signature as tagStructureSignature, but computed from the DOM:
    // chips contribute their literal, live tag elements their tag name.
    function domStructureSignature(root: Node): string {
        const out: string[] = [];
        const walk = (parent: Node): void => {
            for (const child of Array.from(parent.childNodes)) {
                if (child.nodeType !== Node.ELEMENT_NODE) continue;
                const element = child as HTMLElement;
                if (element.dataset.literal !== undefined) {
                    out.push("C" + element.dataset.literal);
                    continue;
                }
                if (element.classList.contains("live-tag")) {
                    out.push("L" + (element.dataset.tag ?? ""));
                }
                walk(child);
            }
        };
        walk(root);
        return out.join("|");
    }

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
        // Stack entries: { kind: "delim", tag } | { kind: "hint" }.
        const openStack: ({ kind: "delim"; tag: AllowedTag } | { kind: "hint" })[] =
            [];

        for (const token of tokenizeEditorSource(source)) {
            if (token.type === "text") {
                currentContainer().appendChild(document.createTextNode(token.raw));
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
                const live = document.createElement(token.tag!);
                live.className = `live-tag live-${token.tag}`;
                live.dataset.tag = token.tag!;
                currentContainer().appendChild(live);
                containers.push(live);
                openStack.push({ kind: "delim", tag: token.tag! });
                continue;
            }
            // Closing delimiter: pairs only with the innermost open tag;
            // the chip goes after the live element, back into its parent.
            const top = openStack[openStack.length - 1];
            if (top && top.kind === "delim" && top.tag === token.tag) {
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
            domStructureSignature(el) === tagStructureSignature(current)
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

    // Maps a source offset to a DOM position. Chips are atomic (caret
    // only before/after them); live tag elements are descended into.
    function locate(root: Node, offset: number): { node: Node; offset: number } {
        let acc = 0;
        for (let i = 0; i < root.childNodes.length; i++) {
            const child = root.childNodes[i]!;
            if (child.nodeType === Node.TEXT_NODE) {
                const len = child.nodeValue?.length ?? 0;
                if (offset <= acc + len) {
                    return { node: child, offset: offset - acc };
                }
                acc += len;
                continue;
            }
            const len = innerLength(child);
            if (offset <= acc) return { node: root, offset: i };
            if (offset < acc + len) {
                if ((child as HTMLElement).dataset?.literal !== undefined) {
                    return { node: root, offset: i }; // inside a chip → before it
                }
                return locate(child, offset - acc); // descend into a live tag
            }
            if (offset === acc + len) {
                // Right after an opening chip the caret belongs inside
                // the live element, so typing continues within the tag.
                const next = root.childNodes[i + 1];
                if (
                    next &&
                    next.nodeType === Node.ELEMENT_NODE &&
                    (next as HTMLElement).classList.contains("live-tag")
                ) {
                    return locate(next, 0);
                }
                return { node: root, offset: i + 1 };
            }
            acc += len;
        }
        return { node: root, offset: root.childNodes.length };
    }

    // Maps a DOM position (node, offset) to a source offset.
    function sourceOffset(node: Node, offset: number): number | null {
        if (!el) return null;
        if (node === el) {
            let sum = 0;
            for (let i = 0; i < offset && i < el.childNodes.length; i++) {
                sum += innerLength(el.childNodes[i]!);
            }
            return sum;
        }
        let acc = 0;
        const walk = (parent: Node): number | null => {
            for (let i = 0; i < parent.childNodes.length; i++) {
                const child = parent.childNodes[i]!;
                if (child === node) {
                    if (node.nodeType === Node.TEXT_NODE) return acc + offset;
                    let sum = acc;
                    for (let j = 0; j < offset && j < node.childNodes.length; j++) {
                        sum += innerLength(node.childNodes[j]!);
                    }
                    return sum;
                }
                if (child.contains(node)) {
                    const found = walk(child);
                    if (found !== null) return found;
                }
                acc += innerLength(child);
            }
            return null;
        };
        return walk(el);
    }

    function setSelection(start: number, end: number): void {
        if (!el) return;
        const s = locate(el, Math.min(start, end));
        const e = locate(el, Math.max(start, end));
        const range = document.createRange();
        range.setStart(s.node, s.offset);
        range.setEnd(e.node, e.offset);
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
        const start = sourceOffset(range.startContainer, range.startOffset);
        const end = sourceOffset(range.endContainer, range.endOffset);
        if (start === null || end === null) return null;
        return { start: Math.min(start, end), end: Math.max(start, end) };
    }

    // ── Events ──────────────────────────────────────────────────

    function handleInput(): void {
        if (!el) return;
        value = serialize(el);
    }

    function handleKeydown(event: KeyboardEvent): void {
        // Card sides are single-line; a newline would split the card.
        if (event.key === "Enter") event.preventDefault();
        if (event.key === "Escape") toolbarPos = null;
    }

    function handlePaste(event: ClipboardEvent): void {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const node = document.createTextNode(text.replace(/[\r\n]+/g, " "));
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        handleInput();
    }

    // Click on a tag chip removes the tag (and its matching counterpart).
    function handleClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const chip = target.closest?.(".tag-chip");
        if (!chip || !el || !el.contains(chip)) return;
        event.preventDefault();
        const pos = Number((chip as HTMLElement).dataset.pos);
        const result = removeTagPair(value, pos);
        if (!result) return;
        el.focus();
        pendingSelection = { start: result.caret, end: result.caret };
        value = result.text;
        toolbarPos = null;
    }

    function wrapSelection(tag: AllowedTag): void {
        const sel = selectionOffsets();
        if (!sel || sel.start === sel.end) return;
        const open = TAG_DELIMITER[tag];
        value = wrapRange(value, sel.start, sel.end, tag);
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

    onMount(() => {
        const onSelectionChange = () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && el && el.contains(sel.anchorNode)) {
                updateToolbar();
            } else if (toolbarPos) {
                toolbarPos = null;
            }
        };
        document.addEventListener("selectionchange", onSelectionChange);
        return () => document.removeEventListener("selectionchange", onSelectionChange);
    });
</script>

<div class="source-field" bind:this={host}>
    <div
        bind:this={el}
        class="source-editable"
        class:empty={value === ""}
        contenteditable="true"
        role="textbox"
        aria-multiline="false"
        aria-label={ariaLabel}
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
        <div
            class="tag-toolbar"
            style="left: {toolbarPos.x}px; top: {toolbarPos.y}px"
            onmousedown={(event) => event.preventDefault()}
        >
            {#each ALLOWED_TAGS as tag (tag)}
                {@const delim = TAG_DELIMITER[tag]}
                <button
                    type="button"
                    class="tag-btn"
                    title="Auswahl {TAG_LABELS[tag]} ({delim}…{delim})"
                    aria-label="Auswahl als {TAG_LABELS[tag]} formatieren"
                    onclick={() => wrapSelection(tag)}
                >
                    <TagIcon {tag} />
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
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
    }

    .source-field:hover {
        border-color: var(--border);
    }

    .source-field:focus-within {
        border-color: var(--border);
        background: var(--surface);
        outline: 2px solid var(--focus-ring);
    }

    .source-editable {
        min-height: 1.4em;

        font: inherit;

        white-space: pre-wrap;
        overflow-wrap: anywhere;

        outline: none;

        cursor: text;
    }

    .source-editable.empty::before {
        content: attr(data-placeholder);

        color: var(--text-muted);

        pointer-events: none;
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

        font-family:
            ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.78em;

        cursor: pointer;
        user-select: none;

        transition:
            background var(--transition-fast),
            color var(--transition-fast),
            border-color var(--transition-fast);
    }

    .source-editable :global(.tag-chip:hover) {
        border-color: var(--danger-border);
        background: var(--danger-bg);
        color: var(--danger-text);
    }

    /* Live preview of the tag content inside the editable. sup/sub/b/i/
       u/s use the browser's default rendering of the real
       element; code and mark get the same look as in the card views. */
    .source-editable :global(.live-code) {
        padding: 0 0.3em;

        border: 1px solid var(--border);
        border-radius: var(--radius-sm);

        background: var(--surface-soft);

        font-family:
            ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
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
    }

    .tag-btn:hover {
        background: var(--primary-soft);
        color: var(--primary);
    }

    .tag-btn:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 1px;
    }
</style>
