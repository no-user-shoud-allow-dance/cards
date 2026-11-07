<script lang="ts">
    import type { AllowedTag } from "#lib/utils/inlineFormat";

    /** Small inline SVG icon for one allowlisted tag (toolbar buttons). */
    let { tag }: { tag: AllowedTag } = $props();
</script>

<svg
    class="tag-icon"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
>
    {#if tag === "code"}
        <text x="0.5" y="11.5" font-size="11" fill="currentColor">&lt;/&gt;</text>
    {:else if tag === "sup"}
        <text
            x="5"
            y="11"
            font-size="10"
            font-weight="600"
            fill="currentColor">x</text
        >
        <text
            x="11"
            y="8"
            font-size="7"
            font-weight="600"
            fill="currentColor">2</text
        >
    {:else if tag === "sub"}
        <text
            x="5"
            y="11"
            font-size="10"
            font-weight="600"
            fill="currentColor">x</text
        >
        <text
            x="11"
            y="13"
            font-size="7"
            font-weight="600"
            fill="currentColor">2</text
        >
    {:else if tag === "b"}
        <text
            x="4.5"
            y="11.5"
            font-size="11"
            font-weight="700"
            fill="currentColor">B</text
        >
    {:else if tag === "i"}
        <text
            x="6"
            y="11.5"
            font-size="11"
            font-style="italic"
            fill="currentColor">I</text
        >
    {:else if tag === "u"}
        <text
            x="4.5"
            y="11"
            font-size="11"
            text-decoration="underline"
            fill="currentColor">U</text
        >
    {:else if tag === "s"}
        <text
            x="5"
            y="11.5"
            font-size="11"
            text-decoration="line-through"
            fill="currentColor">S</text
        >
    {:else if tag === "mark"}
        <rect
            x="1.5"
            y="3"
            width="13"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.3"
        />
        <text
            x="4.5"
            y="10.9"
            font-size="8.5"
            font-weight="600"
            fill="currentColor">M</text
        >
    {/if}
</svg>

<style>
    .tag-icon {
        display: block;

        width: 1rem;
        height: 1rem;
    }
</style>
