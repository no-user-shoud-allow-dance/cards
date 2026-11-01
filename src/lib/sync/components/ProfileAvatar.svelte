<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { computeAvatar } from "../avatar";
    import { syncStore } from "../store/syncStore.svelte";

    // `class` arrives via rest and is merged into the class expression of
    // whichever root is rendered; other attributes fall through via rest.
    let {
        size = 32,
        href,
        ...rest
    }: {
        /** Display size in px; the SVG viewBox scales crisply to it. */
        size?: number;
        /** When set, the avatar becomes a link (e.g. to the account page). */
        href?: string;
    } & HTMLAttributes<HTMLElement> = $props();

    // Recomputed whenever the UUID changes (e.g. after rotation). Before
    // the store hydrates the uuid is "" — computeAvatar handles that.
    const avatar = $derived(computeAvatar(syncStore.profile.uuid));
</script>

{#snippet avatarSvg(attrs: HTMLAttributes<HTMLElement>)}
    <svg
        {...attrs}
        class={["avatar", attrs.class]}
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label="Konto-Avatar"
        aria-hidden={href ? true : undefined}
    >
        <rect width="100" height="100" fill={avatar.background} />
        {#each avatar.rings as ring, i (i)}
            <path d={ring.d} fill={ring.fill} />
        {/each}
    </svg>
{/snippet}

{#if href}
    <a {...rest} class={["avatar-link", rest.class]} {href} aria-label="Konto öffnen">
        {@render avatarSvg({})}
    </a>
{:else}
    {@render avatarSvg(rest)}
{/if}

<style>
    .avatar {
        display: block;

        border: 1px solid var(--border);
        border-radius: var(--radius-pill);
        box-shadow: var(--shadow-sm);
    }

    .avatar-link {
        flex: 0 0 auto;

        line-height: 0;

        border-radius: var(--radius-pill);
    }

    .avatar-link:hover .avatar {
        border-color: var(--border-strong);
    }

    .avatar-link:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
    }
</style>
