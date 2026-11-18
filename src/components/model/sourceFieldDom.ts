/**
 * DOM ↔ source utilities of the SourceField editor, extracted for
 * testability. The functions are DOM-pure: they take the nodes they work
 * on as arguments and touch no browser globals, so tests can run them
 * under `bun test` against plain fake nodes (bun has no DOM).
 *
 * `SourceNode` is the minimal structural view of the DOM nodes the
 * editor touches — real DOM nodes satisfy it, and tests build fakes.
 */

/** nodeType constants (the DOM `Node` global is unavailable in tests). */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export interface SourceNode {
    readonly nodeType: number;
    readonly nodeValue: string | null;
    readonly childNodes: ArrayLike<SourceNode>;
    readonly tagName?: string;
    readonly dataset?: { literal?: string; tag?: string; pos?: string };
    readonly classList?: { contains(className: string): boolean };
    contains(other: SourceNode | null): boolean;
}

/**
 * Length of a DOM node in source characters: text nodes count their
 * value (newlines included), tag chips their literal markup, live tag
 * elements their children (the tag source itself lives in the chips),
 * and a <br> counts as one newline.
 */
export function innerLength(node: SourceNode): number {
    if (node.nodeType === TEXT_NODE) return node.nodeValue?.length ?? 0;
    if (node.nodeType !== ELEMENT_NODE) return 0;
    const literal = node.dataset?.literal;
    if (literal !== undefined) return literal.length;
    if (node.tagName === "BR") return 1;
    let sum = 0;
    for (let i = 0; i < node.childNodes.length; i++) sum += innerLength(node.childNodes[i]!);
    return sum;
}

/** Serializes a DOM subtree back to its source string. */
export function serialize(node: SourceNode): string {
    if (node.nodeType === TEXT_NODE) return node.nodeValue ?? "";
    if (node.nodeType !== ELEMENT_NODE) return "";
    const literal = node.dataset?.literal;
    if (literal !== undefined) return literal;
    if (node.tagName === "BR") return "\n";
    let out = "";
    for (let i = 0; i < node.childNodes.length; i++) out += serialize(node.childNodes[i]!);
    return out;
}

/**
 * Same signature as core's structureSignature, but computed from the
 * DOM: chips contribute their literal, live tag elements their tag name.
 */
export function domStructureSignature(root: SourceNode): string {
    const out: string[] = [];
    const walk = (parent: SourceNode): void => {
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i]!;
            if (child.nodeType !== ELEMENT_NODE) continue;
            const literal = child.dataset?.literal;
            if (literal !== undefined) {
                out.push("C" + literal);
                continue;
            }
            if (child.classList?.contains("live-tag")) {
                out.push("L" + (child.dataset?.tag ?? ""));
            }
            walk(child);
        }
    };
    walk(root);
    return out.join("|");
}

/**
 * Maps a source offset to a DOM position. Chips are atomic (caret
 * only before/after them); live tag elements are descended into.
 */
export function locate(root: SourceNode, offset: number): { node: SourceNode; offset: number } {
    let acc = 0;
    for (let i = 0; i < root.childNodes.length; i++) {
        const child = root.childNodes[i]!;
        if (child.nodeType === TEXT_NODE) {
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
            if (child.dataset?.literal !== undefined || child.tagName === "BR") {
                return { node: root, offset: i }; // inside a chip/<br> → before it
            }
            return locate(child, offset - acc); // descend into a live tag
        }
        if (offset === acc + len) {
            // Right after an opening chip the caret belongs inside
            // the live element, so typing continues within the tag.
            const next = root.childNodes[i + 1];
            if (next && next.nodeType === ELEMENT_NODE && next.classList?.contains("live-tag")) {
                return locate(next, 0);
            }
            return { node: root, offset: i + 1 };
        }
        acc += len;
    }
    return { node: root, offset: root.childNodes.length };
}

/** Maps a DOM position (node, offset) under `root` to a source offset. */
export function sourceOffset(root: SourceNode, node: SourceNode, offset: number): number | null {
    if (node === root) {
        let sum = 0;
        for (let i = 0; i < offset && i < root.childNodes.length; i++) {
            sum += innerLength(root.childNodes[i]!);
        }
        return sum;
    }
    let acc = 0;
    const walk = (parent: SourceNode): number | null => {
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i]!;
            if (child === node) {
                if (node.nodeType === TEXT_NODE) return acc + offset;
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
    return walk(root);
}
