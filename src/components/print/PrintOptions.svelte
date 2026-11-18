<script lang="ts">
    import { STYLES } from "#lib/core/deck/document";
    import type { Style } from "#lib/core/deck/document";
    import CheckBox from "#components/shared/ui/CheckBox.svelte";
    import SectionLabel from "#components/shared/ui/SectionLabel.svelte";
    import { STYLE_LABELS, type PrintOptionsState } from "#components/model/print";

    /**
     * All print choices of the list layout. `options` is the parent's
     * $state object, mutated in place via the checkbox callbacks.
     */
    let { options, allTags }: { options: PrintOptionsState; allTags: string[] } = $props();

    function toggleTag(tag: string): void {
        options.hiddenTags = options.hiddenTags.includes(tag)
            ? options.hiddenTags.filter((t) => t !== tag)
            : [...options.hiddenTags, tag];
    }

    function toggleStyle(style: Style): void {
        options.enabledStyles = options.enabledStyles.includes(style)
            ? options.enabledStyles.filter((s) => s !== style)
            : [...options.enabledStyles, style];
    }
</script>

<section class="print-options" aria-label="Druckoptionen">
    <SectionLabel>Druckoptionen</SectionLabel>

    <div class="option-groups">
        <fieldset class="option-group">
            <legend>Inhalt</legend>
            <CheckBox
                label="Kontext anzeigen"
                checked={options.showContext}
                onchange={(v) => (options.showContext = v)}
            />
            <CheckBox
                label="Bilder anzeigen"
                checked={options.showImages}
                onchange={(v) => (options.showImages = v)}
            />
            <CheckBox
                label="Tags anzeigen"
                checked={options.showTags}
                onchange={(v) => (options.showTags = v)}
            />
        </fieldset>

        <fieldset class="option-group">
            <legend>Tabelle</legend>
            <CheckBox
                label="Titel anzeigen"
                checked={options.showTitle}
                onchange={(v) => (options.showTitle = v)}
            />
            <CheckBox
                label="Kopfzeile anzeigen"
                checked={options.showHeader}
                onchange={(v) => (options.showHeader = v)}
            />
            <CheckBox
                label="Nummerierung anzeigen"
                checked={options.showNumbers}
                onchange={(v) => (options.showNumbers = v)}
            />
            <CheckBox
                label="Abwechselnde Zeilenfarben"
                checked={options.zebraRows}
                onchange={(v) => (options.zebraRows = v)}
            />
            <CheckBox
                label="Rahmenlinien anzeigen"
                checked={options.showBorders}
                onchange={(v) => (options.showBorders = v)}
            />
            <CheckBox
                label="Lernpapier (Lernfeld rechts, 50 %)"
                checked={options.paperRows}
                onchange={(v) => (options.paperRows = v)}
            />
        </fieldset>

        <fieldset class="option-group">
            <legend>Seite</legend>
            <CheckBox
                label="Wasserzeichen (Favicon + „NSC“)"
                checked={options.showWatermark}
                onchange={(v) => (options.showWatermark = v)}
            />
        </fieldset>

        <fieldset class="option-group">
            <legend>Formatierung</legend>
            <CheckBox
                label="Formatierung rendern"
                checked={options.renderStyles}
                onchange={(v) => (options.renderStyles = v)}
            />
            <div class="style-list" class:off={!options.renderStyles}>
                {#each STYLES as style (style)}
                    <CheckBox
                        label={STYLE_LABELS[style]}
                        size="sm"
                        disabled={!options.renderStyles}
                        checked={options.enabledStyles.includes(style)}
                        onchange={() => toggleStyle(style)}
                    />
                {/each}
            </div>
        </fieldset>

        <fieldset class="option-group">
            <legend>Ausblenden</legend>
            <CheckBox
                label="Schlafende Karten ausblenden"
                checked={options.hideMooned}
                onchange={(v) => (options.hideMooned = v)}
            />
            {#if allTags.length > 0}
                <div class="tag-list">
                    {#each allTags as tag (tag)}
                        <CheckBox
                            label="#{tag}"
                            size="sm"
                            checked={options.hiddenTags.includes(tag)}
                            onchange={() => toggleTag(tag)}
                        />
                    {/each}
                </div>
            {/if}
        </fieldset>
    </div>
</section>

<style lang="postcss">
    .option-groups {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 1rem 1.5rem;
    }

    .option-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;

        margin: 0;
        padding: 0;
        border: 0;

        & legend {
            margin-bottom: 0.45rem;
            padding: 0;

            color: var(--text-muted);
            font-size: var(--fs-2);
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
    }

    .style-list,
    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1.1rem;
    }

    .style-list.off {
        opacity: 0.55;
    }
</style>
