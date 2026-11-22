import { describe, expect, test } from "bun:test";
import {
    domStructureSignature,
    innerLength,
    locate,
    serialize,
    sourceOffset,
    type SourceNode,
} from "#components/model/sourceFieldDom";

const ELEMENT = 1;
const TEXT = 3;
const COMMENT = 8;

function text(value: string): SourceNode {
    const node: SourceNode = {
        nodeType: TEXT,
        nodeValue: value,
        childNodes: [],
        contains: (other) => other === node,
    };
    return node;
}

function comment(): SourceNode {
    return { nodeType: COMMENT, nodeValue: "x", childNodes: [], contains: () => false };
}

/** A delimiter chip: an atomic element carrying its literal source. */
function chip(literal: string): SourceNode {
    const node: SourceNode = {
        nodeType: ELEMENT,
        nodeValue: null,
        tagName: "SPAN",
        dataset: { literal },
        classList: { contains: () => false },
        childNodes: [],
        contains: (other) => other === node,
    };
    return node;
}

function br(): SourceNode {
    const node: SourceNode = {
        nodeType: ELEMENT,
        nodeValue: null,
        tagName: "BR",
        classList: { contains: () => false },
        childNodes: [],
        contains: (other) => other === node,
    };
    return node;
}

/** A live tag element (`<b>`, hint span, image span) with children. */
function live(tag: string, children: SourceNode[]): SourceNode {
    const node: SourceNode = {
        nodeType: ELEMENT,
        nodeValue: null,
        tagName: "SPAN",
        dataset: { tag },
        classList: { contains: (c) => c === "live-tag" },
        childNodes: children,
        contains: (other) => other === node || children.some((c) => c.contains(other)),
    };
    return node;
}

/** A plain container element (the editable root). */
function elem(children: SourceNode[]): SourceNode {
    const node: SourceNode = {
        nodeType: ELEMENT,
        nodeValue: null,
        tagName: "DIV",
        classList: { contains: () => false },
        childNodes: children,
        contains: (other) => other === node || children.some((c) => c.contains(other)),
    };
    return node;
}

/** The tree SourceField.render builds for the source `amo **liebe**!`. */
function boldTree(): SourceNode {
    return elem([text("amo "), chip("**"), live("bold", [text("liebe")]), chip("**"), text("!")]);
}

describe("innerLength", () => {
    test("text node counts its value", () => {
        expect(innerLength(text("abc"))).toBe(3);
        expect(innerLength(text("a\nb"))).toBe(3);
    });

    test("chip counts its literal markup", () => {
        expect(innerLength(chip("**"))).toBe(2);
        expect(innerLength(chip("++"))).toBe(2);
    });

    test("<br> counts as one newline, other non-element nodes as zero", () => {
        expect(innerLength(br())).toBe(1);
        expect(innerLength(comment())).toBe(0);
    });

    test("live elements count only their children", () => {
        expect(innerLength(live("bold", [text("liebe")]))).toBe(5);
        expect(innerLength(boldTree())).toBe(4 + 2 + 5 + 2 + 1);
    });
});

describe("serialize", () => {
    test("serializing the rendered tree reproduces the source exactly", () => {
        expect(serialize(boldTree())).toBe("amo **liebe**!");
    });

    test("<br> serializes to a newline, comments to nothing", () => {
        expect(serialize(elem([text("a"), br(), comment(), text("b")]))).toBe("a\nb");
    });
});

describe("domStructureSignature", () => {
    test("chips contribute their literal, live tags their tag name", () => {
        expect(domStructureSignature(boldTree())).toBe("C**|Lbold|C**");
    });

    test("chips are not descended into, live tags are", () => {
        const root = elem([live("hint", [text("["), chip("**"), text("]")])]);
        expect(domStructureSignature(root)).toBe("Lhint|C**");
    });
});

describe("locate", () => {
    test("offsets inside a text node map into it", () => {
        const root = boldTree();
        expect(locate(root, 0)).toEqual({ node: root.childNodes[0], offset: 0 });
        expect(locate(root, 4)).toEqual({ node: root.childNodes[0], offset: 4 });
    });

    test("an offset inside a chip maps to before the chip", () => {
        const root = boldTree();
        expect(locate(root, 5)).toEqual({ node: root, offset: 1 });
    });

    test("right after an opening chip the caret descends into the live element", () => {
        const root = boldTree();
        const liveNode = root.childNodes[2]!;
        expect(locate(root, 6)).toEqual({ node: liveNode.childNodes[0], offset: 0 });
    });

    test("offset past the end maps to the end of the root", () => {
        const root = boldTree();
        expect(locate(root, 999)).toEqual({ node: root, offset: root.childNodes.length });
    });

    test("a <br> is atomic: the caret sits before or after it, never inside", () => {
        const root = elem([br(), text("b")]);
        expect(locate(root, 0)).toEqual({ node: root, offset: 0 });
        expect(locate(root, 1)).toEqual({ node: root, offset: 1 });
    });
});

describe("sourceOffset", () => {
    test("a position on the root sums the children before it", () => {
        const root = boldTree();
        expect(sourceOffset(root, root, 0)).toBe(0);
        expect(sourceOffset(root, root, 2)).toBe(4 + 2);
        expect(sourceOffset(root, root, root.childNodes.length)).toBe(14);
    });

    test("a position inside a text node adds the in-node offset", () => {
        const root = boldTree();
        const inner = root.childNodes[2]!.childNodes[0]!;
        // chip + "amo " before the live element: 4 + 2 = 6, plus 2 in "liebe"
        expect(sourceOffset(root, inner, 2)).toBe(8);
    });

    test("a node outside the root maps to null", () => {
        const root = boldTree();
        expect(sourceOffset(root, text("x"), 0)).toBeNull();
    });
});

describe("locate/sourceOffset round-trip", () => {
    test("on a text-only tree every offset maps there and back", () => {
        const root = elem([text("amo "), text("liebe"), br(), text("!")]);
        const total = innerLength(root);
        expect(total).toBe(11);
        for (let off = 0; off <= total; off++) {
            const pos = locate(root, off);
            expect(sourceOffset(root, pos.node, pos.offset)).toBe(off);
        }
    });
});
