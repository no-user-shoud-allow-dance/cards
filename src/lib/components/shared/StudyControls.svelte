<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";

    let {
        revealed,
        isOverview = false,
        canGoBack,
        onGoBack,
        onFlip,
        onNext,
        onWrong,
        onRight,
        onHelp,
        onMnemonic,
    }: {
        revealed: boolean;
        isOverview?: boolean;
        canGoBack: boolean;
        onGoBack: () => void;
        onFlip?: () => void;
        onNext?: () => void;
        onWrong?: () => void;
        onRight?: () => void;
        onHelp: () => void;
        onMnemonic: () => void;
    } = $props();
</script>

<div
    class="actions"
    class:is-overview={isOverview}
    class:search-hidden={cardStore.googleDisabled}
>
    <button
        type="button"
        class="secondary undo"
        onclick={onGoBack}
        disabled={!canGoBack}
    >
        Zurück
    </button>

    {#if !isOverview}
        <button type="button" class="flip" onclick={onFlip}>
            Umdrehen
            <kbd>Space</kbd>
        </button>
    {/if}

    {#if isOverview}
        <button
            type="button"
            class="next"
            onclick={onNext}
        >
            Weiter
            <kbd>Space</kbd>
        </button>
    {:else}
        <div class="answer-group">
            <button
                type="button"
                class="wrong"
                onclick={onWrong}
                disabled={!revealed}
                title={revealed ? "" : "Erst umdrehen"}
            >
                Falsch
                <kbd>W</kbd>
            </button>

            <button
                type="button"
                class="right"
                onclick={onRight}
                disabled={!revealed}
                title={revealed ? "" : "Erst umdrehen"}
            >
                Richtig
                <kbd>R</kbd>
            </button>
        </div>
    {/if}

    {#if !cardStore.googleDisabled}
        <button
            class="help"
            onclick={onHelp}
            disabled={!revealed && !isOverview}
            aria-label="Hilfe-Suche öffnen"
            title="Hilfe-Suche öffnen (H)"
        >
            <span aria-hidden="true">?</span>
            <kbd>H</kbd>
        </button>

        <button
            class="mnemonic"
            onclick={onMnemonic}
            disabled={!revealed && !isOverview}
            aria-label="Mnemotechnik-Suche öffnen"
            title="Mnemotechnik-Suche öffnen (M)"
        >
            <span aria-hidden="true">M</span>
            <kbd>M</kbd>
        </button>
    {/if}
</div>

<style>
    .actions {
        display: grid;
        grid-template-columns: auto 1fr auto auto auto;
        grid-template-areas: "undo flip answers help mnemonic";
        gap: 0.6rem;
        align-items: stretch;
    }

    /* Overview mode: no flip button — Weiter takes the center column */
    .actions.is-overview {
        grid-template-columns: auto 1fr auto auto;
        grid-template-areas: "undo answers help mnemonic";
    }

    /* Google search disabled: the help/mnemonic columns collapse */
    .actions.search-hidden {
        grid-template-columns: auto 1fr auto;
        grid-template-areas: "undo flip answers";
    }

    .actions.search-hidden.is-overview {
        grid-template-columns: auto 1fr;
        grid-template-areas: "undo answers";
    }

    .undo {
        grid-area: undo;
    }

    .flip {
        grid-area: flip;
    }

    .answer-group {
        grid-area: answers;

        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
    }

    .next {
        grid-area: answers;
    }

    .help {
        grid-area: help;
    }

    .mnemonic {
        grid-area: mnemonic;
    }

    .actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-width: 0;
        min-height: 2.8rem;
        padding: 0.7rem 0.85rem;

        border: 1px solid transparent;
        border-radius: var(--radius-md);

        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;

        transition:
            background var(--transition-fast),
            border-color var(--transition-fast),
            color var(--transition-fast),
            opacity var(--transition-fast);
    }

    .actions button:disabled {
        opacity: 0.4;
    }

    /* Flip is the primary action — visually distinct through weight, not color */
    .actions .flip {
        border-color: var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font-weight: 700;
    }

    .actions .flip:hover:not(:disabled) {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--primary);
    }

    /* Next is the forward action in overview mode — same visual weight as flip */
    .actions .next {
        border-color: var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font-weight: 700;
    }

    .actions .next:hover:not(:disabled) {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--primary);
    }

    .actions .secondary {
        border-color: var(--border);
        background: var(--surface);
        color: var(--text-muted);
    }

    .actions .secondary:hover:not(:disabled) {
        border-color: var(--border-strong);
        background: var(--surface-hover);
        color: var(--text);
    }

    .actions .right {
        border-color: transparent;
        background: var(--success-text);
        color: var(--surface);
    }

    .actions .right:hover:not(:disabled) {
        background: color-mix(in srgb, var(--success-text) 88%, black);
    }

    .actions .right kbd {
        border-color: rgb(0 0 0 / 18%);
        background: rgb(0 0 0 / 10%);
        color: inherit;
    }

    .actions .wrong {
        border-color: var(--danger-border);
        background: transparent;
        color: var(--danger-text);
    }

    .actions .wrong:hover:not(:disabled) {
        background: var(--danger-bg);
    }

    .actions .help,
    .actions .mnemonic {
        padding-inline: 0.65rem;

        border-color: var(--border);
        border-radius: var(--radius-pill);

        background: var(--surface);
        color: var(--text-muted);
        font-size: 1rem;
    }

    .actions .help:hover:not(:disabled),
    .actions .mnemonic:hover:not(:disabled) {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--primary);
    }

    /* Touch devices have no keyboard: the key hints only take up
       space in the already crowded button rows. */
    @media (pointer: coarse) {
        .actions kbd {
            display: none;
        }
    }

    /* Mobile (cram mode): flipping happens by tapping the card itself,
       so the Umdrehen button is dropped and the remaining actions stack
       in three rows — answers, help/mnemonic, back. */
    @media (max-width: 700px) {
        .actions {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
                "answers answers"
                "help mnemonic"
                "undo undo";
        }

        .actions .flip {
            display: none;
        }

        /* Google search disabled: no help row — answers, then back. */
        .actions.search-hidden {
            grid-template-areas:
                "answers answers"
                "undo undo";
        }

        /* Overview mobile: Weiter full-width on top, then Zurück, Help and M */
        .actions.is-overview {
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-areas:
                "answers answers"
                "undo help mnemonic";
        }

        .actions.search-hidden.is-overview {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
                "answers answers"
                "undo undo";
        }

        /* Comfortable touch targets on phones. */
        .actions {
            gap: 0.5rem;
        }

        .actions button {
            min-height: 3rem;
            padding-inline: 0.65rem;
        }

        .actions .help,
        .actions .mnemonic {
            width: 100%;
            border-radius: var(--radius-md);
        }

        .actions .undo {
            justify-self: stretch;
        }

        .actions .help,
        .actions .mnemonic {
            justify-self: stretch;
        }
    }
</style>
