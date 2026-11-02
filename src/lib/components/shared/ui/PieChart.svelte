<script module lang="ts">
    export interface PieSegment {
        label: string;
        value: number;
        /** Any CSS color, e.g. "var(--primary)" — no hardcoded hex. */
        color: string;
    }
</script>

<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";

    // `class` arrives via rest and is merged into the class expression.
    let {
        segments,
        size = 168,
        centerLabel,
        ...rest
    }: {
        segments: PieSegment[];
        /** Outer diameter in px; the SVG viewBox scales to it. */
        size?: number;
        /** Small caption under the total in the donut center. */
        centerLabel?: string;
    } & HTMLAttributes<HTMLDivElement> = $props();

    // Donut geometry in a 100×100 viewBox; pathLength normalises the
    // circumference to 100 so dash math stays in percent.
    const R = 40;
    const STROKE = 16;

    const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));

    // Slices as fractions of the whole with their cumulative start offset.
    const slices = $derived.by(() => {
        let acc = 0;
        return segments
            .filter((s) => s.value > 0)
            .map((s) => {
                const fraction = total > 0 ? s.value / total : 0;
                const slice = { ...s, fraction, offset: acc };
                acc += fraction;
                return slice;
            });
    });

    const ariaLabel = $derived(
        total > 0
            ? `Diagramm: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`
            : "Diagramm: keine Daten",
    );
</script>

<div
    {...rest}
    class={["pie-chart", rest.class]}
    style:width="{size}px"
    style:height="{size}px"
>
    <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel}>
        <circle
            class="track"
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke-width={STROKE}
        />
        <g transform="rotate(-90 50 50)">
            {#each slices as slice (slice.label)}
                <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={slice.color}
                    stroke-width={STROKE}
                    pathLength={100}
                    stroke-dasharray="{slice.fraction * 100} {100 -
                        slice.fraction * 100}"
                    stroke-dashoffset={-slice.offset * 100}
                />
            {/each}
        </g>
        <text x="50" y="50" class="center-value" dominant-baseline="central"
            >{total}</text
        >
        {#if centerLabel}
            <text
                x="50"
                y="62"
                class="center-label"
                text-anchor="middle">{centerLabel}</text
            >
        {/if}
    </svg>
</div>

<style>
    .pie-chart {
        flex: 0 0 auto;
    }

    .pie-chart svg {
        display: block;
        width: 100%;
        height: 100%;
    }

    .track {
        stroke: var(--border);
    }

    .center-value {
        fill: var(--text);
        font-size: 17px;
        font-weight: 700;
        text-anchor: middle;
    }

    .center-label {
        fill: var(--text-muted);
        font-size: 8px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }
</style>
