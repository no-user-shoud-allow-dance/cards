<script lang="ts">
    import { displayBack, displayFront } from "#components/model/display";
    import type { FlashCard } from "#components/model/deckView";
    import { effectiveDisabledStyles, type PrintOptionsState } from "#components/model/print";
    import type { DeckType } from "#lib/core/deck/document";
    import CardImages from "#components/shared/ui/CardImages.svelte";
    import RichText from "#components/shared/ui/RichText.svelte";
    import { UI } from "#messages/locale.svelte";

    /**
     * The printable card table. Normal mode: one row per card with columns
     * (Nr. / Vorderseite / Rückseite / Kontext / Bild). Paper mode
     * (Lernpapier): one row per card with the card in the left half
     * (50 % width), a vertical splitter, then an empty right cell as
     * writing space. Renders the same on screen (preview) and in print.
     */
    let {
        cards,
        deckType,
        options,
    }: {
        cards: FlashCard[];
        deckType: DeckType;
        options: PrintOptionsState;
    } = $props();

    const disabledStyles = $derived(effectiveDisabledStyles(options));
</script>

<table
    class="print-table"
    class:zebra={options.zebraRows}
    class:paper={options.paperRows}
    class:no-borders={!options.showBorders}
>
    {#if options.showHeader}
        <thead>
            {#if options.paperRows}
                <tr>
                    <th>{UI.printCard}</th>
                    <th class="learn-head" aria-label={UI.printLearnField}></th>
                </tr>
            {:else}
                <tr>
                    {#if options.showNumbers}
                        <th class="num">{UI.printNumber}</th>
                    {/if}
                    <th>{UI.printFront}</th>
                    <th>{UI.printBack}</th>
                    {#if options.showContext}
                        <th>{UI.printContext}</th>
                    {/if}
                    {#if options.showImages}
                        <th>{UI.printImage}</th>
                    {/if}
                </tr>
            {/if}
        </thead>
    {/if}
    <tbody>
        {#each cards as card, i (card.id)}
            {#if options.paperRows}
                <tr class="card-row" class:alt={options.zebraRows && i % 2 === 1}>
                    <td class="card-cell">
                        <div class="cell-front">
                            {#if options.showNumbers}
                                <span class="num">{i + 1}.</span>
                            {/if}
                            <RichText text={displayFront(card, false, deckType)} {disabledStyles} />
                        </div>
                        <div class="cell-back">
                            <RichText text={displayBack(card, false)} {disabledStyles} />
                        </div>
                        {#if options.showContext && card.context}
                            <div class="cell-context">
                                <RichText text={card.context} {disabledStyles} />
                            </div>
                        {/if}
                        {#if options.showTags && card.tags.length > 0}
                            <span class="tags">{card.tags.map((t) => `#${t}`).join(" ")}</span>
                        {/if}
                        {#if options.showImages && card.image}
                            <CardImages images={[card.image]} variant="thumb" />
                        {/if}
                    </td>
                    <!-- Lernfeld: always unstriped writing space on the right. -->
                    <td class="learn-cell" aria-hidden="true"></td>
                </tr>
            {:else}
                <tr class="card-row" class:alt={options.zebraRows && i % 2 === 1}>
                    {#if options.showNumbers}
                        <td class="num">{i + 1}</td>
                    {/if}
                    <td class="front">
                        <RichText text={displayFront(card, false, deckType)} {disabledStyles} />
                        {#if options.showTags && card.tags.length > 0}
                            <span class="tags">{card.tags.map((t) => `#${t}`).join(" ")}</span>
                        {/if}
                    </td>
                    <td class="back">
                        <RichText text={displayBack(card, false)} {disabledStyles} />
                    </td>
                    {#if options.showContext}
                        <td class="context">
                            {#if card.context}
                                <RichText text={card.context} {disabledStyles} />
                            {/if}
                        </td>
                    {/if}
                    {#if options.showImages}
                        <td class="image-cell">
                            {#if card.image}
                                <CardImages images={[card.image]} variant="thumb" />
                            {/if}
                        </td>
                    {/if}
                </tr>
            {/if}
        {/each}
    </tbody>
</table>

<style lang="postcss">
    .print-table {
        width: 100%;
        border-collapse: collapse;

        font-size: var(--fs-3);
        line-height: 1.45;

        & th {
            padding: 0.45rem 0.6rem;

            border: 1px solid var(--border-strong);

            color: var(--text-muted);
            font-size: var(--fs-2);
            font-weight: 600;
            letter-spacing: 0.05em;
            text-align: left;
            text-transform: uppercase;
        }

        & td {
            padding: 0.5rem 0.6rem;

            border: 1px solid var(--border);

            vertical-align: top;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        }

        & .num {
            color: var(--text-muted);
            font-variant-numeric: tabular-nums;
        }

        & .front,
        & .cell-front {
            font-weight: 600;
        }

        & .back,
        & .cell-back {
            color: var(--text-muted);
        }

        & .context,
        & .cell-context {
            color: var(--text-muted);
            font-size: var(--fs-2);
        }

        & .tags {
            display: block;

            margin-top: 0.2rem;

            color: var(--text-muted);
            font-size: var(--fs-2);
            font-weight: 400;
        }

        &.paper.zebra .card-row.alt > td {
            background: transparent;
        }

        &.paper.zebra .card-row.alt > .card-cell {
            background: var(--surface-soft);
        }

        &.paper .learn-head,
        &.paper .learn-cell {
            width: 50%;
        }

        &.paper .card-row > td {
            height: var(--paper-row-h);
        }

        &.paper .learn-cell {
            border-left: 1px dashed var(--border-strong);
        }

        &.paper.no-borders .learn-cell {
            border-left: 0;
        }
    }

    /* Border toggle off: no cell borders, no splitter — pure whitespace. */
    .print-table.no-borders th,
    .print-table.no-borders td {
        border: 0;
    }

    .print-table th.num {
        width: 2.2rem;
        text-align: right;
    }

    .print-table td.num {
        width: 2.2rem;
        text-align: right;
    }

    .print-table .image-cell {
        width: 5rem;
    }

    /* Zebra striping on screen — in paper mode only the card half is
       striped, the Lernfeld never switches colors. */
    .print-table.zebra .card-row.alt > td {
        background: var(--surface-soft);
    }

    /* Lernpapier: fixed layout so the halves are exactly 50/50 — card
       left, Lernfeld right; the splitter is the Lernfeld's left border.
       Rows get a minimum height so there is room to write. */
    .print-table.paper {
        table-layout: fixed;
        --paper-row-h: 30mm;
    }

    @media (max-width: 540px) {
        .print-table {
            font-size: var(--fs-2);

            & th,
            & td {
                padding: 0.35rem 0.4rem;
            }
        }
    }

    /* Print: the header row repeats on every page, rows never split, and
       zebra backgrounds are kept (browsers drop backgrounds by default). */
    @media print {
        .print-table thead {
            display: table-header-group;
        }

        .print-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .print-table td {
            border-color: var(--border-strong);
        }

        .print-table.zebra .card-row.alt > td {
            background: var(--surface-soft);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .print-table.paper.zebra .card-row.alt > td {
            background: transparent;
        }

        .print-table.paper.zebra .card-row.alt > .card-cell {
            background: var(--surface-soft);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .image-cell :global(.card-image) {
            max-width: 24mm;
            max-height: 18mm;
        }
    }
</style>
