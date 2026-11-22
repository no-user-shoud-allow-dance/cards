<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { Page, ReadyGate, decks, route } from "#components";
    import type { RouteKind } from "#components";
    import { core } from "#lib";

    let { data, children } = $props();

    // Decks live only in this browser (IndexedDB). Wait for them before
    // rendering the page, so no "Stapel nicht gefunden" flash appears for
    // user decks.
    let ready = $state(false);

    onMount(() => {
        decks.init().then(() => {
            ready = true;
        });
    });

    // Guard once for the whole group: every page here (/deck, /draft,
    // /overview, /cram, /export, /edit, /print) needs an existing deck.
    const entry = $derived(ready ? decks.load(data.slug) : null);
    const deckMissing = $derived(entry === null);

    // Drafts are unsaved work-in-progress: everything except the draft
    // preview (/draft) and the editor (/edit) is restricted for them —
    // deep links bounce to the draft page. Saved decks, mirrored, bounce
    // off the draft page back to their deck page (no study logic there).
    const DRAFT_RESTRICTED: ReadonlySet<RouteKind> = new Set([
        "deck",
        "cram",
        "overview",
        "export",
        "print",
    ]);

    const isDraft = $derived(entry !== null && entry.folders.includes(core.DRAFT_FOLDER));

    const draftRestricted = $derived(entry !== null && isDraft && DRAFT_RESTRICTED.has(route.kind));
    const savedOnDraft = $derived(entry !== null && !isDraft && route.kind === "draft");

    // Each redirect flips its derived once the route kind changes, so
    // they fire exactly once.
    $effect(() => {
        if (draftRestricted) {
            void goto(resolve("/(deck)/draft/[slug]", { slug: data.slug }));
        } else if (savedOnDraft) {
            void goto(resolve("/(deck)/deck/[slug]", { slug: data.slug }));
        }
    });
</script>

<ReadyGate bind:ready>
    {#if deckMissing}
        <Page>
            <p>Stapel nicht gefunden.</p>
        </Page>
    {:else if draftRestricted || savedOnDraft}
        <!-- Redirecting (see the effect above) — render nothing in
             between, so no restricted content flashes. -->
    {:else}
        {@render children()}
    {/if}
</ReadyGate>
