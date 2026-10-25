<script lang="ts">
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import Term from "../shared/Term.svelte";

    const INTRO_STORAGE_KEY = "kk_intro_open";

    let introOpen = $state(true);
    let mounted = $state(false);

    // Restore the expanded/collapsed state from the last visit. Gated on
    // mounted so the server render and the first client render agree.
    onMount(() => {
        try {
            const saved = localStorage.getItem(INTRO_STORAGE_KEY);
            if (saved !== null) introOpen = saved === "true";
        } catch {
            /* ignore */
        }
        mounted = true;
    });

    const showIntro = $derived(mounted && introOpen);

    function toggleIntro(): void {
        introOpen = !introOpen;
        try {
            localStorage.setItem(INTRO_STORAGE_KEY, String(introOpen));
        } catch {
            /* ignore */
        }
    }
</script>

<section class="intro" aria-label="NSC">
    <div class="intro-box">
        <button
            class="intro-header"
            class:intro-header--open={showIntro}
            onclick={toggleIntro}
            aria-expanded={showIntro}
        >
            <span class="intro-title">NSC</span>
            <span class="intro-chevron" aria-hidden="true">▾</span>
        </button>
        {#if showIntro}
            <div class="intro-body" transition:slide={{ duration: 200 }}>
                <p>
                    Lerne mit Karteikarten in Ordnern und Stapeln. Dabei
                    durchläufst du drei Phasen:
                    <br />
                    <Term variant="overview">Übersicht</Term>,
                    <Term variant="primary">Lernen</Term> und
                    <Term variant="success">Gelernt</Term>.
                </p>
                <hr />
                <p>
                    In der <Term variant="overview">Übersicht</Term> siehst du
                    alle Karten mit direkt eingeblendeter Antwort.
                </p>
                <p>
                    Beim <Term variant="primary">Lernen</Term> bewertest du
                    jede Karte nach dem Leitner-System – von
                    <Term variant="primary">I</Term> bis
                    <Term variant="primary">V</Term> und dann in
                    <Term variant="success">Gelernt</Term>. Falsch
                    beantwortete Karten rutschen zurück in
                    <Term variant="primary">I</Term>. Ein optionaler Timer
                    erinnert dich an Pausen.
                </p>
                <p>
                    Sind alle Karten <Term variant="success">Gelernt</Term>,
                    kannst du den Fortschritt jederzeit zurücksetzen und von
                    vorne beginnen.
                </p>
            </div>
        {/if}
    </div>
</section>

<style>
    .intro {
        margin-bottom: 2rem;
    }

    .intro-box {
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .intro-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-bottom: 1px solid var(--border);

        background: var(--surface-soft);

        cursor: pointer;
        text-align: left;

        transition: background var(--transition-fast);
    }

    .intro-header:hover {
        background: var(--surface-hover);
    }

    .intro-header--open {
        border-bottom-color: var(--border);
    }

    .intro-box:not(:has(.intro-body)) .intro-header {
        border-bottom: 0;
    }

    .intro-chevron {
        color: var(--text-muted);
        font-size: 0.7rem;

        transition: transform var(--transition-fast);
    }

    .intro-header--open .intro-chevron {
        transform: rotate(180deg);
    }

    .intro-title {
        font-family: var(--font-sans);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1.4;
        text-transform: uppercase;
    }

    .intro-body {
        padding: 1.1rem 1.25rem 1.25rem;
    }

    .intro-body p {
        margin: 0;

        font-size: 0.95rem;
        line-height: 1.75;
    }

    .intro-body p + p {
        margin-top: 0.75rem;
    }

    .intro-body hr {
        margin: 1rem 0;

        border: 0;
        border-top: 1px solid var(--border);
    }
</style>
