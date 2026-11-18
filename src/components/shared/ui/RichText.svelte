<script lang="ts">
    import { asRawCardSide, parseInlineSide } from "#lib/core/deck/inline";
    import type { Style } from "#lib/core/deck/document";
    import CardFace from "#components/shared/ui/CardFace.svelte";

    /**
     * Renders one card side. The renderer itself never parses markup:
     * CardFace consumes the parsed `StyledText` (plain + offset spans).
     * The `text` prop is the bridge for callers that still hold a raw
     * side string — it is converted once through the single core parser
     * here at the component edge; once every caller passes `StyledText`
     * directly, this prop goes away. `disabledStyles` strips the spans of
     * those styles right after parsing (print option: render plain text).
     */
    let { text = "", disabledStyles = [] }: { text?: string; disabledStyles?: Style[] } = $props();

    const styled = $derived.by(() => {
        const parsed = parseInlineSide(asRawCardSide(text));
        if (disabledStyles.length === 0) return parsed;
        const off = new Set(disabledStyles);
        return { ...parsed, spans: parsed.spans.filter((s) => !off.has(s.style)) };
    });
</script>

<CardFace text={styled} />
