<svg viewBox="0 0 240 108" class="screen" role="img" aria-label="Entwickler: Terminal, bun run dev">
<path class="frame" d="M237.3 54C237.3 56.6 236.4 59.2 235.1 61.8C233.7 64.3 231.6 66.8 229.2 69.1C226.9 71.5 223.9 73.7 220.9 75.9C217.9 78.1 214.6 80.2 211.2 82.2C207.7 84.3 204.2 86.3 200.2 88.2C196.3 90.1 192.2 92 187.7 93.7C183.1 95.4 178.2 97 173 98.3C167.8 99.6 162 100.7 156.2 101.5C150.5 102.3 144.3 102.8 138.2 103C132.2 103.3 126 103.2 120 102.9C114 102.7 108.1 102.2 102.3 101.7C96.5 101.1 90.8 100.4 85.2 99.7C79.5 98.9 74 98.1 68.5 97.1C63 96.1 57.5 95 52.3 93.7C47.1 92.4 42 90.9 37.5 89.2C32.9 87.4 28.7 85.5 25.1 83.4C21.6 81.3 18.6 78.9 16.2 76.5C13.8 74.2 12.1 71.6 10.8 69.1C9.4 66.6 8.7 64.1 8.1 61.5C7.5 59 7.3 56.5 7.3 54C7.3 51.5 7.4 49 7.9 46.4C8.4 43.9 9.1 41.3 10.5 38.8C11.8 36.3 13.6 33.8 16 31.4C18.4 29.1 21.5 26.7 25.1 24.6C28.7 22.5 33 20.6 37.6 18.9C42.2 17.2 47.3 15.7 52.5 14.4C57.7 13.1 63.1 12 68.6 11C74 10 79.6 9.1 85.2 8.3C90.8 7.5 96.4 6.8 102.2 6.2C108.1 5.7 114 5.2 120 4.9C126 4.7 132.2 4.6 138.3 4.9C144.3 5.1 150.5 5.7 156.2 6.5C162 7.3 167.7 8.4 172.9 9.8C178.1 11.1 183 12.7 187.5 14.4C192 16.1 196.1 18 200.1 19.9C204 21.8 207.7 23.7 211.2 25.8C214.7 27.8 218.1 29.9 221.1 32C224.2 34.2 227.2 36.5 229.5 38.8C231.9 41.2 234 43.7 235.3 46.2C236.6 48.7 237.3 51.4 237.3 54Z"/>
<rect class="term-bar" x="13" y="11" width="214" height="12" rx="4"/>
<circle class="dot dot-r" cx="21" cy="17" r="2.4"/><circle class="dot dot-y" cx="29" cy="17" r="2.4"/><circle class="dot dot-g" cx="37" cy="17" r="2.4"/>
<text class="tline" style="animation: docs-rise 0.3s ease 0.1s both;" x="20" y="38">$ bun install</text>
<text class="tline" style="animation: docs-rise 0.3s ease 0.8s both;" x="20" y="52">$ bun run dev</text>
<text class="tline" style="animation: docs-rise 0.3s ease 1.7s both;" x="20" y="66">ready: http://localhost:5173</text>
<rect class="cursor anim" style="animation: docs-blink 1.1s step-end infinite;" x="20" y="74" width="6" height="10"/>
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
    .term-bar { fill: var(--surface-soft); }
    .dot { stroke: none; } .dot-r { fill: var(--danger-text); } .dot-y { fill: var(--warning-text); } .dot-g { fill: var(--success-text); }
    .tline { fill: var(--text); font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 9px; }
    .cursor { fill: var(--primary); }
</style>
