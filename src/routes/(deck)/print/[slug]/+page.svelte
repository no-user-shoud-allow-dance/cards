<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import {
        Button,
        Card,
        Page,
        PageHeader,
        PrintOptions,
        PrintTable,
        collectPrintTags,
        decks,
        defaultPrintOptions,
        filterPrintCards,
        folderLabel,
    } from "#components";
    import type { LoadedDeck, PrintOptionsState } from "#components";
    import { settingsStore } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    // The options live in the settings record (one object under
    // kk-settings): start from defaults, hydrate once the store is loaded,
    // then persist every change.
    let options = $state<PrintOptionsState>(defaultPrintOptions());
    let hydrated = $state(false);

    onMount(() => {
        void settingsStore.init().then(() => {
            const stored = settingsStore.printOptions;
            options = {
                ...stored,
                hiddenTags: [...stored.hiddenTags],
                enabledStyles: [...stored.enabledStyles],
            };
            hydrated = true;
        });
    });

    $effect(() => {
        if (!hydrated) return;
        const snapshot: PrintOptionsState = {
            ...options,
            hiddenTags: [...options.hiddenTags],
            enabledStyles: [...options.enabledStyles],
        };
        void settingsStore.setPrintOptions(snapshot);
    });

    // Broken decks are never printable: the deck page hides the button
    // and this route refuses as well (it stays reachable by URL).
    const hasErrors = $derived(deck.errors.length > 0);

    const allTags = $derived(collectPrintTags(deck.cards));
    const visible = $derived(filterPrintCards(deck.cards, options));

    function print(): void {
        window.print();
    }
</script>

<svelte:head>
    <title>Stapel drucken – NSC</title>
</svelte:head>

<Page class="print-page">
    <div class="no-print">
        <PageHeader
            title="Stapel drucken"
            subtitle="{folderLabel(deck.folders)} / {deck.name} – {UI.countCards(
                visible.length
            )} werden gedruckt."
        />

        {#if hasErrors}
            <Card class="options-card" padding="md" bg="soft" role="alert">
                <p class="error-text">{UI.deckHasErrors}</p>
                <div class="actions">
                    <Button href={resolve("/(deck)/edit/[slug]", { slug: deck.slug })}>
                        Bearbeiten
                    </Button>
                </div>
            </Card>
        {:else}
            <Card class="options-card" padding="md" bg="soft">
                <PrintOptions {options} {allTags} />
            </Card>

            <div class="actions">
                <Button variant="primary" onclick={print} disabled={hasErrors}>Drucken</Button>
            </div>
        {/if}
    </div>

    <!-- H15: on screen the preview is an A4-proportioned paper sheet, so
         WYSIWYG holds; the frame is screen-only, @media print strips it. -->
    <div class="print-sheet">
        <div class="print-area">
            {#if hasErrors}
                <!-- nothing to print for a broken deck -->
            {:else}
                {#if options.showTitle}
                    <h1 class="print-heading">{deck.name}</h1>
                {/if}
                {#if visible.length === 0}
                    <p class="empty">Keine Karten zum Drucken – alle Karten sind ausgeblendet.</p>
                {:else}
                    <PrintTable cards={visible} deckType={deck.deckType} {options} />
                {/if}
                {#if options.showWatermark}
                    <!-- position: fixed repeats the watermark on every printed page. -->
                    <div class="watermark" aria-hidden="true">
                        <img src="/favicon.svg" alt="" />
                        <span>NSC</span>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</Page>

<style lang="postcss">
    /* Card provides border/radius/padding; the class lands on its root. */
    :global(.options-card) {
        margin-bottom: 1.25rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;

        margin-bottom: 2rem;
    }

    /* The deck name only appears on the printed sheet, not on screen. */
    .print-heading {
        display: none;
    }

    .error-text {
        margin: 0 0 0.9rem;
        color: var(--danger-text);
        font-size: var(--fs-4);
        line-height: 1.6;
    }

    .empty {
        color: var(--text-muted);
        font-size: var(--fs-5);
    }

    /* Screen: the watermark exists only on paper. */
    .watermark {
        display: none;
    }

    @media print {
        /* Beat the Page component's content-width cap (higher specificity
           than its own `.page` rule, order-independent). */
        :global(.page.print-page) {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
        }

        .print-heading {
            display: block;

            margin: 0 0 4mm;

            font-size: 16pt;
            font-weight: 600;
        }

        /* Bottom-left of every printed sheet; fixed elements repeat per
           page in print. Small: favicon + "NSC" in muted text color. */
        .watermark {
            position: fixed;
            left: 0;
            bottom: 0;
            z-index: 5;

            display: flex;
            align-items: center;
            gap: 1.5mm;

            color: var(--text-muted);
            font-size: 8pt;
            font-weight: 600;
            letter-spacing: 0.08em;

            & img {
                display: block;

                width: 4mm;
                height: 4mm;
            }
        }

        /* Keep the last table row clear of the watermark. */
        .print-area {
            padding-bottom: 8mm;
        }
    }

    /* H15: the paper sheet is screen-only. Paper colors are constant
       tokens, so the sheet reads as paper in the dark theme too. */
    @media screen {
        .print-sheet {
            max-width: 820px;
            margin: 0 auto 2rem;
            padding: clamp(1.25rem, 4dvw, 2.5rem);

            aspect-ratio: 210 / 297;

            border: 1px solid var(--paper-border);
            border-radius: var(--radius-md);

            background: var(--paper);
            color: var(--paper-ink);
            box-shadow: var(--shadow-card);

            & :global(.print-table),
            & :global(.print-table th),
            & :global(.print-table td),
            & :global(.print-table .back),
            & :global(.print-table .cell-back),
            & :global(.print-table .context),
            & :global(.print-table .cell-context),
            & :global(.print-table .tags),
            & :global(.print-table .num) {
                color: var(--paper-muted);
                border-color: var(--paper-border);
            }

            & :global(.print-table td) {
                color: var(--paper-ink);
            }

            & :global(.print-table.zebra .card-row.alt > td) {
                background: var(--paper-zebra);
            }

            & .print-heading,
            & .empty {
                color: var(--paper-ink);
            }

            & .empty {
                color: var(--paper-muted);
            }
        }
    }
</style>
