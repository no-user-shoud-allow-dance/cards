<script lang="ts">
    import type { Snippet } from "svelte";
    import { fade } from "svelte/transition";

    // One empty state (H17): icon + one-line message + optional action.
    let {
        icon,
        message,
        action,
    }: {
        icon?: Snippet;
        message: string;
        action?: { href: string; label: string };
    } = $props();
</script>

<div class="empty-state" in:fade={{ duration: 150 }}>
    {#if icon}
        <span class="empty-icon">{@render icon()}</span>
    {/if}
    <p class="empty-message">{message}</p>
    {#if action}
        <!-- Callers pass an already resolve()d route; resolving again would fail at runtime. -->
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="empty-action" href={action.href}>{action.label}</a>
    {/if}
</div>

<style lang="postcss">
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;

        margin: 1rem 0;
        padding: 2rem 1rem;

        color: var(--text-muted);
        text-align: center;
    }

    .empty-icon {
        color: var(--border-strong);
        line-height: 0;
    }

    .empty-message {
        margin: 0;
        font-size: var(--fs-4);
    }

    .empty-action {
        color: var(--primary);
        font-size: var(--fs-4);
        font-weight: 600;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
</style>
