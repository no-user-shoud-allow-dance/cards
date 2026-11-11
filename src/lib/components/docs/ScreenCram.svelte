<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Lernmodus: Karte umdrehen und bewerten">
<path class="frame" d="M233.4 54C233 56.5 232.2 59 231.3 61.5C230.4 64 229.3 66.5 227.8 68.9C226.3 71.4 224.7 73.9 222.4 76.2C220.2 78.6 217.6 81 214.3 83.2C211.1 85.4 207.2 87.5 202.9 89.3C198.7 91.2 193.7 92.8 188.6 94.2C183.5 95.6 177.8 96.7 172.2 97.7C166.6 98.6 160.8 99.3 155 100C149.3 100.6 143.5 101 137.6 101.4C131.8 101.8 125.9 102.1 120 102.3C114.1 102.5 108 102.6 102 102.4C96 102.2 89.8 101.9 84 101.2C78.1 100.6 72.2 99.7 66.7 98.5C61.3 97.4 56.1 95.9 51.4 94.2C46.7 92.6 42.5 90.6 38.7 88.7C34.8 86.7 31.4 84.5 28.3 82.4C25.1 80.3 22.3 78 19.6 75.8C16.9 73.6 14.4 71.3 12.2 68.9C10 66.6 7.9 64.1 6.5 61.7C5 59.2 3.8 56.6 3.4 54C3 51.4 3.2 48.7 4.1 46.2C5.1 43.6 6.8 41 9.1 38.6C11.3 36.2 14.3 33.9 17.5 31.7C20.7 29.6 24.5 27.5 28.3 25.6C32.1 23.6 36.1 21.8 40.3 20C44.5 18.3 48.8 16.5 53.4 14.9C58 13.3 62.7 11.7 67.8 10.4C72.9 9 78.3 7.7 84 6.8C89.6 5.8 95.6 5 101.7 4.6C107.7 4.2 113.9 4.1 120 4.3C126.1 4.5 132.2 5 138 5.6C143.8 6.2 149.5 7.1 155 8C160.6 9 165.9 10.1 171.2 11.2C176.4 12.4 181.6 13.6 186.6 14.9C191.6 16.3 196.7 17.7 201.3 19.4C205.9 21 210.5 22.8 214.3 24.8C218.2 26.8 221.7 29 224.5 31.3C227.3 33.6 229.4 36.1 230.9 38.6C232.5 41.1 233.2 43.8 233.6 46.3C234 48.9 233.8 51.5 233.4 54Z"/>
<rect class="bar" x="13" y="11" width="214" height="13" rx="4"/>
<rect class="logo" x="17" y="14" width="7" height="7" rx="2"/>
<rect class="crumb" x="28" y="16.5" width="34" height="3" rx="1.5"/>
<circle class="gear" cx="220" cy="17.5" r="3"/>
<circle class="clock-face" cx="120" cy="33" r="6.5"/><path class="clock-hand" style="transform-box: view-box; transform-origin: 120px 33px; animation: docs-spin 6s linear infinite;" d="M120 33v-4M120 33l3 2"/>
<g style="perspective: 500px;"><g class="flip"><rect class="card card-soft" x="48" y="44" width="144" height="34" rx="6"/><rect class="ln-strong" x="78" y="54" width="84" height="4.5" rx="2.3"/><rect class="ln" x="94" y="64" width="52" height="4" rx="2"/></g></g>
<rect class="btn-danger" x="52" y="86" width="62" height="12" rx="6"/>
<rect class="btn-ok" x="126" y="86" width="62" height="12" rx="6"/>
</svg>

<style>
    .screen { display: block; width: 100%; height: auto; }
    .frame { fill: var(--surface); stroke: var(--border); stroke-width: 2; }
    .bar { fill: var(--surface-soft); }
    .logo { fill: var(--primary); }
    .crumb { fill: var(--border-strong); }
    .gear { fill: none; stroke: var(--border-strong); stroke-width: 1.6; }
    .card { fill: var(--surface); stroke: var(--border); stroke-width: 1.5; }
    .ln { fill: var(--border); }
    .ln-strong { fill: var(--border-strong); }
    .card-soft { fill: var(--surface-soft); }
    .clock-face { fill: none; stroke: var(--primary); stroke-width: 1.8; }
    .clock-hand { fill: none; stroke: var(--primary); stroke-width: 1.6; stroke-linecap: round; }
    .btn-danger { fill: var(--danger-bg); stroke: var(--danger-border); stroke-width: 1.5; }
    .btn-ok { fill: var(--success-bg); stroke: var(--success-border); stroke-width: 1.5; }
    /* the card flips over the top ("Umdrehen"), like the real card's rotateX */
    .flip { transform-box: fill-box; transform-origin: center; animation: flip 6s ease-in-out infinite; }
    @keyframes flip {
        0%, 30% { transform: rotateX(0deg); }
        45%, 80% { transform: rotateX(180deg); }
        95%, 100% { transform: rotateX(360deg); }
    }
</style>
