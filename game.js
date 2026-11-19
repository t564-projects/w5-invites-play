/* Trail Pack: hiking mini-games. First one: Climb High, Sleep Low (acclimatisation itinerary). */
const { ROUTES, TREKS } = DATA;
const $app = document.getElementById('app'), $layer = document.getElementById('layer'), $bg = document.getElementById('bg');

/* ---------- save ---------- */
let save = { unlocked: 0, done: {}, seen: false, mute: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('trailpack4') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('trailpack4', JSON.stringify(save)); } catch (e) {} };

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
  pick: () => { tone(392, .08, 'triangle'); tone(587, .1, 'triangle', .1, .06); },
  bad: () => { tone(190, .22, 'sawtooth', .07); buzz(50); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .13, i * .12))
};

/* ---------- the rules (same as tools/gen.js) ---------- */
// Based on Wilderness Medical Society / CDC guidance: above 3,000 m raise your sleeping altitude by no more than
// about 500 m per night, and take a rest day every 3-4 days. The walking-time numbers are a simple game estimate.
const RULE = { base: 3000, maxGain: 500, maxGainingNights: 3 };
const hoursBetween = (nodes, a, b) => { let h = 0; for (let i = a; i < b; i++) { const d = nodes[i + 1].km - nodes[i].km, up = Math.max(0, nodes[i + 1].alt - nodes[i].alt); h += d / 2.5 + up / 500; } return h; };
const kmBetween = (nodes, a, b) => nodes[b].km - nodes[a].km;
const upBetween = (nodes, a, b) => { let u = 0; for (let i = a; i < b; i++) u += Math.max(0, nodes[i + 1].alt - nodes[i].alt); return u; };
const effGain = (prevAlt, alt) => alt > RULE.base ? Math.max(0, alt - Math.max(prevAlt, RULE.base)) : 0;

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = n => Math.round(n).toLocaleString('en-US');
const creditHTML = (file, dark) => {
  const c = CREDITS[file.split('/').pop()]; if (!c) return '';
  return `<p class="credit ${dark ? 'dark' : ''}">Photo: ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons</p>`;
};
const setBg = file => { $bg.style.backgroundImage = file ? `url(${file})` : 'none'; };

/* ---------- state ---------- */
let screen = 'home', lv = 0, nights = [], hist = [], won = false, msg = '', ruleOpen = null;
const lvl = () => LEVELS[lv], route = () => ROUTES[lvl().trek], nodes = () => route().nodes;
const idxOf = id => nodes().findIndex(n => n.id === id);
const startI = () => idxOf(lvl().start), endI = () => idxOf(lvl().end);
const isFull = (v, night) => lvl().full.some(([id, n]) => idxOf(id) === v && n === night);

/* ---------- checking ---------- */
// Returns one entry per day: where you start, where you sleep, and what is wrong with it.
function analyse() {
  const L = lvl(), N = nodes(), D = L.days, days = [];
  let streak = 0, prevAlt = N[startI()].alt;
  for (let i = 0; i < D; i++) {
    const from = i === 0 ? startI() : nights[i - 1], to = i === D - 1 ? endI() : nights[i];
    const d = { i, from, to, probs: [], known: from != null && to != null };
    if (!d.known) { days.push(d); streak = 0; prevAlt = to != null ? N[to].alt : prevAlt; continue; }
    if (to < from) { d.probs.push({ kind: 'back' }); days.push(d); continue; }
    d.km = kmBetween(N, from, to); d.up = upBetween(N, from, to); d.h = hoursBetween(N, from, to);
    if (d.h > L.maxHours + 1e-9) d.probs.push({ kind: 'hours' });
    if (isFull(to, i + 1)) d.probs.push({ kind: 'full' });
    d.gain = effGain(prevAlt, N[to].alt); d.rise = N[to].alt - prevAlt;
    if (d.gain > RULE.maxGain) d.probs.push({ kind: 'gain' });
    if (N[to].alt > RULE.base && N[to].alt > prevAlt) streak++; else streak = 0;
    if (streak > RULE.maxGainingNights) d.probs.push({ kind: 'rest' });
    if (i === D - 1 && to === from) d.probs.push({ kind: 'noprogress' });
    prevAlt = N[to].alt; days.push(d);
  }
  return days;
}
const WHY = {
  hours: (d, L) => `🥵 ${d.h.toFixed(1)} h of walking is more than the ${L.maxHours} h you can do in daylight. You would arrive exhausted, or after dark.`,
  gain: d => `😵 You would sleep ${nf(d.gain)} m higher than last night. Above 3,000 m that is too fast: headaches, nausea and altitude sickness are likely (limit: ${RULE.maxGain} m).`,
  rest: () => `🛌 That is 4 nights in a row of sleeping higher. Guidelines say to take a rest day, with no climb in sleeping altitude, every 3–4 days.`,
  full: (d, L) => `🚫 The lodges in ${nodes()[d.to].name} are full that night.`,
  back: () => `↩️ This plan walks back down the trail. Pick a village further along.`,
  noprogress: () => `🚶 The last day has to take you forward to the end of the stretch.`
};

