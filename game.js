/* Trail Pack: little hiking puzzles. First one: Climb High, Sleep Low (plan the nights, then watch the hike). */
const { ROUTES, TREKS } = DATA;
const $app = document.getElementById('app'), $layer = document.getElementById('layer');

/* ---------- save ---------- */
let save = { unlocked: 0, done: {}, seen: false, mute: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('trailpack5') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('trailpack5', JSON.stringify(save)); } catch (e) {} };

/* ---------- sound ---------- */
let AC = null;
function tone(f, d, type = 'sine', vol = .12, delay = 0) {
  if (save.mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
const buzz = ms => { try { if (!save.mute && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
const SND = {
  tap: () => tone(620, .05, 'triangle', .08),
  tent: () => { tone(392, .08, 'triangle'); tone(587, .12, 'triangle', .1, .06); },
  step: () => tone(300 + Math.random() * 60, .04, 'square', .03),
  bad: () => { tone(220, .3, 'sawtooth', .07); tone(160, .3, 'sawtooth', .06, .15); buzz(60); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .13, i * .12))
};

/* ---------- the rules (same as tools/gen.js) ---------- */
// Based on Wilderness Medical Society / CDC guidance: above 3,000 m raise your sleeping altitude by no more than about
// 500 m per night, and take a rest day every 3-4 days. The walking-time numbers are a simple game estimate.
const RULE = { base: 3000, maxGain: 500, maxGainingNights: 3 };
const hopHours = (N, a) => (N[a + 1].km - N[a].km) / 2.5 + Math.max(0, N[a + 1].alt - N[a].alt) / 500;
const effGain = (prevAlt, alt) => alt > RULE.base ? Math.max(0, alt - Math.max(prevAlt, RULE.base)) : 0;

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = n => Math.round(n).toLocaleString('en-US');
const sleep = ms => new Promise(r => setTimeout(r, window.__instant ? 0 : ms));
const creditHTML = file => {
  const c = CREDITS[file.split('/').pop()]; if (!c) return '';
  return `<p class="credit">Photo: ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons</p>`;
};

/* ---------- state ---------- */
let screen = 'home', lv = 0, nights = [], phase = 'plan', runId = 0, bubble = { text: '', kind: '' }, helpRule = null, hist = [];
const lvl = () => LEVELS[lv], route = () => ROUTES[lvl().trek], nodes = () => route().nodes;
const idxOf = id => nodes().findIndex(n => n.id === id);
const startI = () => idxOf(lvl().start), endI = () => idxOf(lvl().end);
const has = r => lvl().rules.includes(r);
const fullAt = (v, night) => lvl().full.some(([id, n]) => idxOf(id) === v && n === night);

/* ---------- the cute bear ---------- */
function bearInner(mood) {
  const head = mood === 'dizzy' ? '#a9d68f' : '#c98f5f', ink = '#3b2a1f';
  const eyes = mood === 'dizzy' ? `<text x="-8.5" y="-31.5" font-size="9" font-weight="900" fill="${ink}">×</text><text x="0" y="-31.5" font-size="9" font-weight="900" fill="${ink}">×</text>`
    : mood === 'tired' ? `<path d="M-7 -34 q3 2 6 0 M1 -34 q3 2 6 0" stroke="${ink}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`
    : mood === 'happy' ? `<path d="M-7 -33.5 q3 -3.5 6 0 M1 -33.5 q3 -3.5 6 0" stroke="${ink}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`
    : `<circle cx="-4" cy="-34.5" r="1.9" fill="${ink}"/><circle cx="4" cy="-34.5" r="1.9" fill="${ink}"/>`;
  const mouth = mood === 'happy' ? `<path d="M-3.5 -28.5 q3.5 4 7 0" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : mood === 'dizzy' ? `<path d="M-3 -26.5 q3 -3 6 0" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : `<path d="M-2.5 -28 q2.5 2.2 5 0" stroke="${ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const em = { dizzy: '🤢', tired: '😴', happy: '🎉', night: '🌙' }[mood];
  return `<rect x="-19" y="-29" width="13" height="19" rx="5" fill="#f4b266"/><rect x="-18" y="-25" width="11" height="3" rx="1.5" fill="#e48f3c"/>
    <rect class="legL" x="-8" y="-8" width="6" height="9" rx="3" fill="#7a5238"/><rect class="legR" x="2" y="-8" width="6" height="9" rx="3" fill="#7a5238"/>
    <rect x="-10.5" y="-25" width="21" height="20" rx="9" fill="#7fb8e8"/>
    <circle cx="-9" cy="-44" r="4.8" fill="${head}"/><circle cx="9" cy="-44" r="4.8" fill="${head}"/><circle cx="-9" cy="-44" r="2.3" fill="#e8b98b"/><circle cx="9" cy="-44" r="2.3" fill="#e8b98b"/>
    <circle cx="0" cy="-34" r="12.5" fill="${head}"/><ellipse cx="0" cy="-29.5" rx="6" ry="4.4" fill="#f3d6b4"/><ellipse cx="0" cy="-31.2" rx="2.2" ry="1.5" fill="${ink}"/>
    ${eyes}${mouth}
    <path d="M-12.4 -37 a12.5 12.5 0 0 1 24.8 0 q-12.4 -3 -24.8 0z" fill="#ff7f9f"/><circle cx="0" cy="-48.5" r="3.4" fill="#fff"/>
    ${em ? `<text x="0" y="-55" font-size="15" text-anchor="middle">${em}</text>` : ''}`;
}
const bearSVG = mood => `<svg viewBox="-24 -62 48 66" width="46" height="63">${bearInner(mood)}</svg>`;

/* ---------- the scene ---------- */
let geo = null; // geometry of the current scene, shared with the hike animation
const cr = pts => { let d = `M${pts[0].x} ${pts[0].y}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`; } return d; };
const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

function sceneSVG() {
  const L = lvl(), N = nodes(), s = startI(), e = endI(), sub = N.slice(s, e + 1), n = sub.length;
  const gap = 132, padX = 76, W = padX * 2 + gap * (n - 1), H = 300;
  const alts = sub.map(v => v.alt), lo = Math.min(...alts) - 330, hi = Math.max(...alts) + 380;
  const Y = a => H - 40 - (a - lo) / (hi - lo) * (H - 40 - 70);
  const P = sub.map((v, k) => ({ x: padX + gap * k, y: Y(v.alt) }));
  geo = { P, W, H, s, e };
  const ext = [{ x: -10, y: P[0].y + 8 }, ...P, { x: W + 10, y: P[n - 1].y - 8 }];
  const R = rng(7 + lv * 13);
  const gs = a => { const t = (Y(a) - Y(hi)) / (Y(lo) - Y(hi)); return Math.max(0, Math.min(1, t)).toFixed(3); };
  let svg = `<svg id="sc" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Mountain trail">`;
  svg += `<defs><linearGradient id="mt" gradientUnits="userSpaceOnUse" x1="0" y1="${Y(hi)}" x2="0" y2="${Y(lo)}">
    <stop offset="0" stop-color="#ffffff"/><stop offset="${gs(4700)}" stop-color="#f1f4ff"/><stop offset="${gs(3900)}" stop-color="#d9dff2"/><stop offset="${gs(3200)}" stop-color="#cbe9cf"/><stop offset="1" stop-color="#a9dcb5"/></linearGradient></defs>`;
  // soft back mountains
  for (let i = 0; i < Math.ceil(W / 150); i++) { const bx = i * 150 + R() * 60, bh = 70 + R() * 60, bw = 80 + R() * 40; svg += `<path d="M${bx - bw} ${H - 40} L${bx} ${H - 40 - bh - 40} L${bx + bw} ${H - 40}Z" fill="${i % 2 ? '#e4dcf6' : '#d6e6f7'}" stroke="${i % 2 ? '#e4dcf6' : '#d6e6f7'}" stroke-width="14" stroke-linejoin="round" opacity=".85"/>`; }
  svg += `<path d="${cr(ext)} L${W + 10} ${H} L-10 ${H}Z" fill="url(#mt)"/>`;
  // trees on the low slopes
  P.forEach((p, k) => { if (k === n - 1) return; const q = P[k + 1]; for (let t = 0; t < 3; t++) { const f = .15 + R() * .7, x = p.x + (q.x - p.x) * f, y = p.y + (q.y - p.y) * f + 20 + R() * 36, a = sub[k].alt + (sub[k + 1].alt - sub[k].alt) * f; if (a < 3900 && y < H - 14) svg += `<text x="${x}" y="${y}" font-size="${14 + R() * 6}" text-anchor="middle">${R() > .35 ? '🌲' : '🌳'}</text>`; } });
  // trail
  svg += `<path d="${cr(P)}" fill="none" stroke="#fff6dd" stroke-width="11" stroke-linecap="round"/><path d="${cr(P)}" fill="none" stroke="#e2b98a" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"/>`;
  // hours on each hop
  P.forEach((p, k) => { if (k === n - 1) return; const q = P[k + 1], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - 30, h = hopHours(N, s + k);
    svg += `<g><rect x="${mx - 20}" y="${my - 10}" width="40" height="18" rx="9" fill="#fff" stroke="#ffd166" stroke-width="2"/><text x="${mx}" y="${my + 3}" font-size="10.5" font-weight="900" text-anchor="middle" fill="#4a3f6b">☀️${h.toFixed(1)}h</text></g>`; });
  // villages
  sub.forEach((v, k) => { const p = P[k], isE = k === n - 1;
    const fulls = L.full.filter(([id]) => idxOf(id) === s + k).map(([, nn]) => nn);
    svg += `<g class="vil" id="v${s + k}"><path d="M${p.x - 14} ${p.y - 15} L${p.x} ${p.y - 30} L${p.x + 14} ${p.y - 15}Z" fill="#ff8e72" stroke="#ff8e72" stroke-width="3" stroke-linejoin="round"/>
      <rect x="${p.x - 11}" y="${p.y - 16}" width="22" height="16" rx="3" fill="#fff" stroke="#e5def2" stroke-width="1.5"/><rect x="${p.x - 3}" y="${p.y - 10}" width="6" height="10" rx="2" fill="#b9a6f7"/>
      ${k === 0 ? `<text x="${p.x - 14}" y="${p.y - 34}" font-size="17">🚩</text>` : ''}${isE ? `<text x="${p.x - 4}" y="${p.y - 34}" font-size="17">🏁</text>` : ''}
      <g><rect x="${p.x - 46}" y="${p.y + 8}" width="92" height="30" rx="13" fill="#fff" opacity=".92"/><text x="${p.x}" y="${p.y + 21}" font-size="11" font-weight="900" text-anchor="middle" fill="#4a3f6b">${esc(v.name)}</text><text x="${p.x}" y="${p.y + 33}" font-size="10" font-weight="800" text-anchor="middle" fill="#8a7fa8">${nf(v.alt)} m</text></g>
      ${fulls.map((nn, j) => `<g><rect x="${p.x - 26 + j * 0}" y="${p.y - 58 - j * 20}" width="52" height="17" rx="8.5" fill="#ffe0e0" stroke="#ff6b6b" stroke-width="1.5"/><text x="${p.x}" y="${p.y - 46 - j * 20}" font-size="9.5" font-weight="900" text-anchor="middle" fill="#c24444">🚫 full n${nn}</text></g>`).join('')}
      <circle class="vhit" cx="${p.x}" cy="${p.y - 10}" r="34" fill="transparent" onclick="tapVillage(${s + k})"/></g>`;
  });
  // tents (hidden/shown by the hike)
  const seen = {};
  nights.forEach((v, i) => { if (v == null) return; const k = v - s, p = P[k], c = (seen[v] = (seen[v] || 0) + 1) - 1;
    svg += `<g class="tent" id="t${i}" style="transform-origin:${p.x + 26 + c * 22}px ${p.y}px"><path d="M${p.x + 16 + c * 22} ${p.y} L${p.x + 26 + c * 22} ${p.y - 20} L${p.x + 36 + c * 22} ${p.y}Z" fill="${['#b9a6f7', '#8fd9b6', '#ffb88f', '#8ec9ff'][i % 4]}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M${p.x + 23 + c * 22} ${p.y} L${p.x + 26 + c * 22} ${p.y - 9} L${p.x + 29 + c * 22} ${p.y}Z" fill="#4a3f6b" opacity=".35"/>
      <circle cx="${p.x + 38 + c * 22}" cy="${p.y - 22}" r="8" fill="#4a3f6b"/><text x="${p.x + 38 + c * 22}" y="${p.y - 19}" font-size="9.5" font-weight="900" text-anchor="middle" fill="#fff">${i + 1}</text></g>`; });
  // the hiker
  svg += `<g class="bearg" id="hiker" style="transform:translate(${P[0].x - 26}px,${P[0].y}px)"><g class="bear" id="bear">${bearInner('idle')}</g></g>`;
  return svg + '</svg>';
}

/* ---------- render ---------- */
function setBubble(text, kind = '') { bubble = { text, kind }; const b = document.getElementById('bub'); if (b) { b.className = 'bubble ' + kind; b.querySelector('.tx').innerHTML = text; } }
function mood(m, walking) { const b = document.getElementById('bear'); if (!b) return; b.innerHTML = bearInner(m); b.setAttribute('class', 'bear' + (walking ? ' walk' : '') + (m === 'dizzy' ? ' dizzy' : '')); const av = document.getElementById('av'); if (av) av.innerHTML = bearSVG(m); }
const RULE_INFO = {
  hours: ['☀️', 'Daylight', `You can walk about ${'${H}'} hours a day. Every hop on the trail shows its walking time. Add them up.`],
  gain: ['⛰️', 'Climb', 'Above 3,000 m, sleep no more than 500 m higher than the night before.'],
  rest: ['🛌', 'Rest', 'After 3 nights of sleeping higher, the 4th night must not be higher. Staying put counts as a rest day.']
};
function planText() {
  const L = lvl(), N = nodes(), k = nights.findIndex(v => v == null);
  if (k < 0) return `Perfect! All the tents are up. Press <b>Start hike</b>.`;
  return `Get to <b>${esc(N[endI()].name)}</b> in <b>${L.days} days</b>. Tap a village to sleep there on <b>night ${k + 1}</b>.`;
}
function renderGame() {
  const L = lvl(), N = nodes(), planning = phase === 'plan';
  const keep = (document.getElementById('scene') || {}).scrollLeft || 0;
  const chips = L.rules.map(r => `<button class="chip ${helpRule === r ? 'on' : ''}" onclick="toggleHelp('${r}')"><span class="ic">${RULE_INFO[r][0]}</span>${r === 'hours' ? L.maxHours + ' h' : r === 'gain' ? '+500 m' : 'Rest'}</button>`).join('');
  const tray = nights.map((v, i) => v == null
    ? `<div class="slot ${i === nights.findIndex(x => x == null) ? 'next' : ''}"><span class="t">🌙</span><span class="n">Night ${i + 1}</span></div>`
    : `<button class="slot filled" onclick="tapSlot(${i})"><span class="t">⛺</span><span class="n">Night ${i + 1}</span>${esc(N[v].name.split(' ')[0])}</button>`).join('');
  const left = nights.filter(v => v == null).length;
  $app.innerHTML = `
    <div class="top">
      <button class="ib" onclick="goStages()">←</button>
      <h1>${esc(L.title)}<small>Climb High, Sleep Low</small></h1>
      <button class="ib" onclick="undo()" ${hist.length && planning ? '' : 'disabled'}>↶</button>
      <button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button>
    </div>
    <div class="bubble ${bubble.kind}" id="bub"><div class="av" id="av">${bearSVG('idle')}</div><div class="tx">${helpRule ? '' : (bubble.text || planText())}</div></div>
    <div class="chips">${chips}</div>
    <div class="scene" id="scene">${sceneSVG()}</div>
    <div class="meters">
      <div class="meter"><div class="mt"><span>☀️ Daylight</span><span id="mt-day">0 / ${L.maxHours} h</span></div><div class="bar"><i id="mb-day"></i></div></div>
      ${has('gain') ? `<div class="meter"><div class="mt"><span>⛰️ Climb</span><span id="mt-gain">+0 m</span></div><div class="bar"><i id="mb-gain"></i></div></div>` : ''}
      ${has('rest') ? `<div class="meter"><div class="mt"><span>🛌 Rest</span><span id="mt-rest">0 / 3</span></div><div class="pips" id="mb-rest"><i></i><i></i><i></i></div></div>` : ''}
    </div>
    <div class="tray">${tray}</div>
    ${phase === 'fail' ? `<button class="big lav" onclick="tryAgain()">↺ Fix the plan</button>` : `<button class="big" id="go" onclick="startHike()" ${planning && !left ? '' : 'disabled'}>${planning ? (left ? `Place ${left} more tent${left > 1 ? 's' : ''}` : '▶ Start hike') : 'Hiking…'}</button>`}
    <div class="foot">${esc(route().note)}</div>`;
  const sc = document.getElementById('scene'); sc.scrollLeft = keep;
  if (helpRule) { const t = RULE_INFO[helpRule][2].replace('${H}', L.maxHours); document.querySelector('#bub .tx').textContent = t; }
  mood(phase === 'fail' ? 'dizzy' : 'idle', false);
  if (!planning && phase !== 'fail') nights.forEach((_, i) => { const t = document.getElementById('t' + i); if (t) t.classList.add('hide'); });
}

/* ---------- actions ---------- */
function startLevel(i) {
  runId++; lv = i; screen = 'game'; nights = Array(LEVELS[i].days - 1).fill(null); phase = 'plan'; bubble = { text: '', kind: '' }; helpRule = null; hist = [];
  const q = new URLSearchParams(location.search);
  if (q.has('solved')) nights = LEVELS[i].solutions[0].map(idxOf);
  window.scrollTo(0, 0); renderGame();
  if (!save.seen && !q.has('seen')) { save.seen = true; persist(); showHow(); }
}
function tapVillage(v) {
  if (phase !== 'plan') return;
  const k = nights.findIndex(x => x == null);
  if (k < 0) { setBubble('All the tents are up! Tap a tent card below to take one back, or press <b>Start hike</b>.'); SND.bad(); return; }
  if (v === endI() && k < nights.length) { setBubble(`That is where we are heading on the last day. Pick a stop before it for night ${k + 1}.`, 'bad'); SND.bad(); return; }
  if (fullAt(v, k + 1)) { setBubble(`🚫 The lodge in <b>${esc(nodes()[v].name)}</b> is full on night ${k + 1}. Pick another village.`, 'bad'); SND.bad(); const el = document.getElementById('v' + v); if (el) { el.classList.add('vbounce'); setTimeout(() => el.classList.remove('vbounce'), 400); } return; }
  hist.push(nights.slice()); nights[k] = v; helpRule = null; bubble = { text: '', kind: '' }; SND.tent(); renderGame();
}
function tapSlot(i) { if (phase !== 'plan') return; hist.push(nights.slice()); nights[i] = null; bubble = { text: '', kind: '' }; SND.tap(); renderGame(); }
function undo() { if (!hist.length || phase !== 'plan') return; nights = hist.pop(); bubble = { text: '', kind: '' }; SND.tap(); renderGame(); }
function toggleHelp(r) { helpRule = helpRule === r ? null : r; SND.tap(); renderGame(); }
function toggleMute() { save.mute = !save.mute; persist(); if (!save.mute) SND.tap(); render(); }
function tryAgain() { runId++; phase = 'plan'; bubble = { text: '', kind: '' }; SND.tap(); renderGame(); }

/* ---------- the hike ---------- */
function meter(id, frac, text, warn) {
  const b = document.getElementById('mb-' + id), t = document.getElementById('mt-' + id);
  if (b) { b.style.width = Math.min(100, frac * 100) + '%'; b.classList.toggle('warn', !!warn); }
  if (t) t.textContent = text;
}
function moveHiker(x, y, ms) { const h = document.getElementById('hiker'); if (!h) return; h.style.transitionDuration = (window.__instant ? 0 : ms) + 'ms'; h.style.transform = `translate(${x - 26}px,${y}px)`;
  const sc = document.getElementById('scene'); if (sc) sc.scrollTo({ left: Math.max(0, x - sc.clientWidth / 2), behavior: window.__instant ? 'auto' : 'smooth' }); }
async function startHike() {
  if (phase !== 'plan' || nights.some(v => v == null)) return;
  const run = ++runId, L = lvl(), N = nodes(), s = startI(), P = geo.P, ok = () => run === runId;
  phase = 'hike'; bubble = { text: '', kind: '' }; renderGame(); window.scrollTo({ top: 0 });
  const stops = nights.concat([endI()]); let from = s, prevAlt = N[s].alt, streak = 0;
  moveHiker(P[0].x, P[0].y, 0); await sleep(250); if (!ok()) return;
  for (let d = 0; d < stops.length; d++) {
    const to = stops[d]; setBubble(`Day ${d + 1}: let’s walk to <b>${esc(N[to].name)}</b>!`); mood('idle', true);
    meter('day', 0, `0 / ${L.maxHours} h`);
    let cum = 0;
    for (let h = from; h < to; h++) {
      const hh = hopHours(N, h), a = P[h - s], b = P[h + 1 - s];
      if (cum + hh > L.maxHours + 1e-9) { // night falls on the trail
        const f = Math.max(0, (L.maxHours - cum) / hh), x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
        moveHiker(x, y, f * hh * 420); await sleep(f * hh * 420 + 100); if (!ok()) return;
        meter('day', 1, `${L.maxHours} / ${L.maxHours} h`, true); mood('night', false);
        return fail('hours', { h: cum + hh });
      }
      cum += hh; moveHiker(b.x, b.y, hh * 420); SND.step();
      meter('day', cum / L.maxHours, `${cum.toFixed(1)} / ${L.maxHours} h`);
      await sleep(hh * 420 + 60); if (!ok()) return;
    }
    mood('idle', false);
    const isLast = d === stops.length - 1;
    if (fullAt(to, d + 1)) { mood('dizzy', false); return fail('full', { v: to }); }
    const t = document.getElementById('t' + d); if (t) { t.classList.remove('hide'); }
    SND.tent(); await sleep(450); if (!ok()) return;
    const gain = effGain(prevAlt, N[to].alt);
    if (has('gain')) { meter('gain', gain / RULE.maxGain, `+${nf(gain)} m`, gain > RULE.maxGain); if (gain > RULE.maxGain) { mood('dizzy', false); return fail('gain', { g: gain }); } }
    if (N[to].alt > RULE.base && N[to].alt > prevAlt) streak++; else streak = 0;
    if (has('rest')) { const pips = document.querySelectorAll('#mb-rest i'); pips.forEach((p, i) => { p.classList.toggle('f', i < streak); p.classList.toggle('warn', streak > RULE.maxGainingNights); }); meter('rest', 0, `${Math.min(streak, 3)} / 3`);
      if (streak > RULE.maxGainingNights) { mood('tired', false); return fail('rest', {}); } }
    prevAlt = N[to].alt; from = to;
    if (!isLast) { setBubble(`Night ${d + 1}: cosy in <b>${esc(N[to].name)}</b> (${nf(N[to].alt)} m). 🌙`, 'good'); await sleep(600); if (!ok()) return; }
  }
  mood('happy', false); win();
}
function fail(kind, o) {
  phase = 'fail'; SND.bad();
  const N = nodes(), msg = {
    hours: `🌙 Night fell before we reached a village! That day was too far (about ${o.h ? o.h.toFixed(1) : '?'} h). Try shorter days.`,
    full: `🚫 The lodge in <b>${o.v != null ? esc(N[o.v].name) : ''}</b> is full tonight and there is nowhere to sleep!`,
    gain: `🤢 Ugh, my head hurts! We slept <b>${nf(o.g || 0)} m</b> higher than last night. That is too fast, and it is how altitude sickness starts.`,
    rest: `😴 I am wiped out! After 3 nights of climbing we need a rest night, where we do not sleep any higher.`
  }[kind];
  setBubble(msg, 'bad'); const go = document.getElementById('go'); if (go) { go.className = 'big lav'; go.disabled = false; go.textContent = '↺ Fix the plan'; go.onclick = tryAgain; }
}

function win() {
  save.done[lv] = true; save.unlocked = Math.max(save.unlocked, Math.min(lv + 1, LEVELS.length - 1)); persist(); phase = 'won';
  setBubble('We made it! 🎉 Great plan.', 'good'); SND.win(); confetti(); buzz([30, 40, 30]);
  setTimeout(showWin, window.__instant ? 0 : 900);
}
function confetti() {
  const em = ['🎉', '⭐', '🥾', '🏔️', '✨', '🎒'];
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div'); d.className = 'conf'; d.textContent = em[i % em.length];
    d.style.left = Math.random() * 100 + 'vw'; d.style.animationDelay = Math.random() * .8 + 's'; d.style.fontSize = (16 + Math.random() * 16) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 3600);
  }
}

/* ---------- other screens ---------- */
function render() { screen === 'home' ? renderHome() : screen === 'stages' ? renderStages() : renderGame(); }
function renderHome() {
  const done = Object.keys(save.done).length;
  $app.innerHTML = `<div class="hero"><h1>🥾 Trail Pack</h1><p>Little hiking puzzles with real treks</p></div>
    <button class="gcard a" onclick="goStages()"><span class="ico">⛰️</span><span><h3>Climb High, Sleep Low</h3><p>Plan the nights of the Everest trek, then watch the bear hike it!</p></span><span class="tag">${done}/${LEVELS.length} done</span></button>
    <button class="gcard b soon" onclick="soonMsg('Pack Fit')"><span class="ico">🎒</span><span><h3>Pack Fit</h3><p>Fit your gear into the pack.</p></span><span class="tag">🔒 soon</span></button>
    <button class="gcard c soon" onclick="soonMsg('Contour Route')"><span class="ico">🗺️</span><span><h3>Contour Route</h3><p>Read the map and find the safe way up.</p></span><span class="tag">🔒 soon</span></button>
    <button class="gcard d soon" onclick="soonMsg('Trail Words')"><span class="ico">🔤</span><span><h3>Trail Words</h3><p>Find the hiking words.</p></span><span class="tag">🔒 soon</span></button>
    <div class="row"><button class="sm" onclick="showHow()">How to play</button><button class="sm" onclick="toggleMute()">${save.mute ? '🔇 Sound off' : '🔊 Sound on'}</button></div>`;
}
function soonMsg(t) { SND.tap(); overlay(`<div class="pad"><h2>${t}</h2><p style="text-align:center;font-weight:700">Coming soon! We are building one mini-game at a time.</p><button class="big" onclick="closeOverlay()">OK</button></div>`); }
function renderStages() {
  const T = TREKS.ebc;
  const nodesH = LEVELS.map((L, i) => {
    const locked = i > save.unlocked, N = ROUTES[L.trek].nodes, a = N.find(n => n.id === L.start), b = N.find(n => n.id === L.end), right = i % 2 === 1;
    return `<div class="snode ${right ? 'r' : ''}"><button class="sbtn ${save.done[i] ? 'done' : ''} ${locked ? 'locked' : ''}" ${locked ? '' : `onclick="startLevel(${i})"`}>${locked ? '🔒' : i + 1}${save.done[i] ? '<span class="chk">✓</span>' : ''}</button>
      <div class="slabel">${esc(L.title)}<small>${L.days} days · ${nf(a.alt)} → ${nf(b.alt)} m</small></div></div>`; }).join('');
  $app.innerHTML = `<div class="top"><button class="ib" onclick="goHome()">←</button><h1>Climb High, Sleep Low<small>${esc(T.name)}, ${esc(T.place)}</small></h1><button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button></div>
    <div class="mhead"><span class="ico">🐻</span><span><b>Plan the safest nights!</b><span>Each stage adds one new rule.</span></span></div>
    <div class="mapwrap">${nodesH}</div>`;
}
function overlay(html, dismiss = true) { $layer.innerHTML = `<div class="overlay" ${dismiss ? 'onclick="if(event.target===this)closeOverlay()"' : ''}><div class="modal">${html}</div></div>`; }
function closeOverlay() { $layer.innerHTML = ''; }
function goHome() { runId++; screen = 'home'; closeOverlay(); render(); window.scrollTo(0, 0); }
function goStages() { runId++; screen = 'stages'; closeOverlay(); render(); window.scrollTo(0, 0); }
function showHow() {
  overlay(`<div class="pad"><h2>How to play</h2>
    <ul class="how">
      <li><span class="i">⛺</span><span><b>Tap a village</b> to put up a tent there for the night.</span></li>
      <li><span class="i">▶️</span><span>Put up every tent, then press <b>Start hike</b>.</span></li>
      <li><span class="i">🐻</span><span><b>Watch the bear walk it.</b> If something goes wrong, you will see it happen. Fix the plan and try again!</span></li>
    </ul><button class="big" onclick="closeOverlay()">Let’s go!</button></div>`);
}
const TIPS = [
  ['CLIMB HIGH, SLEEP LOW', 'Your body adapts to the altitude where you sleep. You can walk higher during the day, as long as you come back down to sleep and raise your sleeping altitude slowly.'],
  ['THE 500 M RULE', 'Above 3,000 m, guidelines suggest raising your sleeping altitude by no more than about 500 m per night.'],
  ['REST DAYS', 'Above 3,000 m, take a rest day, with no increase in sleeping altitude, every 3–4 days.'],
  ['EXTRA NIGHTS', 'The CDC suggests one extra night to acclimatise for every 1,000 m of sleeping altitude you gain.']
];
function showWin() {
  const L = lvl(), T = TREKS[L.trek], ph = T.photos[lv % T.photos.length], tip = TIPS[Math.min(lv, 3) % TIPS.length], fact = route().facts[lv % route().facts.length], last = lv === LEVELS.length - 1;
  overlay(`<div class="photo" style="background-image:url(${ph.file})"><div class="cap">${esc(ph.caption)}</div></div>
    <div class="pad"><h2>We made it! 🎉</h2>
      <div class="tip"><b>RANGER TIP · ${tip[0]}</b>${esc(tip[1])}</div>
      <div class="fact"><b>FUN FACT</b>${esc(fact)}</div>${creditHTML(ph.file)}
      <div class="row" style="margin-top:14px"><button class="sm" onclick="closeOverlay();startLevel(lv)">Replay</button><button class="sm" onclick="goStages()">Stages</button></div>
      ${last ? '' : '<button class="big" style="margin-top:12px" onclick="closeOverlay();startLevel(lv+1)">Next stage →</button>'}</div>`, false);
}

/* ---------- boot ---------- */
(function boot() {
  const q = new URLSearchParams(location.search);
  if (q.has('unlock')) save.unlocked = LEVELS.length - 1;
  if (q.has('noanim')) document.head.insertAdjacentHTML('beforeend', '<style>*{animation:none!important}</style>'); // debug: for screenshots
  if (q.has('lv')) return startLevel(+q.get('lv'));
  if (q.has('stages')) return goStages();
  render();
})();
