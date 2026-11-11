<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Leitner-System: Karte wandert, erst nach Pause die Fehler- bzw. Erfolgs-Animation">
<path class="frame" d="M236 54C235.6 56.6 234.3 59.1 232.9 61.6C231.4 64.1 229.5 66.5 227.4 68.9C225.4 71.2 223.1 73.5 220.5 75.8C218 78.1 215.3 80.4 212.2 82.5C209.1 84.7 205.7 86.9 201.8 88.9C197.9 90.8 193.6 92.7 188.8 94.3C184 96 178.7 97.4 173.2 98.5C167.7 99.6 161.7 100.4 155.9 101C150 101.6 143.9 101.9 137.9 102.1C131.9 102.3 125.9 102.2 120 102.1C114.1 102 108.2 101.8 102.4 101.5C96.5 101.2 90.6 100.8 84.8 100.2C79 99.6 73.1 98.9 67.5 97.9C61.9 97 56.3 95.8 51.2 94.3C46.1 92.9 41.3 91.2 37.1 89.3C33 87.4 29.3 85.3 26.1 83.1C23 80.9 20.4 78.5 18.2 76.1C15.9 73.7 14.2 71.3 12.6 68.9C11 66.4 9.7 64 8.6 61.5C7.5 59 6.5 56.5 6 54C5.6 51.5 5.3 48.9 5.7 46.3C6.1 43.7 7 41.1 8.7 38.6C10.3 36.1 12.7 33.6 15.6 31.3C18.5 29.1 22.2 26.9 26.1 24.9C30.1 23 34.6 21.2 39.2 19.6C43.8 17.9 48.7 16.5 53.6 15.1C58.5 13.7 63.6 12.4 68.8 11.2C74 10 79.3 8.8 84.8 7.8C90.3 6.8 96 5.9 101.9 5.3C107.8 4.7 113.9 4.2 120 4.1C126.1 4 132.4 4.2 138.3 4.7C144.3 5.2 150.3 6 155.9 7C161.4 8 166.8 9.3 171.9 10.6C177 12 181.7 13.5 186.4 15.1C191 16.6 195.5 18.3 199.8 20C204.1 21.7 208.3 23.5 212.2 25.5C216.1 27.4 219.9 29.4 223.1 31.6C226.3 33.8 229.2 36.2 231.3 38.6C233.4 41 235 43.6 235.7 46.2C236.5 48.8 236.5 51.4 236 54Z"/>
<rect class="box" style="--tint: color-mix(in srgb, var(--primary-soft) 0%, var(--surface));" x="19.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label" x="32.5" y="63">I</text>
<rect class="box" style="--tint: color-mix(in srgb, var(--primary-soft) 20%, var(--surface));" x="54.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label" x="67.5" y="63">II</text>
<rect class="box" style="--tint: color-mix(in srgb, var(--primary-soft) 40%, var(--surface));" x="89.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label" x="102.5" y="63">III</text>
<rect class="box" style="--tint: color-mix(in srgb, var(--primary-soft) 60%, var(--surface));" x="124.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label" x="137.5" y="63">IV</text>
<rect class="box" style="--tint: color-mix(in srgb, var(--primary-soft) 80%, var(--surface));" x="159.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label" x="172.5" y="63">V</text>
<rect class="box box-last" style="--tint: var(--success-bg);" x="194.5" y="42" width="26" height="34" rx="5"/>
<text class="box-label box-label-last" x="207.5" y="63">VI</text>
<g class="shaker"><rect class="mini-card" x="24.5" y="47" width="16" height="20" rx="3"/></g>
</svg>