/* ---------- actions ---------- */
function startLevel(i) {
  lv = i; screen = 'game'; nights = Array(LEVELS[i].days - 1).fill(null); hist = []; won = false; msg = ''; ruleOpen = null;
  const q = new URLSearchParams(location.search);
  if (q.has('solved')) nights = LEVELS[i].solutions[0].map(idxOf);
  window.scrollTo(0, 0); render();
  if (q.has('solved')) return check();
  if (!save.seen && !q.has('seen')) { save.seen = true; persist(); showHow(); }
}
function pick(night, v) {
  if (won) return;
  if (isFull(v, night + 1)) { msg = `🚫 The lodges in ${nodes()[v].name} are full on night ${night + 1}.`; SND.bad(); return render(); }
  hist.push(nights.slice());
  nights[night] = nights[night] === v ? null : v; msg = ''; SND.pick();
  render(); check();
}
function check() {
  if (won || nights.some(v => v == null)) return;
  if (analyse().every(d => !d.probs.length)) win();
}
function undo() { if (!hist.length || won) return; nights = hist.pop(); msg = ''; SND.tap(); render(); }
function hint() {
  if (won) return;
  const sol = lvl().solutions[0].map(idxOf), k = sol.findIndex((v, i) => nights[i] !== v);
  if (k < 0) return;
  hist.push(nights.slice()); nights[k] = sol[k];
  msg = `💡 One valid plan sleeps in ${nodes()[sol[k]].name} on night ${k + 1}.`; SND.pick(); render(); check();
}
function toggleRule(k) { ruleOpen = ruleOpen === k ? null : k; SND.tap(); render(); }
function toggleMute() { save.mute = !save.mute; persist(); if (!save.mute) SND.tap(); render(); }
function win() {
  if (won) return; won = true; save.done[lv] = true;
  save.unlocked = Math.max(save.unlocked, Math.min(lv + 1, LEVELS.length - 1)); persist();
  render(); SND.win(); confetti(); buzz([30, 40, 30]);
  setTimeout(showWin, 650);
}
function confetti() {
  const em = ['🎉', '⭐', '🥾', '🏔️', '✨', '🎒'];
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div'); d.className = 'conf'; d.textContent = em[i % em.length];
    d.style.left = Math.random() * 100 + 'vw'; d.style.animationDelay = Math.random() * .8 + 's'; d.style.fontSize = (16 + Math.random() * 16) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 3600);
  }
}

/* ---------- render ---------- */
function render() { screen === 'home' ? renderHome() : screen === 'stages' ? renderStages() : renderGame(); }

