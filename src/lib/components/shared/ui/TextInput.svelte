<script lang="ts">
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
    } = $props();
</script>

<label class="text-input" class:disabled>
    <span class="input-label">{label}{#if required}<span class="required" aria-hidden="true">*</span>{/if}</span>
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

<style>
    .text-input {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .text-input.disabled { opacity: 0.55; }

    .input-label {
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
    }

    .required { color: var(--danger-text); }

    input {
        width: 100%;
        min-height: 2.65rem;
        padding: 0.55rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-size: 0.9rem;
        transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    input::placeholder {
        color: var(--text-muted);
        opacity: 0.6;
    }

    input:hover:not(:disabled) { border-color: var(--border-strong); }

    input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--focus-ring);
    }

    input:disabled {
        cursor: not-allowed;
        background: var(--surface-soft);
    }
</style>