<style>
    .screen { display: block; width: 100%; height: auto; }
    .frame { stroke-width: 2; animation: frameColor 14s ease-in-out infinite; }
    .box { fill: var(--tint, var(--surface)); stroke: var(--border-strong); stroke-width: 1.5; animation: boxColor 14s ease-in-out infinite; }
    .box-last { animation: boxLast 14s ease-in-out infinite; }
    .box-label { fill: var(--text-muted); font-size: 9px; font-weight: 600; text-anchor: middle; font-family: inherit; }
    /* box VI = gelernt, so it stays green (also without animation) */
    .box-label-last { fill: var(--success-text); }
    .shaker { transform-box: fill-box; transform-origin: center; animation: shake 14s ease-in-out infinite; }
    .mini-card { fill: var(--surface); stroke: var(--primary); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: hop 14s ease-in-out infinite, cardColor 14s ease-in-out infinite; }
    /* card only slides along the boxes, rests, THEN the highlight fires;
       every segment eases in-out so nothing snaps; the ride home (95-100%)
       keeps the springy overshoot */
    @keyframes hop {
        0%, 7% { transform: translate(0, 0); animation-timing-function: ease-in-out; }
        14% { transform: translate(35px, 0); animation-timing-function: ease-in-out; }
        21%, 28% { transform: translate(70px, 0); animation-timing-function: ease-in-out; }
        43% { transform: translate(70px, 0); animation-timing-function: ease-in-out; }
        50%, 57% { transform: translate(0, 0); animation-timing-function: ease-in-out; }
        63% { transform: translate(35px, 0); animation-timing-function: ease-in-out; }
        69% { transform: translate(70px, 0); animation-timing-function: ease-in-out; }
        75% { transform: translate(105px, 0); animation-timing-function: ease-in-out; }
        81% { transform: translate(140px, 0); animation-timing-function: ease-in-out; }
        87%, 95% { transform: translate(175px, 0); animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
        100% { transform: translate(0, 0); }
    }
    /* gentle decaying wobble while the card sits in box III */
    @keyframes shake {
        0%, 28% { transform: translateX(0); }
        30.5% { transform: translateX(-2.5px); }
        33% { transform: translateX(2px); }
        35.5% { transform: translateX(-1px); }
        38%, 100% { transform: translateX(0); }
    }
    /* neutral until 26% (card rests at III from 21%), soft fade to red
       26-33%, hold to 40%, fade back 40-47%; neutral until 90% (card rests
       at VI from 87%), fade to green 90-93%, hold to 95%, fade back out
       95-100% while the card slides home to box I.
       Box VI itself stays green (--tint: success-bg) and only flashes red
       during the "Falsch" phase. */
    @keyframes frameColor {
        0%, 26% { fill: var(--surface); stroke: var(--border); }
        33%, 40% { fill: var(--danger-bg); stroke: var(--danger-text); }
        47%, 90% { fill: var(--surface); stroke: var(--border); }
        93%, 95% { fill: var(--success-bg); stroke: var(--success-text); }
        100% { fill: var(--surface); stroke: var(--border); }
    }
    @keyframes boxColor {
        0%, 26% { fill: var(--tint, var(--surface)); }
        33%, 40% { fill: var(--danger-bg); }
        47%, 100% { fill: var(--tint, var(--surface)); }
    }
    @keyframes boxLast {
        0%, 26% { fill: var(--tint, var(--surface)); stroke: var(--success-border); }
        33%, 40% { fill: var(--danger-bg); stroke: var(--danger-border); }
        47%, 90% { fill: var(--tint, var(--surface)); stroke: var(--success-border); }
        93%, 95% { fill: var(--success-bg); stroke: var(--success-text); }
        100% { fill: var(--tint, var(--surface)); stroke: var(--success-border); }
    }
    @keyframes cardColor {
        0%, 26% { fill: var(--surface); stroke: var(--primary); }
        33%, 40% { fill: var(--danger-bg); stroke: var(--danger-text); }
        47%, 90% { fill: var(--surface); stroke: var(--primary); }
        93%, 95% { fill: var(--success-bg); stroke: var(--success-text); }
        100% { fill: var(--surface); stroke: var(--primary); }
    }
</style>