function profileSVG(days) {
  const L = lvl(), N = nodes(), s = startI(), e = endI(), W = 340, H = 140, P = { l: 8, r: 8, t: 22, b: 14 };
  const sub = N.slice(s, e + 1), k0 = N[s].km, k1 = N[e].km, alts = sub.map(n => n.alt);
  const lo = Math.min(...alts, RULE.base - 100) - 120, hi = Math.max(...alts) + 160;
  const X = km => P.l + (km - k0) / (k1 - k0) * (W - P.l - P.r), Y = a => H - P.b - (a - lo) / (hi - lo) * (H - P.t - P.b);
  let svg = `<svg class="prof" viewBox="0 0 ${W} ${H}" role="img" aria-label="Elevation profile of the route">`;
  svg += `<defs><linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb8d4"/><stop offset="1" stop-color="#e9eef5"/></linearGradient></defs>`;
  svg += `<path d="M${X(sub[0].km)} ${H - P.b} ` + sub.map(n => `L${X(n.km)} ${Y(n.alt)}`).join(' ') + ` L${X(sub[sub.length - 1].km)} ${H - P.b}Z" fill="url(#mt)"/>`;
  if (RULE.base > lo && RULE.base < hi) svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(RULE.base)}" y2="${Y(RULE.base)}" stroke="#c0b59b" stroke-dasharray="4 3"/><text x="${W - P.r}" y="${Y(RULE.base) - 3}" text-anchor="end" font-size="8" fill="#8a7f68">3,000 m</text>`;
  svg += `<polyline points="${sub.map(n => `${X(n.km)},${Y(n.alt)}`).join(' ')}" fill="none" stroke="#5b6f8a" stroke-width="2" stroke-linejoin="round"/>`;
  days.forEach(d => { if (d.known && d.to >= d.from && d.to !== d.from) {
    const seg = N.slice(d.from, d.to + 1); svg += `<polyline points="${seg.map(n => `${X(n.km)},${Y(n.alt)}`).join(' ')}" fill="none" stroke="${d.probs.length ? '#d94a3d' : '#3f9b6a'}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`; } });
  sub.forEach(n => { svg += `<circle cx="${X(n.km)}" cy="${Y(n.alt)}" r="3.2" fill="#fff" stroke="#5b6f8a" stroke-width="1.5"/>`; });
  nights.forEach((v, i) => { if (v != null) svg += `<g><circle cx="${X(N[v].km)}" cy="${Y(N[v].alt) - 12}" r="8" fill="#3d4f66"/><text x="${X(N[v].km)}" y="${Y(N[v].alt) - 9}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${i + 1}</text></g>`; });
  svg += `<text x="${X(N[s].km)}" y="${Y(N[s].alt) - 8}" font-size="12" text-anchor="start">🚩</text><text x="${X(N[e].km) - 2}" y="${Y(N[e].alt) - 8}" font-size="12" text-anchor="end">🏁</text>`;
  return svg + '</svg>';
}

function renderGame() {
  const L = lvl(), N = nodes(), s = startI(), e = endI(), days = analyse(), T = TREKS[L.trek];
  setBg(T.photos[lv % T.photos.length].file);
  const cols = []; for (let v = s; v < e; v++) cols.push(v);
  const guide = `<table class="guide"><tr><th>VILLAGE</th><th>HEIGHT</th><th>FROM THE ONE BEFORE</th></tr>` + N.slice(s, e + 1).map((n, k) => {
    const v = s + k; return `<tr><td>${esc(n.name)}</td><td>${nf(n.alt)} m</td><td class="dim">${k ? `${(n.km - N[v - 1].km).toFixed(1)} km · ↑${nf(upBetween(N, v - 1, v))} m · ${hoursBetween(N, v - 1, v).toFixed(1)} h` : 'start'}</td></tr>`; }).join('') + '</table>';
  const grid = `<table class="grid"><tr><th></th>${cols.map(v => `<th class="col"><span>${esc(N[v].name)}</span><small>${nf(N[v].alt)}</small></th>`).join('')}</tr>` +
    nights.map((sel, i) => `<tr><th class="row">Night ${i + 1}</th>${cols.map(v => {
      const full = isFull(v, i + 1), prev = i === 0 ? s : nights[i - 1], chosen = sel === v, bad = chosen && (days[i].probs.length || days[i + 1].probs.length);
      const cls = ['cellb', chosen ? 'sel' : '', full ? 'full' : '', prev != null && v < prev ? 'back' : '', bad ? 'bad' : ''].join(' ');
      return `<td><button class="${cls}" onclick="pick(${i},${v})" aria-label="Night ${i + 1}: ${esc(N[v].name)}">${full ? '🚫' : chosen ? '🌙' : ''}</button></td>`; }).join('')}</tr>`).join('') + '</table>';
  const dayCards = days.map(d => {
    if (!d.known) return `<div class="day"><span class="dn">Day ${d.i + 1}</span><span class="meta">${d.from != null ? esc(N[d.from].name) : '…'} → ${d.to != null ? esc(N[d.to].name) : '…'}: pick the nights above.</span></div>`;
    const why = d.probs.map(p => `<span class="why">${WHY[p.kind](d, L)}</span>`).join('');
    const meta = d.km != null ? `${d.km.toFixed(1)} km · ↑${nf(d.up)} m · ${d.h.toFixed(1)} h · sleep at ${nf(N[d.to].alt)} m (${d.rise >= 0 ? '+' : '−'}${nf(Math.abs(d.rise))} m)` : '';
    return `<div class="day ${d.probs.length ? 'bad' : 'ok'}"><span class="dn">Day ${d.i + 1}</span><span><b>${d.from === d.to ? '🛌 Rest day in ' + esc(N[d.to].name) : esc(N[d.from].name) + ' → ' + esc(N[d.to].name)}</b><span class="meta"> · ${meta}</span>${why}</span></div>`; }).join('');
  const fullTxt = L.full.length ? ` Lodges full: ${L.full.map(([id, n]) => `${esc(N[idxOf(id)].name)} on night ${n}`).join('; ')}.` : '';
  $app.innerHTML = `
    <div class="top">
      <button class="ib" onclick="goStages()">←</button>
      <h1>${esc(L.title)}<small>Climb High, Sleep Low · ${esc(T.name)}</small></h1>
      <button class="ib" onclick="undo()" ${hist.length && !won ? '' : 'disabled'}>↶</button>
      <button class="ib" onclick="hint()">💡</button>
      <button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button>
    </div>
    <div class="panel">
      <div class="goal">Hike from <b>${esc(N[s].name)}</b> (${nf(N[s].alt)} m) to <b>${esc(N[e].name)}</b> (${nf(N[e].alt)} m) in <b>${L.days} days</b>. Choose where to sleep on each of the first ${L.days - 1} night${L.days > 2 ? 's' : ''}.${fullTxt}</div>
      <div class="rules">
        <button class="rchip ${ruleOpen === 'hours' ? 'on' : ''}" onclick="toggleRule('hours')">⏱ ${L.maxHours} h a day</button>
        <button class="rchip ${ruleOpen === 'gain' ? 'on' : ''}" onclick="toggleRule('gain')">⛰ +500 m a night</button>
        <button class="rchip ${ruleOpen === 'rest' ? 'on' : ''}" onclick="toggleRule('rest')">🛌 Rest every 4th night</button>
      </div>
      ${ruleOpen ? `<div class="rtext">${esc(RULE_TEXT[ruleOpen])}</div>` : ''}
    </div>
    <div class="panel">${profileSVG(days)}${guide}</div>
    <div class="panel"><div class="sect">WHERE DO YOU SLEEP?</div>${grid}<div class="msg">${esc(msg)}</div>${dayCards}</div>
    <div class="foot">${esc(route().note)}</div>`;
}
const RULE_TEXT = {
  hours: 'You can walk for this many hours a day (a simple estimate from distance and climbing) before you run out of daylight and energy.',
  gain: 'Once you are above 3,000 m, your sleeping altitude should rise by no more than about 500 m per night. Only the part above 3,000 m counts. (Wilderness Medical Society guidance.)',
  rest: 'Above 3,000 m, take a rest day every 3–4 days: a night where you do not sleep any higher than the night before. So you can gain sleeping altitude three nights in a row, but not four.'
};

