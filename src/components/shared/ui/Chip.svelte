<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    // One chip vocabulary (H10): every tone maps to a --chip-* token
    // family in app.pcss, so chips can never drift from the palette.
    // `class` arrives via rest and is merged into the class expression.
    let {
        tone = "default",
        size = "md",
        children,
        ...rest
    }: {
        tone?:
            | "default"
            | "primary"
            | "success"
            | "danger"
            | "warning"
            | "overview"
            | "info"
            | "tertiary"
            | "moon"
            | "folder"
            | "lang-greek"
            | "lang-latin"
            | "lang-english"
            | "box-1"
            | "box-2"
            | "box-3"
            | "box-4"
            | "box-5"
            | "box-6";
        size?: "sm" | "md";
        children: Snippet;
    } & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span {...rest} class={["chip", `tone-${tone}`, `size-${size}`, rest.class]}>
    {@render children()}
</span>

<style lang="postcss">
    .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-pill);

        background: var(--surface-soft);
        color: var(--text-muted);

        font-weight: 500;
        line-height: 1.5;
        white-space: nowrap;

        &.size-md {
            padding: 0.15rem 0.55rem;
            font-size: var(--fs-2);
        }

        &.size-sm {
            padding: 0.05rem 0.45rem;
            font-size: var(--fs-2);
        }
    }

    /* Semantic tones reuse the feedback/accent families. */
    .chip.tone-primary {
        border-color: transparent;
        background: var(--primary-soft);
        color: var(--primary);
    }

    .chip.tone-success {
        border-color: var(--success-border);
        background: var(--success-bg);
        color: var(--success-text);
    }

    .chip.tone-danger {
        border-color: var(--danger-border);
        background: var(--danger-bg);
        color: var(--danger-text);
    }

    .chip.tone-warning {
        border-color: var(--warning-border);
        background: var(--warning-bg);
        color: var(--warning-text);
    }

    .chip.tone-overview {
        border-color: var(--overview-border);
        background: var(--overview-soft);
        color: var(--overview);
    }

    .chip.tone-info {
        border-color: transparent;
        background: var(--info-bg);
        color: var(--info-text);
    }

    .chip.tone-tertiary {
        border-color: var(--tertiary-border);
        background: var(--tertiary-soft);
        color: var(--tertiary);
    }

    .chip.tone-moon {
        border-color: var(--chip-moon-border);
        background: var(--chip-moon-bg);
        color: var(--chip-moon-fg);
    }

    .chip.tone-folder {
        border-color: var(--chip-folder-border);
        background: var(--chip-folder-bg);
        color: var(--chip-folder-fg);
    }

    .chip.tone-lang-greek {
        border-color: transparent;
        background: var(--chip-lang-greek-bg);
        color: var(--chip-lang-greek-fg);
    }

    .chip.tone-lang-latin {
        border-color: transparent;
        background: var(--chip-lang-latin-bg);
        color: var(--chip-lang-latin-fg);
    }

    .chip.tone-lang-english {
        border-color: transparent;
        background: var(--chip-lang-english-bg);
        color: var(--chip-lang-english-fg);
    }

    .chip.tone-box-1 {
        border-color: transparent;
        background: var(--chip-box-1-bg);
        color: var(--chip-box-1-fg);
    }

    .chip.tone-box-2 {
        border-color: transparent;
        background: var(--chip-box-2-bg);
        color: var(--chip-box-2-fg);
    }

    .chip.tone-box-3 {
        border-color: transparent;
        background: var(--chip-box-3-bg);
        color: var(--chip-box-3-fg);
    }

    .chip.tone-box-4 {
        border-color: transparent;
        background: var(--chip-box-4-bg);
        color: var(--chip-box-4-fg);
    }

    .chip.tone-box-5 {
        border-color: transparent;
        background: var(--chip-box-5-bg);
        color: var(--chip-box-5-fg);
    }

    .chip.tone-box-6 {
        border-color: transparent;
        background: var(--chip-box-6-bg);
        color: var(--chip-box-6-fg);
    }
</style>
