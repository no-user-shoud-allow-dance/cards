<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Laptop und Smartphone tauschen Daten direkt aus">
<g transform="translate(33.6,0) scale(0.77143)">
<rect class="laptop" x="14" y="28" width="76" height="50" rx="4"/>
<rect class="laptop-base" x="6" y="78" width="92" height="7" rx="3.5"/>
<rect class="ln-strong" x="22" y="40" width="40" height="4" rx="2"/>
<rect class="ln" x="22" y="50" width="56" height="3.5" rx="1.8"/>
<rect class="ln" x="22" y="60" width="30" height="3.5" rx="1.8"/>
<path class="flow" d="M100 53 H168"/>
<circle class="packet anim" cx="100" cy="53" r="3.2"/>
<rect class="phone" x="176" y="34" width="42" height="76" rx="8"/>
<rect class="ln-strong" x="183" y="46" width="28" height="3.5" rx="1.8"/>
<rect class="ln" x="183" y="54" width="20" height="3" rx="1.5"/>
<rect class="pbar-track" x="182" y="66" width="30" height="5" rx="2.5"/>
<rect class="pbar-fill anim" x="182" y="66" width="30" height="5" rx="2.5"/>
<rect class="phone-btn anim" style="animation: docs-pulse var(--docs-anim-fast) ease-in-out infinite;" x="184" y="92" width="26" height="9" rx="4.5"/>
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
    .laptop { fill: var(--surface); stroke: var(--text); stroke-width: 2; }
    .laptop-base { fill: var(--surface-soft); stroke: var(--border); stroke-width: 1.5; }
    .phone { fill: var(--surface); stroke: var(--text); stroke-width: 2; }
    .flow { fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 6 6; animation: docs-dash var(--docs-anim-fast) linear infinite; }
    .packet { fill: var(--primary); animation: travel var(--docs-anim-fast) linear infinite; }
    .phone-btn { fill: var(--primary); }
    .pbar-track { fill: var(--surface-soft); stroke: var(--border); stroke-width: 1; }
    .pbar-fill { fill: var(--primary); transform-box: fill-box; transform-origin: left center; animation: fill var(--docs-anim) ease-in-out infinite; }
    @keyframes fill { 0% { transform: scaleX(0); } 70%, 100% { transform: scaleX(1); } }
    @keyframes travel { from { transform: translateX(0); } to { transform: translateX(68px); } }
</style>