function renderHome() {
  setBg(null);
  const soon = (title, sub, photo) => `<button class="gcard soon" style="background-image:url(${photo})" onclick="soonMsg('${esc(title)}')"><div class="shade"></div><span class="pill">🔒 Coming soon</span><div class="txt"><h3>${title}</h3><p>${sub}</p></div></button>`;
  const done = Object.keys(save.done).length;
  $app.innerHTML = `<div class="hero"><h1>🥾 Trail Pack</h1><p>Little hiking puzzles, with real treks, real photos and real facts.</p></div>
    <button class="gcard" style="background-image:url(${TREKS.ebc.photos[0].file})" onclick="goStages()"><div class="shade"></div><span class="pill">${done}/${LEVELS.length} solved</span>
      <div class="txt"><h3>⛰️ Climb High, Sleep Low</h3><p>Plan the nights on the Everest Base Camp trek without getting altitude sickness.</p></div></button>
    ${soon('🎒 Pack Fit', 'Fit gear into the pack: needs, limits and things that can’t touch.', TREKS.inca.photos[1].file)}
    ${soon('🗺️ Contour Route', 'Read the contour lines and find the safe way up.', TREKS.tmb.photos[0].file)}
    ${soon('🔤 Trail Words', 'Find the hiking words, and learn what they mean.', TREKS.paine.photos[0].file)}
    <div class="row"><button class="btn" onclick="showHow()">How to play</button><button class="btn" onclick="toggleMute()">${save.mute ? '🔇 Sound off' : '🔊 Sound on'}</button></div>`;
}
function soonMsg(t) { SND.tap(); overlay(`<div class="pad"><h2>${t}</h2><p>Coming soon. We are building one mini-game at a time, starting with Climb High, Sleep Low.</p><div class="row"><button class="btn primary" onclick="closeOverlay()">OK</button></div></div>`); }

