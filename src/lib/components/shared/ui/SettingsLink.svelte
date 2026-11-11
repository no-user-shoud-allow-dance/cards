<script lang="ts">
    import type { HTMLAnchorAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression.
    let {
        href,
        ...rest
    }: {
        href: string;
    } & HTMLAnchorAttributes<HTMLAnchorElement> = $props();
</script>

<a
    {...rest}
    class={["settings-link", rest.class]}
    {href}
    aria-label="Einstellungen öffnen"
>
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            stroke-width="1.8"
        />
    </svg>
</a>

<style>
    .settings-link {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;

        width: 2.2rem;
        height: 2.2rem;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        background: var(--surface);

        color: var(--primary);
        text-decoration: none;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast),
            transform var(--transition-spring);
    }

    .settings-link svg {
        transition: transform var(--transition-spring);
    }

    .settings-link:hover {
        border-color: var(--primary);
        background: var(--primary-soft);
        transform: scale(1.06);
    }

    .settings-link:hover svg {
        transform: rotate(45deg);
    }

    .settings-link:active {
        transform: scale(0.92);
    }

    .settings-link:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
    }
</style>
