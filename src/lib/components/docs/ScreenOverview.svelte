<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Übersicht: eine Karte nach der anderen mit Vorder- und Rückseite, ohne Bewerten">
<path class="frame" d="M234.3 54C233.8 56.5 232.7 59.1 231.6 61.5C230.4 64 229 66.4 227.3 68.9C225.6 71.3 223.8 73.7 221.5 76C219.3 78.4 216.7 80.8 213.6 83C210.5 85.2 206.9 87.4 202.8 89.3C198.6 91.2 193.9 92.9 188.9 94.4C183.9 95.9 178.3 97.1 172.7 98.1C167.1 99 161.1 99.7 155.3 100.3C149.5 100.9 143.6 101.2 137.7 101.5C131.8 101.8 125.9 102 120 102.1C114.1 102.1 108.1 102.2 102.2 102C96.2 101.8 90.1 101.5 84.2 100.9C78.4 100.3 72.4 99.5 66.9 98.4C61.3 97.4 55.9 96 51.1 94.4C46.3 92.8 41.9 90.9 38 89C34 87 30.6 84.8 27.5 82.6C24.4 80.4 21.8 78.1 19.4 75.8C16.9 73.6 14.7 71.2 12.7 68.9C10.7 66.5 8.8 64.1 7.4 61.6C6 59.1 4.8 56.6 4.3 54C3.8 51.4 3.7 48.8 4.4 46.2C5.1 43.6 6.5 41 8.6 38.6C10.6 36.1 13.4 33.8 16.6 31.6C19.8 29.4 23.6 27.3 27.5 25.4C31.5 23.4 35.8 21.7 40.1 20C44.5 18.3 49 16.7 53.7 15.1C58.4 13.6 63.2 12.1 68.3 10.7C73.4 9.4 78.7 8.1 84.2 7.1C89.8 6.1 95.7 5.2 101.7 4.7C107.6 4.2 113.9 4 120 4.1C126.1 4.1 132.3 4.6 138.2 5.2C144 5.8 149.8 6.7 155.3 7.7C160.8 8.7 166.1 9.9 171.3 11.1C176.4 12.4 181.4 13.7 186.3 15.1C191.2 16.5 196 18 200.6 19.7C205.1 21.3 209.7 23.1 213.6 25C217.6 27 221.3 29.1 224.3 31.4C227.3 33.6 229.7 36.1 231.4 38.6C233.2 41.1 234.1 43.7 234.6 46.3C235.1 48.8 234.8 51.5 234.3 54Z"/>
<rect class="bar" x="13" y="11" width="214" height="13" rx="4"/>
<rect class="logo" x="17" y="14" width="7" height="7" rx="2"/>
<rect class="crumb" x="28" y="16.5" width="34" height="3" rx="1.5"/>
<circle class="gear" cx="220" cy="17.5" r="3"/>
<!-- progress bar: „X / Y Karten angesehen“ -->
<rect class="ptrack" x="60" y="30" width="120" height="5" rx="2.5"/>
<rect class="pfill" x="60" y="30" width="120" height="5" rx="2.5"/>
<!-- one card, front and back visible at once, click = next card -->
<rect class="card" x="48" y="42" width="144" height="42" rx="6"/>
<g class="swap">
    <rect class="ln-strong" x="78" y="51" width="84" height="4.5" rx="2.3"/>
    <rect class="divider" x="108" y="61" width="24" height="1.5"/>
    <rect class="ln" x="90" y="67" width="60" height="3.5" rx="1.8"/>
</g>
<!-- controls: Zurück / Weiter -->
<rect class="btn-sec" x="48" y="90" width="60" height="10" rx="5"/>
<rect class="ln" x="66" y="93.5" width="24" height="3" rx="1.5"/>
<rect class="btn-next" x="132" y="90" width="60" height="10" rx="5"/>
<rect class="btn-next-ln" x="150" y="93.5" width="24" height="3" rx="1.5"/>
</svg>

<style>
    .screen { display: block; width: 100%; height: auto; }
    .frame { fill: var(--surface); stroke: var(--border); stroke-width: 2; }
    .bar { fill: var(--surface-soft); }
    .logo { fill: var(--primary); }
    .crumb { fill: var(--border-strong); }
    .gear { fill: none; stroke: var(--border-strong); stroke-width: 1.6; }
    .ptrack { fill: var(--surface-soft); stroke: var(--border); stroke-width: 1; }
    .pfill { fill: var(--overview); transform-box: fill-box; transform-origin: left center; animation: grow 6s ease-in-out infinite; }
    .card { fill: var(--surface); stroke: var(--border); stroke-width: 1.5; }
    .ln { fill: var(--border); }
    .ln-strong { fill: var(--border-strong); }
    .divider { fill: var(--border); }
    .btn-sec { fill: var(--surface-soft); stroke: var(--border-strong); stroke-width: 1.4; }
    .btn-next { fill: var(--primary); }
    .btn-next-ln { fill: var(--surface); }
    /* card content swaps to the next card while the progress fills up */
    .swap { transform-box: fill-box; transform-origin: center; animation: swap 6s ease-in-out infinite; }
    @keyframes grow {
        0% { transform: scaleX(0.08); }
        60%, 100% { transform: scaleX(0.75); }
    }
    @keyframes swap {
        0%, 42% { opacity: 1; transform: translateY(0); }
        50%, 92% { opacity: 0; transform: translateY(-5px); }
        100% { opacity: 1; transform: translateY(0); }
    }
</style>