function renderStages() {
  const T = TREKS.ebc, ph = T.photos[0]; setBg(ph.file);
  const stages = LEVELS.map((L, i) => {
    const locked = i > save.unlocked, N = ROUTES[L.trek].nodes, a = N.find(n => n.id === L.start), b = N.find(n => n.id === L.end);
    return `<button class="stage ${locked ? 'locked' : ''}" ${locked ? '' : `onclick="startLevel(${i})"`}>
      <span class="n">${locked ? '🔒' : i + 1}</span>
      <span class="t"><b>${esc(L.title)}</b><span>${L.days} days · ${nf(a.alt)} m → ${nf(b.alt)} m</span></span>
      <span class="st">${save.done[i] ? '✓' : ''}</span></button>`; }).join('');
  $app.innerHTML = `
    <div class="top"><button class="ib" onclick="goHome()">←</button><h1>Climb High, Sleep Low<small>${esc(T.name)}, Nepal</small></h1><button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button></div>
    <div class="thead" style="background-image:url(${ph.file})"><div class="shade"></div><div class="txt"><h2>${esc(T.name)}</h2><p>${esc(T.place)} · ${esc(T.alt)}</p></div></div>
    ${creditHTML(ph.file)}${stages}`;
}

/* ---------- overlays & navigation ---------- */
function overlay(html, dismiss = true) { $layer.innerHTML = `<div class="overlay" ${dismiss ? 'onclick="if(event.target===this)closeOverlay()"' : ''}><div class="modal">${html}</div></div>`; }
function closeOverlay() { $layer.innerHTML = ''; }
function goHome() { screen = 'home'; closeOverlay(); render(); window.scrollTo(0, 0); }
function goStages() { screen = 'stages'; closeOverlay(); render(); window.scrollTo(0, 0); }

function showHow() {
  overlay(`<div class="pad"><h2>Climb High, Sleep Low</h2>
    <p style="font-size:14px;line-height:1.5;margin-top:0">Hikers on high treks can get altitude sickness if their sleeping altitude rises too fast. Plan the nights of a real trek so you stay safe and still reach the end.</p>
    <ol class="how">
      <li>Tap a square to choose where you <b>sleep</b> on each night. Tap it again to undo.</li>
      <li>Use the <b>village table</b> to check heights, distances and walking time.</li>
      <li>Follow the <b>rules</b>: a limit on hours per day, no more than +500 m of sleeping altitude a night above 3,000 m, and a rest night after three nights of climbing.</li>
      <li>Some lodges are <b>full</b> on some nights (🚫).</li>
      <li>Each day shows ✅ or tells you what would go wrong on the real trail.</li>
    </ol><button class="btn primary" style="width:100%" onclick="closeOverlay()">Let’s go</button></div>`);
}
const TIPS = [
  ['CLIMB HIGH, SLEEP LOW', 'Your body adapts to the altitude where you sleep. So you can walk higher during the day, as long as you come back down to sleep and raise your sleeping altitude slowly.'],
  ['THE 500 M RULE', 'Above 3,000 m, guidelines suggest raising your sleeping altitude by no more than about 500 m per night.'],
  ['REST DAYS', 'Above 3,000 m, take a rest day, with no increase in sleeping altitude, every 3–4 days.'],
  ['EXTRA NIGHTS', 'The CDC suggests one extra night to acclimatise for every 1,000 m of sleeping altitude you gain.']
];
function showWin() {
  const L = lvl(), T = TREKS[L.trek], ph = T.photos[lv % T.photos.length], tip = TIPS[lv % TIPS.length], fact = route().facts[lv % route().facts.length], last = lv === LEVELS.length - 1;
  overlay(`<div class="photo" style="background-image:url(${ph.file})"><div class="cap">${esc(ph.caption)}</div></div>
    <div class="pad">
      <h2 style="text-align:center">Safe plan! ✅</h2>
      <div class="tip"><b>RANGER TIP · ${tip[0]}</b>${esc(tip[1])}</div>
      <div class="fact"><b>FUN FACT</b>${esc(fact)}</div>
      ${creditHTML(ph.file, true)}
      <div class="row" style="margin-top:14px">
        <button class="btn" onclick="closeOverlay();startLevel(lv)">Replay</button>
        <button class="btn" onclick="goStages()">Stages</button>
        ${last ? '' : '<button class="btn primary" onclick="closeOverlay();startLevel(lv+1)">Next stage →</button>'}
      </div></div>`, false);
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
