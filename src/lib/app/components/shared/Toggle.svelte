<script lang="ts">
    let {
        label,
        checked,
        onchange,
    }: {
        label: string;
        checked: boolean;
        onchange: (checked: boolean) => void;
    } = $props();
</script>

<label class="toggle">
    <input
        type="checkbox"
        checked={checked}
        onchange={(e) => onchange(e.currentTarget.checked)}
    />
    <span>{label}</span>
</label>

<style>
    .toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;

        color: var(--text-muted);
        font-size: 0.875rem;
        font-weight: 500;

        cursor: pointer;
        user-select: none;
    }

    /* Custom switch, while preserving the native checkbox interaction. */

    .toggle input {
        position: relative;
        appearance: none;
        flex: 0 0 auto;

        width: 2.1rem;
        height: 1.2rem;
        margin: 0;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-pill);
        background: var(--surface-soft);

        cursor: pointer;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast);
    }

    .toggle input::after {
        position: absolute;
        top: 2px;
        left: 2px;

        width: 0.78rem;
        height: 0.78rem;

        border-radius: 50%;
        transform: translateY(1px);

        background: var(--text-muted);
        content: "";
        transition:
            transform var(--transition-fast),
            background var(--transition-fast);
    }

    .toggle input:checked {
        border-color: var(--primary);
        background: var(--primary);
    }

    .toggle input:checked::after {
        transform: translateX(0.9rem) translateY(1px);
        background: var(--primary-text);
    }

    .toggle input:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }
</style>
