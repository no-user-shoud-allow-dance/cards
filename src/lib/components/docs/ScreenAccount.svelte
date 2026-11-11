<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Konto: Statistik, Synchronisieren (Host/Join) und Alle Daten löschen">
<path class="frame" d="M234.8 54C234.3 56.6 233.1 59.1 231.9 61.5C230.6 64 229 66.4 227.2 68.8C225.4 71.2 223.5 73.6 221.1 76C218.8 78.3 216.3 80.6 213.2 82.8C210.1 85 206.6 87.2 202.5 89.2C198.5 91.1 193.9 92.9 188.9 94.4C184 95.9 178.5 97.2 172.9 98.2C167.3 99.2 161.3 100 155.5 100.5C149.6 101.1 143.6 101.4 137.7 101.7C131.8 101.9 125.9 102 120 102C114.1 102 108.2 102 102.2 101.8C96.3 101.5 90.3 101.2 84.4 100.7C78.5 100.1 72.6 99.4 67 98.3C61.4 97.3 56 96 51.1 94.4C46.2 92.9 41.6 91 37.6 89.1C33.6 87.2 30.2 85 27.1 82.8C24 80.6 21.5 78.2 19.1 75.9C16.7 73.6 14.7 71.2 12.8 68.8C10.9 66.4 9.2 64 7.9 61.6C6.6 59.1 5.4 56.6 4.8 54C4.3 51.4 4.1 48.8 4.7 46.2C5.3 43.6 6.5 41 8.4 38.6C10.4 36.1 13.1 33.7 16.2 31.5C19.3 29.2 23.1 27.2 27.1 25.2C31.1 23.3 35.5 21.6 39.9 19.9C44.4 18.2 49 16.6 53.8 15.1C58.5 13.7 63.4 12.2 68.5 10.9C73.6 9.6 78.9 8.3 84.4 7.3C90 6.3 95.8 5.4 101.7 4.9C107.7 4.3 113.9 4 120 4C126.1 4 132.3 4.4 138.2 5C144.1 5.5 150 6.5 155.5 7.5C161 8.5 166.3 9.7 171.4 11C176.5 12.3 181.4 13.7 186.2 15.1C191.1 16.6 195.8 18.1 200.3 19.8C204.7 21.5 209.2 23.2 213.2 25.2C217.1 27.1 221 29.2 224 31.4C227.1 33.7 229.7 36.1 231.6 38.6C233.4 41 234.5 43.7 235.1 46.2C235.6 48.8 235.4 51.4 234.8 54Z"/>
<rect class="bar" x="13" y="11" width="214" height="13" rx="4"/>
<rect class="logo" x="17" y="14" width="7" height="7" rx="2"/>
<rect class="crumb" x="28" y="16.5" width="34" height="3" rx="1.5"/>
<circle class="gear" cx="220" cy="17.5" r="3"/>
<rect class="ln-strong" x="14" y="31" width="34" height="4.5" rx="2.3"/>
<!-- stats card: pie + legend -->
<rect class="card" x="14" y="41" width="104" height="46" rx="5"/>
<circle class="pie-bg" cx="36" cy="64" r="13"/>
<path class="pie-wedge" d="M36 64 L36 51 A13 13 0 0 1 47.6 69.5 Z"/>
<path class="pie-learned" d="M36 64 L47.6 69.5 A13 13 0 0 1 40.5 76.3 Z"/>
<circle class="dot" cx="58" cy="54" r="2"/><rect class="ln" x="64" y="52.5" width="40" height="3" rx="1.5"/>
<circle class="dot" cx="58" cy="64" r="2"/><rect class="ln" x="64" y="62.5" width="48" height="3" rx="1.5"/>
<circle class="dot dot-green" cx="58" cy="74" r="2"/><rect class="ln" x="64" y="72.5" width="34" height="3" rx="1.5"/>
<!-- sync card: host button, QR + peer-id input, join button -->
<rect class="card" x="126" y="41" width="100" height="46" rx="5"/>
<rect class="btn-host" x="134" y="48" width="84" height="9" rx="4.5"/>
<rect class="btn-host-ln" x="152" y="51.5" width="48" height="3" rx="1.5"/>
<rect class="qr" x="134" y="62" width="18" height="18" rx="3"/>
<rect class="qr-dot" x="137" y="65" width="5" height="5" rx="1"/><rect class="qr-dot" x="145" y="65" width="4" height="4" rx="1"/><rect class="qr-dot" x="137" y="73" width="4" height="4" rx="1"/>
<rect class="input" x="157" y="62" width="61" height="8" rx="3"/>
<rect class="ln" x="162" y="65" width="42" height="2.5" rx="1.25"/>
<rect class="btn-join" x="157" y="74" width="61" height="8" rx="4"/>
<rect class="ln" x="177" y="77" width="22" height="2.5" rx="1.25"/>
<!-- delete-all danger bar -->
<rect class="btn-danger" x="14" y="91" width="212" height="8" rx="4"/>
<rect class="btn-danger-ln" x="98" y="94" width="44" height="2.5" rx="1.25"/>
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
    .pie-bg { fill: var(--primary-soft); }
    .pie-wedge { fill: var(--primary); }
    .pie-learned { fill: var(--success-text); }
    .dot { fill: var(--primary); }
    .dot-green { fill: var(--success-text); }
    .btn-host { fill: var(--primary); }
    .btn-host-ln { fill: var(--primary-text); }
    .qr { fill: none; stroke: var(--text); stroke-width: 1.5; }
    .qr-dot { fill: var(--text); }
    .input { fill: var(--surface-soft); stroke: var(--border); stroke-width: 1; }
    .btn-join { fill: var(--surface-soft); stroke: var(--border-strong); stroke-width: 1.2; }
    .btn-danger { fill: var(--danger-bg); stroke: var(--danger-border); stroke-width: 1.2; }
    .btn-danger-ln { fill: var(--danger-text); }
</style>
