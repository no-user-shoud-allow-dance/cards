<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Smartphone scannt den QR-Code mit der Peer-ID">
<g transform="translate(27.43,0) scale(0.77143)">
<rect class="phone" x="90" y="6" width="60" height="128" rx="10"/>
<rect class="phone-screen" x="97" y="22" width="46" height="46" rx="4"/>
<rect class="qr" x="101" y="26" width="38" height="38" rx="3"/>
<rect class="qr-dot" x="105" y="30" width="10" height="10" rx="2"/><rect class="qr-dot" x="125" y="30" width="10" height="10" rx="2"/><rect class="qr-dot" x="105" y="50" width="10" height="10" rx="2"/><rect class="qr-dot" x="125" y="50" width="4" height="4"/><rect class="qr-dot" x="132" y="57" width="4" height="4"/>
<rect class="scanline anim" x="97" y="22" width="46" height="3" rx="1.5"/>
<circle class="cam" cx="120" cy="14" r="2.5"/>
<rect class="ln-strong" x="103" y="80" width="34" height="4" rx="2"/>
<rect class="ln" x="108" y="89" width="24" height="3.5" rx="1.8"/>
<rect class="ln" x="103" y="102" width="34" height="4" rx="2"/>
<rect class="ln" x="108" y="111" width="24" height="3.5" rx="1.8"/>
</g>
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
    .phone { fill: var(--surface); stroke: var(--text); stroke-width: 2; }
    .phone-screen { fill: var(--surface-soft); }
    .qr { fill: none; stroke: var(--text); stroke-width: 1.8; }
    .qr-dot { fill: var(--text); }
    .cam { fill: var(--border-strong); }
    .scanline { fill: var(--primary); animation: scan var(--docs-anim) ease-in-out infinite alternate; }
    @keyframes scan { from { transform: translateY(0); opacity: 1; } to { transform: translateY(43px); opacity: 0.6; } }
</style>
