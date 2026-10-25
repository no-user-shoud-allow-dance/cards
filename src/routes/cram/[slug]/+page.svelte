<script lang="ts">
    import { onMount } from "svelte";
    import { getDeck } from "#lib/decks/loader";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { useCramSession } from "#lib/composables/useCramSession.svelte";
    import FlashCard from "#lib/components/cram/FlashCard.svelte";
    import StudyControls from "#lib/components/shared/StudyControls.svelte";
    import StatusBar from "#lib/components/cram/StatusBar.svelte";
    import SessionComplete from "#lib/components/cram/SessionComplete.svelte";
    import { useStudyTimer } from "#lib/composables/useStudyTimer.svelte";
    import StudyClock from "#lib/components/cram/StudyClock.svelte";
    import CramIntro from "#lib/components/cram/CramIntro.svelte";
    import CramBreak from "#lib/components/cram/CramBreak.svelte";
    import Confetti from "#lib/components/cram/Confetti.svelte";

    let { data } = $props();

    let deck = $derived(getDeck(data.slug));

    const session = useCramSession(() => getDeck(data.slug));

    const timer = useStudyTimer(() => data.slug);
    timer.observe(session);

    // Intro sequence: the timer flies to center and the user picks a
    // session duration. Only shown when no timer is configured yet.
    let mounted = $state(false);
    let introCompleted = $state(false);

    const showIntro = $derived(
        mounted &&
            !introCompleted &&
            deck !== null &&
            deck.cards.length > 0 &&
            !session.finished &&
            timer.durationMs === null &&
            timer.remainingMs === null &&
            timer.finishedAt === null,
    );

    function completeIntro(): void {
        introCompleted = true;
    }

    // While the interface is blurred (break dialog or inactivity pause),
    // a keypress only lifts the blur: the key's action runs on the next
    // keypress, once the interface is interactive again. With the timer
    // menu open, keys keep their normal behavior so the menu stays
    // keyboard-accessible.
    function handleKeydown(event: KeyboardEvent): void {
        if (!timer.interfaceBlurred || showIntro || timer.menuOpen) {
            session.handleKeydown(event);
            return;
        }

        // Let typing in form fields through untouched.
        const target = event.target;
        if (
            target instanceof HTMLElement &&
            target.closest("input, textarea, select, [contenteditable='true']")
        ) {
            return;
        }

        // Swallow the key so it cannot flip, answer or open a search.
        event.preventDefault();

        if (timer.finishedAt !== null) {
            timer.acknowledge();
        } else {
            timer.notifyActivity();
        }
    }

    onMount(() => {
        // Wait for user-uploaded decks (IndexedDB) before starting.
        userDecks.init().then(() => {
            mounted = true;
            session.start();
        });
    });
</script>

<svelte:head>
    <title>Lernmodus – NSC</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

{#if !deck}
    <div class="page">
        <p>Stapel nicht gefunden.</p>
    </div>
{:else}
    <div class="cram-page" class:interface-blurred={timer.interfaceBlurred && !showIntro}>
        {#if deck.cards.length === 0}
            <div class="cram-empty">
                <p class="empty">Dieser Stapel enthält keine Karten.</p>
            </div>
        {:else if session.currentCard}
            <div class="cram-top">
                <StatusBar
                    boxCounts={session.boxCounts}
                    currentBox={session.currentBox}
                    learnedCount={session.learnedCount}
                    totalCards={deck.cards.length}
                    progressRatio={session.progressRatio}
                />
            </div>

            <div class="cram-center">
                {#key session.currentCardId}
                    <FlashCard
                        frontText={session.frontText}
                        backText={session.backText}
                        flipped={session.revealed}
                        onFlip={session.toggleFlip}
                    />
                {/key}
            </div>

            <div class="cram-bottom">
                <StudyControls
                    revealed={session.revealed}
                    canGoBack={session.undoStack.length > 0}
                    onGoBack={session.undo}
                    onFlip={session.toggleFlip}
                    onWrong={() => session.answer(false)}
                    onRight={() => session.answer(true)}
                    onHelp={session.openHelpSearch}
                    onMnemonic={session.openMnemonicSearch}
                />
            </div>
        {:else if session.finished}
            <div class="cram-center">
                <SessionComplete
                    slug={data.slug}
                    cardIds={deck.cards.map((c) => c.id)}
                />
            </div>
        {:else}
            <div class="cram-empty">
                <p class="empty">Keine Karten verfügbar.</p>
            </div>
        {/if}

        {#if showIntro}
            <CramIntro {timer} onDone={completeIntro} />
        {/if}

        {#if timer.finishedAt !== null}
            <CramBreak {timer} />
        {/if}

        {#if session.box2Celebration}
            <Confetti onDone={session.dismissBox2Celebration} />
        {/if}

        <StudyClock {timer} intro={showIntro} breakMode={timer.finishedAt !== null} />
    </div>
{/if}

<style>
    .cram-page {
        display: flex;
        flex-direction: column;

        width: min(100%, var(--content-width));
        min-height: calc(100vh - 3.5rem - var(--footer-h));
        margin-inline: auto;
        padding: 1.5rem 1.5rem 2rem;
    }

    .cram-top {
        flex: 0 0 auto;
    }

    .cram-center {
        position: relative;

        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        justify-content: center;
        min-height: 0;
    }

    .cram-bottom {
        flex: 0 0 auto;
        margin-top: 1rem;
    }

    .cram-empty {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
    }

    /* While the timer is paused or the break dialog is shown, the
       interface blurs — except the header (outside this page) and the
       timer itself (.clock-zone). */
    .cram-page > .cram-top,
    .cram-page > .cram-center,
    .cram-page > .cram-bottom,
    .cram-page > .cram-empty {
        transition: filter var(--transition-normal);
    }

    .cram-page.interface-blurred > .cram-top,
    .cram-page.interface-blurred > .cram-center,
    .cram-page.interface-blurred > .cram-bottom,
    .cram-page.interface-blurred > .cram-empty {
        filter: blur(5px);
    }

    @media (max-width: 540px) {
        .cram-page {
            padding: 1rem 1rem 4.75rem;
        }
    }
</style>
