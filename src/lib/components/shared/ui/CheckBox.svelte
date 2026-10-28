<script lang="ts">
    let {
        label,
        checked = $bindable(false),
        disabled = false,
        variant = "primary",
        size = "md",
        name,
        id,
        onchange,
    }: {
        label: string;
        checked?: boolean;
        disabled?: boolean;
        variant?: "primary" | "success" | "danger" | "warning" | "info" | "overview";
        size?: "sm" | "md" | "lg";
        name?: string;
        id?: string;
        onchange?: (checked: boolean) => void;
    } = $props();
</script>

<label class="checkbox {variant} {size}" class:disabled>
    <input
        type="checkbox"
        {id}
        {name}
        {disabled}
        bind:checked
        onchange={(e) => onchange?.(e.currentTarget.checked)}
    />
    <span class="box" aria-hidden="true">
        <svg viewBox="0 0 12 10" class="check">
            <path d="M1 5.5 4.5 9 11 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    </span>
    <span class="label">{label}</span>
</label>

<style>
    .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        color: var(--text);
        font-weight: 500;
        cursor: pointer;
        user-select: none;
    }

    .checkbox.disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .checkbox input {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
    }

    .box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--surface);
        color: transparent;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast),
            color var(--transition-fast);
    }

    .check {
        width: 0.7rem;
        height: 0.6rem;
    }

    .checkbox input:focus-visible + .box {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    .label {
        line-height: 1.4;
    }

    /* ── Size variants ──────────────────────────────────────────── */
    .checkbox.sm { gap: 0.45rem; font-size: 0.8rem; }
    .checkbox.sm .box { width: 0.95rem; height: 0.95rem; }
    .checkbox.sm .check { width: 0.55rem; height: 0.48rem; }

    .checkbox.md { font-size: 0.875rem; }
    .checkbox.md .box { width: 1.15rem; height: 1.15rem; }

    .checkbox.lg { gap: 0.65rem; font-size: 0.95rem; }
    .checkbox.lg .box { width: 1.35rem; height: 1.35rem; }
    .checkbox.lg .check { width: 0.85rem; height: 0.72rem; }

    /* ── Color variants (checked state) ─────────────────────────── */
    .checkbox.primary input:checked + .box {
        border-color: var(--primary);
        background: var(--primary);
        color: var(--primary-text);
    }
    .checkbox.success input:checked + .box {
        border-color: var(--success-text);
        background: var(--success-text);
        color: var(--success-bg);
    }
    .checkbox.danger input:checked + .box {
        border-color: var(--danger-text);
        background: var(--danger-text);
        color: var(--danger-bg);
    }
    .checkbox.warning input:checked + .box {
        border-color: var(--warning-text);
        background: var(--warning-text);
        color: var(--warning-bg);
    }
    .checkbox.info input:checked + .box {
        border-color: var(--info-text);
        background: var(--info-text);
        color: var(--info-bg);
    }
    .checkbox.overview input:checked + .box {
        border-color: var(--overview);
        background: var(--overview);
        color: var(--overview-text);
    }
</style>
