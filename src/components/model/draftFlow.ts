import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { decks } from "#components";
import { core, stashDraftDeck, toastStore } from "#lib";

/** The barebones deck (frontmatter + header, no cards) from static/decks/. */
async function barebonesSource(): Promise<string> {
    const response = await fetch("/decks/barebones-deck.md");
    if (!response.ok) throw new Error("barebones-deck.md missing");
    return response.text();
}

function gotoEditor(slug: string): void {
    goto(resolve("/(deck)/edit/[slug]", { slug }));
}

/**
 * The shared entry workflow of create/upload/import: creates the next
 * draft deck — `Draft-{n}` (n = latest + 1) in the folder "Drafts" — and
 * redirects to its editor. `content` is the source put into the deck
 * (uploaded file / shared link); null uses the barebones deck. The H1
 * is (re)set to the draft name, so the stored deck is named `Draft-{n}`.
 *
 * Invalid content (parse errors): the draft is still created, but
 * barebones, and the original source is stashed for the editor — the
 * editor opens with it and lists the parse errors there.
 */
export async function startDraft(content: string | null): Promise<void> {
    await decks.init();
    const name = decks.nextDraftName();
    if (content !== null) {
        const result = await decks.createDraft(core.setDeckTitleSource(content, name));
        if (result.deck) return gotoEditor(result.deck.slug);
        // Invalid upload/import: keep the source for the editor, the
        // draft itself stays barebones.
        const { doc } = core.parseCollect(core.makeRawMarkdown(content));
        stashDraftDeck({
            raw: content,
            deckType: doc?.type ?? "english",
            name,
            title: null,
        });
        const fallback = await decks.createDraft(
            core.setDeckTitleSource(await barebonesSource(), name)
        );
        if (fallback.deck) return gotoEditor(fallback.deck.slug);
        toastStore.error(fallback.errors[0] ?? "Der Entwurf konnte nicht erstellt werden.");
        return;
    }
    try {
        const result = await decks.createDraft(
            core.setDeckTitleSource(await barebonesSource(), name)
        );
        if (result.deck) return gotoEditor(result.deck.slug);
        toastStore.error(result.errors[0] ?? "Der Entwurf konnte nicht erstellt werden.");
    } catch {
        toastStore.error("Die Vorlage (barebones-deck.md) konnte nicht geladen werden.");
    }
}
