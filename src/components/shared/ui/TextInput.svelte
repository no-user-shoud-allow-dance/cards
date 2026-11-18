<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression; other
    // attributes fall through to the root <label> via {...rest}.
    let {
        label,
        value = $bindable(""),
        type = "text",
        placeholder,
        disabled = false,
        required = false,
        id,
        name,
        oninput,
        onblur,
        ...rest
    }: {
        label: string;
        value?: string;
        type?: "text" | "email" | "password" | "search" | "url" | "number";
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        id?: string;
        name?: string;
        oninput?: (value: string) => void;
        onblur?: (value: string) => void;
    } & Omit<HTMLAttributes<HTMLLabelElement>, "oninput" | "onblur"> = $props();
</script>

<label {...rest} class={["text-input", rest.class]} class:disabled>
    <span class="input-label">
        {label}{#if required}<span class="required" aria-hidden="true">*</span>{/if}
    </span>
    <input
        {id}
        {name}
        {type}
        {placeholder}
        {disabled}
        {required}
        bind:value
        oninput={(e) => oninput?.(e.currentTarget.value)}
        onblur={(e) => onblur?.(e.currentTarget.value)}
    />
</label>

<style lang="postcss">
    .text-input {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        &.disabled {
            opacity: 0.55;
        }
    }

    .input-label {
        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 600;
    }

    .required {
        color: var(--danger-text);
    }

    input {
        width: 100%;
        min-height: 2.65rem;
        padding: 0.55rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-size: var(--fs-4);
        transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-fast);

        &::placeholder {
            color: var(--text-muted);
            opacity: 0.6;
        }

        &:hover:not(:disabled) {
            border-color: var(--border-strong);
        }

        &:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--focus-ring);
        }

        &:disabled {
            cursor: not-allowed;
            background: var(--surface-soft);
        }
    }
</style>
