<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Editor: Karten bearbeiten">
<path class="frame" d="M233 54C233.3 56.5 233.5 59.1 233 61.6C232.6 64.2 231.9 66.8 230.5 69.3C229.1 71.8 227.1 74.3 224.5 76.7C221.8 79 218.4 81.3 214.6 83.3C210.8 85.3 206.3 87.2 201.7 88.8C197.1 90.5 192 91.9 186.9 93.2C181.8 94.6 176.5 95.7 171.2 96.8C165.9 97.9 160.5 98.9 154.9 99.8C149.4 100.7 143.7 101.5 137.9 102.2C132.1 102.8 126 103.3 120 103.5C114 103.7 107.7 103.7 101.7 103.3C95.6 103 89.5 102.3 83.9 101.4C78.2 100.5 72.7 99.2 67.5 97.9C62.4 96.5 57.6 94.9 53.1 93.2C48.6 91.6 44.4 89.8 40.3 88C36.2 86.2 32.3 84.3 28.6 82.3C24.9 80.3 21.2 78.3 18 76.1C14.9 74 11.8 71.7 9.5 69.3C7.2 66.9 5.3 64.4 4.2 61.8C3.1 59.3 2.8 56.6 3 54C3.3 51.4 4.4 48.8 5.9 46.3C7.3 43.8 9.5 41.4 11.8 39C14 36.7 16.7 34.4 19.5 32.2C22.3 30 25.3 27.8 28.6 25.7C31.8 23.6 35.2 21.5 39.1 19.5C42.9 17.6 47.1 15.6 51.7 13.9C56.3 12.3 61.4 10.7 66.8 9.5C72.1 8.3 78 7.3 83.9 6.6C89.7 5.9 95.9 5.6 101.9 5.4C107.9 5.2 114 5.3 120 5.5C126 5.7 131.8 6.1 137.6 6.5C143.5 7 149.2 7.5 154.9 8.2C160.6 8.9 166.4 9.6 172 10.6C177.5 11.5 183.1 12.6 188.3 13.9C193.4 15.3 198.5 16.9 202.9 18.7C207.3 20.5 211.3 22.5 214.6 24.7C218 26.9 220.7 29.3 223 31.6C225.2 34 226.8 36.5 228.2 39C229.6 41.5 230.6 44 231.4 46.5C232.2 49 232.8 51.5 233 54Z"/>
<rect class="bar" x="13" y="11" width="214" height="13" rx="4"/>
<rect class="logo" x="17" y="14" width="7" height="7" rx="2"/>
<rect class="crumb" x="28" y="16.5" width="34" height="3" rx="1.5"/>
<circle class="gear" cx="220" cy="17.5" r="3"/>
<rect class="tool" x="14" y="30" width="12" height="10" rx="3"/><rect class="tool" x="30" y="30" width="12" height="10" rx="3"/><rect class="tool" x="46" y="30" width="12" height="10" rx="3"/>
<rect class="hl" x="12" y="46" width="216" height="9" rx="3"/>
<rect class="ln-strong" x="18" y="49" width="120" height="3.5" rx="1.8"/>
<rect class="ln" x="18" y="62" width="190" height="3.5" rx="1.8"/>
<rect class="ln" x="18" y="72" width="160" height="3.5" rx="1.8"/>
<rect class="ln" x="18" y="82" width="90" height="3.5" rx="1.8"/>
<rect class="cursor anim" style="animation: docs-blink 1.1s step-end infinite;" x="112" y="80" width="2" height="9"/>
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
    .anim { transform-box: fill-box; transform-origin: center; }
    .tool { fill: var(--surface-soft); stroke: var(--border); stroke-width: 1.4; }
    .hl { fill: var(--warning-bg); stroke: var(--warning-border); stroke-width: 1.2; }
    .cursor { fill: var(--primary); }
</style>
