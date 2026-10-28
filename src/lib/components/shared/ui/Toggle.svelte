<script lang="ts">
    let {
        label,
        checked,
        onchange,
        disabled = false,
        variant = "primary",
        size = "md",
    }: {
        label: string;
        checked: boolean;
        onchange: (checked: boolean) => void;
        disabled?: boolean;
        variant?: "primary" | "success" | "danger" | "warning" | "info" | "overview";
        size?: "sm" | "md" | "lg";
    } = $props();
</script>

<label class="toggle {variant} {size}" class:disabled>
    <input
        type="checkbox"
        checked={checked}
        {disabled}
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

    .toggle.disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

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

    .toggle input:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    /* Default (md) thumb travel when checked. */
    .toggle input:checked::after {
        transform: translateX(0.9rem) translateY(1px);
    }

    /* ── Size variants ──────────────────────────────────────────── */
    .toggle.sm { gap: 0.5rem; font-size: 0.8rem; }
    .toggle.sm input { width: 1.7rem; height: 0.95rem; }
    .toggle.sm input::after { width: 0.6rem; height: 0.6rem; }
    .toggle.sm input:checked::after { transform: translateX(0.72rem) translateY(1px); }

    .toggle.lg { gap: 0.75rem; font-size: 0.95rem; }
    .toggle.lg input { width: 2.5rem; height: 1.4rem; }
    .toggle.lg input::after { width: 0.95rem; height: 0.95rem; }
    .toggle.lg input:checked::after { transform: translateX(1.08rem) translateY(1px); }

    /* ── Color variants (checked state) ─────────────────────────── */
    .toggle.primary input:checked { border-color: var(--primary); background: var(--primary); }
    .toggle.primary input:checked::after { background: var(--primary-text); }

    .toggle.success input:checked { border-color: var(--success-text); background: var(--success-text); }
    .toggle.success input:checked::after { background: var(--success-bg); }

    .toggle.danger input:checked { border-color: var(--danger-text); background: var(--danger-text); }
    .toggle.danger input:checked::after { background: var(--danger-bg); }

    .toggle.warning input:checked { border-color: var(--warning-text); background: var(--warning-text); }
    .toggle.warning input:checked::after { background: var(--warning-bg); }

    .toggle.info input:checked { border-color: var(--info-text); background: var(--info-text); }
    .toggle.info input:checked::after { background: var(--info-bg); }

    .toggle.overview input:checked { border-color: var(--overview); background: var(--overview); }
    .toggle.overview input:checked::after { background: var(--overview-text); }
</style>
