<script lang="ts">
    import { onMount } from "svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { useCramSession } from "#lib/composables/useCramSession.svelte";
    import FlashCard from "#lib/components/cram/FlashCard.svelte";
    import StudyControls from "#lib/components/shared/StudyControls.svelte";
    import StatusBar from "#lib/components/cram/StatusBar.svelte";
    import BoxOverview from "#lib/components/cram/BoxOverview.svelte";
    import SessionComplete from "#lib/components/cram/SessionComplete.svelte";
    import { useStudyTimer } from "#lib/composables/useStudyTimer.svelte";
    import StudyClock from "#lib/components/cram/StudyClock.svelte";
    import CramIntro from "#lib/components/cram/CramIntro.svelte";
    import CramBreak from "#lib/components/cram/CramBreak.svelte";
    import Confetti from "#lib/components/cram/Confetti.svelte";
    import StudyLayout from "#lib/components/shared/StudyLayout.svelte";
    import DeckNotFound from "#lib/components/deck/DeckNotFound.svelte";
    import DeckEmpty from "#lib/components/deck/DeckEmpty.svelte";

    let { data } = $props();

    let deck = $derived(userDecks.load(data.slug));

    const session = useCramSession(() => userDecks.load(data.slug));

    const timer = useStudyTimer(() => data.slug);
    timer.observe(session);

    // Intro sequence: the timer flies to center and the user picks a
    // session duration. Only shown when no timer is configured yet.
    // The parent layout mounts this page only after the user's decks
    // (IndexedDB) are loaded, so no extra gating is needed here.
    let introCompleted = $state(false);

    const showIntro = $derived(
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

    // On mobile the box overview moves from the top (above the progress
    // bar) to the bottom, above the controls. The (deck) layout renders
    // this page only on the client (after the IndexedDB decks load), so
    // the viewport can be read synchronously at init.
    const mobileQuery = window.matchMedia("(max-width: 700px)");
    let isMobile = $state(mobileQuery.matches);

    onMount(() => {
        const handleChange = (event: MediaQueryListEvent) => {
            isMobile = event.matches;
        };
        mobileQuery.addEventListener("change", handleChange);
        return () => mobileQuery.removeEventListener("change", handleChange);
    });

    // While the interface is blurred (break dialog or inactivity pause),
    // the first interaction only lifts the blur: a keypress or click's
    // action runs on the next one, once the interface is interactive
    // again. With the timer overlay open, keys are left alone so the
    // overlay stays keyboard-accessible.
    function liftBlur(): void {
        if (timer.finishedAt !== null) {
            timer.acknowledge();
        } else {
            timer.notifyActivity();
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (timer.menuOpen) return;

        if (!timer.interfaceBlurred || showIntro) {
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

        liftBlur();
    }

    onMount(() => {
        session.start();
    });
</script>

<svelte:head>
    <title>Lernmodus – NSC</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

{#if !deck}
    <DeckNotFound />
{:else}
    <StudyLayout
        blurred={timer.interfaceBlurred && !showIntro}
        onBlurredInteract={liftBlur}
        fullHeight
    >
        {#snippet top()}
            {#if session.currentCard}
                {#if !isMobile}
                    <BoxOverview
                        boxCounts={session.boxCounts}
                        currentBox={session.currentBox}
                    />
                {/if}
                <StatusBar
                    learnedCount={session.learnedCount}
                    totalCards={deck.cards.length}
                    progressRatio={session.progressRatio}
                />
            {/if}
        {/snippet}

        {#snippet center()}
            {#if deck.cards.length === 0}
                <DeckEmpty />
            {:else if session.currentCard}
                {#key session.currentCardId}
                    <FlashCard
                        frontText={session.frontText}
                        backText={session.backText}
                        flipped={session.revealed}
                        onFlip={session.toggleFlip}
                    />
                {/key}
            {:else if session.finished}
                <SessionComplete
                    slug={data.slug}
                    cardIds={deck.cards.map((c) => c.id)}
                />
            {:else}
                <DeckEmpty text="Keine Karten verfügbar." />
            {/if}
        {/snippet}

        {#snippet bottom()}
            {#if session.currentCard}
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
                {#if isMobile}
                    <BoxOverview
                        boxCounts={session.boxCounts}
                        currentBox={session.currentBox}
                    />
                {/if}
            {/if}
        {/snippet}

        {#snippet overlays()}
            {#if showIntro}
                <CramIntro {timer} onDone={completeIntro} />
            {/if}

            {#if timer.finishedAt !== null}
                <CramBreak {timer} />
            {/if}

            {#if session.box2Celebration}
                <Confetti onDone={session.dismissBox2Celebration} />
            {/if}

            <StudyClock
                {timer}
                intro={showIntro}
                breakMode={timer.finishedAt !== null}
            />
        {/snippet}
    </StudyLayout>
{/if}
