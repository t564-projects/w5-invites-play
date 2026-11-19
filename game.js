/* Trail Pack: a Meowdoku-style logic puzzle on a hiking backpack. */
const { ITEMS, RULES, TREKS } = DATA;
const $app = document.getElementById('app'), $layer = document.getElementById('layer'), $bg = document.getElementById('bg');
const PAL = ['#e8956b', '#7fae7a', '#6f94c0', '#d3ad5e', '#b583b9', '#dc7d90', '#62aea8', '#a39a6e'];

/* ---------- save ---------- */
let save = { unlocked: 0, best: {}, seen: false, mute: false, assist: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('trailpack3') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('trailpack3', JSON.stringify(save)); } catch (e) {} };

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
  mark: () => tone(440, .05, 'sine', .08),
  place: () => { tone(330, .08, 'triangle'); tone(495, .1, 'triangle', .12, .06); buzz(10); },
  bad: () => { tone(190, .22, 'sawtooth', .07); buzz(50); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .13, i * .12))
};

/* ---------- rules (same as tools/gen.js) ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const has = (id, t) => ITEMS[id].tags.includes(t);
const one = (x, y) => (has(x, 'food') && has(y, 'smelly')) || (has(x, 'wet') && (has(y, 'electronic') || has(y, 'down'))) || ((has(x, 'sharp') || has(x, 'hot')) && has(y, 'soft'));
const incompat = (a, b) => one(a, b) || one(b, a);
const weightOk = (id, r, N) => { const mid = Math.floor(N / 2), w = ITEMS[id].weight; return w === 'H' ? r >= mid : w === 'L' ? r <= mid : true; };
const trekLevels = id => LEVELS.map((_, i) => i).filter(i => LEVELS[i].trek === id);
const fmt = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const creditHTML = (file, dark) => {
  const c = CREDITS[file.split('/').pop()]; if (!c) return '';
  return `<p class="credit ${dark ? 'dark' : ''}">Photo: ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons</p>`;
};
const photoFor = (trek, k) => TREKS[trek].photos[k % TREKS[trek].photos.length];
const setBg = file => { $bg.style.backgroundImage = file ? `url(${file})` : 'none'; };

/* ---------- state ---------- */
// marks[x]: 0 empty, 1 = ✕ (can't be here), 2 = gear placed, 3 = gear pinned by a hint
let screen = 'home', curTrek = null, lv = 0;
let marks = [], hist = [], startedAt = 0, penalty = 0, hints = 0, won = false, msg = '', msgKind = '', ruleOpen = null, timerId = null;
const lvl = () => LEVELS[lv];

/* ---------- checking ---------- */
function analyse() {
  const L = lvl(), N = L.N, bad = new Set(), why = [];
  const placed = []; marks.forEach((m, x) => { if (m >= 2) placed.push(x); });
  const nm = x => { const it = ITEMS[L.items[L.region[x]]]; return `${it.e} ${it.name}`; };
  const flag = (x, y, t) => { bad.add(x); if (y != null) bad.add(y); why.push(t); };
  placed.forEach((x, i) => {
    const r = Math.floor(x / N), c = x % N, id = L.items[L.region[x]];
    if (L.weight && !weightOk(id, r, N)) flag(x, null, `${nm(x)} is ${ITEMS[id].weight === 'H' ? 'heavy. It belongs in the bottom half of the pack.' : 'light. It belongs in the top half of the pack.'}`);
    for (const y of placed.slice(i + 1)) {
      const r2 = Math.floor(y / N), c2 = y % N, id2 = L.items[L.region[y]];
      if (L.region[x] === L.region[y]) flag(x, y, 'A pocket can only hold one item.');
      else if (r === r2) flag(x, y, `${nm(x)} and ${nm(y)} are in the same row.`);
      else if (c === c2) flag(x, y, `${nm(x)} and ${nm(y)} are in the same column.`);
      else if (Math.abs(r - r2) === 1 && Math.abs(c - c2) === 1 && incompat(id, id2)) flag(x, y, `${nm(x)} can’t touch ${nm(y)}, even diagonally.`);
    }
  });
  return { placed, bad, why };
}

/* ---------- timer ---------- */
const elapsed = () => (startedAt ? Date.now() - startedAt : 0) + penalty;
function startTimer() { if (startedAt || won) return; startedAt = Date.now(); }
function tickTimer() { const el = document.getElementById('timer'); if (el) el.textContent = fmt(elapsed()); }

/* ---------- actions ---------- */
function startLevel(i) {
  lv = i; curTrek = lvl().trek; screen = 'game';
  marks = Array(lvl().N * lvl().N).fill(0); hist = []; startedAt = 0; penalty = 0; hints = 0; won = false; msg = ''; msgKind = ''; ruleOpen = null;
  const q = new URLSearchParams(location.search);
  if (q.has('solved')) { // debug: pre-place the stored solution (all of it, or the first N pockets)
    const n = q.get('solved') ? +q.get('solved') : 99;
    lvl().solution.slice(0, n).forEach(([r, c]) => marks[r * lvl().N + c] = 2);
    if (n >= lvl().N) { render(); return finishIfSolved(); }
  }
  window.scrollTo(0, 0); render();
  if (!save.seen && !q.has('seen')) { save.seen = true; persist(); showHow(); }
}
const snap = () => hist.push(marks.slice());
function tapCell(x) {
  if (won) return;
  if (marks[x] === 3) { setMsg('📌 A hint pinned that one. It is correct.', 'hint'); SND.tap(); return render(); }
  startTimer(); snap();
  marks[x] = (marks[x] + 1) % 3;
  if (marks[x] === 1) SND.mark();
  if (marks[x] === 2) { SND.place(); if (save.assist) autoMark(x); } else SND.tap();
  setMsg('');
  const a = analyse();
  if (marks[x] === 2 && a.bad.has(x)) { setMsg(a.why[0]); SND.bad(); }
  render(); finishIfSolved();
}
// assist mode: cross out the cells a new gear item rules out
function autoMark(x) {
  const L = lvl(), N = L.N, r = Math.floor(x / N), c = x % N, k = L.region[x], id = L.items[k];
  for (let y = 0; y < N * N; y++) {
    if (y === x || marks[y] !== 0) continue;
    const r2 = Math.floor(y / N), c2 = y % N, k2 = L.region[y];
    if (r2 === r || c2 === c || k2 === k || (Math.abs(r - r2) === 1 && Math.abs(c - c2) === 1 && incompat(id, L.items[k2]))) marks[y] = 1;
  }
}
function finishIfSolved() {
  const a = analyse();
  if (a.placed.length === lvl().N && !a.bad.size) win();
}
function setMsg(t, k = '') { msg = t; msgKind = k; }
function undo() { if (!hist.length || won) return; marks = hist.pop(); setMsg(''); SND.tap(); render(); }
function reset() { startLevel(lv); }
function hint() {
  if (won) return;
  const L = lvl(), N = L.N, wrong = [];
  L.solution.forEach(([r, c], k) => { if (marks[r * N + c] < 2) wrong.push(k); });
  if (!wrong.length) return setMsg('Everything is placed. Check the red ones.', 'hint'), render();
  startTimer(); snap();
  const k = wrong[Math.floor(Math.random() * wrong.length)], [r, c] = L.solution[k];
  marks.forEach((m, x) => { if (L.region[x] === k && m === 2) marks[x] = 0; }); // clear a wrong gear in that pocket
  marks[r * N + c] = 3; hints++; penalty += 30000;
  const it = ITEMS[L.items[k]]; setMsg(`💡 Pinned the ${it.e} ${it.name} in its pocket. +30 seconds.`, 'hint'); SND.place();
  render(); finishIfSolved();
}
function toggleRule(k) { ruleOpen = ruleOpen === k ? null : k; SND.tap(); render(); }
function toggleMute() { save.mute = !save.mute; persist(); if (!save.mute) SND.tap(); render(); }
function toggleAssist() { save.assist = !save.assist; persist(); SND.tap(); render(); }

function win() {
  if (won) return; won = true;
  const t = elapsed(), prev = save.best[lv], isBest = !prev || t < prev;
  if (isBest) save.best[lv] = t;
  save.unlocked = Math.max(save.unlocked, Math.min(lv + 1, LEVELS.length - 1)); persist();
  render(); SND.win(); confetti(); buzz([30, 40, 30]);
  setTimeout(() => showWin(t, isBest, prev), 650);
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
function render() { clearInterval(timerId); screen === 'home' ? renderHome() : screen === 'trek' ? renderTrek() : renderGame(); }

function boardHTML(a) {
  const L = lvl(), N = L.N, R = L.region; let h = ''; const seen = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = r * N + c, k = R[x], cls = ['bcell'];
    const et = r === 0 || R[x - N] !== k, eb = r === N - 1 || R[x + N] !== k, el = c === 0 || R[x - 1] !== k, er = c === N - 1 || R[x + 1] !== k;
    if (et) cls.push('et'); if (eb) cls.push('eb'); if (el) cls.push('el'); if (er) cls.push('er');
    if (et && el) cls.push('tl'); if (et && er) cls.push('tr'); if (eb && el) cls.push('bl'); if (eb && er) cls.push('br');
    if (marks[x] >= 2 && a.bad.has(x)) cls.push('bad'); if (marks[x] === 3) cls.push('pinned');
    const it = ITEMS[L.items[k]];
    let badge = ''; if (!seen.has(k)) { seen.add(k); badge = `<span class="badge">${it.e}</span>`; }
    const inner = marks[x] >= 2 ? `<span class="gem">${it.e}</span>${marks[x] === 3 ? '<span class="pinmark">📌</span>' : ''}` : marks[x] === 1 ? '<span class="xm">✕</span>' : '';
    h += `<div class="${cls.join(' ')}" style="background:${PAL[k % PAL.length]}" onclick="tapCell(${x})">${badge}${inner}</div>`;
  }
  const guide = L.weight ? '<div class="wguide"><span>▲</span><span style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:9px;letter-spacing:1px">LIGHT ↔ HEAVY</span><span>▼</span></div>' : '';
  return `<div class="boardwrap">${guide}<div class="board" style="--n:${N}">${h}</div></div>`;
}

function renderGame() {
  const L = lvl(), T = TREKS[L.trek], k = trekLevels(L.trek).indexOf(lv), a = analyse();
  setBg(photoFor(L.trek, k).file);
  const placedK = new Set(a.placed.map(x => L.region[x]));
  const legend = L.items.map((id, i) => { const it = ITEMS[id];
    return `<span class="lchip ${placedK.has(i) ? 'done' : ''}" style="--c:${PAL[i % PAL.length]}"><span class="sw"></span>${it.e} ${esc(it.name)}<span class="wt">${it.weight === 'H' ? '▼' : it.weight === 'L' ? '▲' : ''}</span></span>`; }).join('');
  const rules = ['pocket', 'line', 'touch'].concat(L.weight ? ['weight'] : []);
  const chips = rules.map(r => `<button class="rchip ${ruleOpen === r ? 'on' : ''}" onclick="toggleRule('${r}')">${RULES[r].icon} ${RULES[r].title}</button>`).join('');
  const pairs = []; L.items.forEach((x, i) => L.items.forEach((y, j) => { if (j > i && incompat(x, y)) pairs.push(`<span class="pair">${ITEMS[x].e}✕${ITEMS[y].e}</span>`); }));
  const best = save.best[lv];
  $app.innerHTML = `
    <div class="top">
      <button class="ib" onclick="goTrek('${L.trek}')">←</button>
      <h1>${esc(T.name)}<small>${esc(L.title)} · ${L.N}×${L.N} pack</small></h1>
      <button class="ib" onclick="undo()" ${hist.length && !won ? '' : 'disabled'}>↶</button>
      <button class="ib" onclick="hint()">💡</button>
      <button class="ib ${save.assist ? 'on' : ''}" onclick="toggleAssist()" title="Auto ✕">🪄</button>
      <button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button>
    </div>
    <div class="stats"><span>⏱ <span id="timer">${fmt(elapsed())}</span></span><span>${best ? '🏆 Best ' + fmt(best) : 'No best time yet'}</span></div>
    <div class="panel">
      <div class="rules">${chips}</div>
      ${ruleOpen ? `<div class="rtext">${esc(RULES[ruleOpen].text)}</div>` : ''}
      <div class="pairs">${pairs.length ? `Can’t touch: ${pairs.join('')}` : 'In this pack, every item can touch.'}</div>
      <div class="msg ${msgKind}">${esc(msg || (a.bad.size ? a.why[0] : ''))}</div>
    </div>
    ${boardHTML(a)}
    <div class="legend">${legend}</div>
    <div class="tip">Tap a square once for ✕ (can’t be here), twice to place the gear, three times to clear.${save.assist ? ' 🪄 Auto ✕ is on.' : ''}</div>`;
  if (startedAt && !won) timerId = setInterval(tickTimer, 500);
}

function trekProgress(id) {
  const idx = trekLevels(id), done = idx.filter(i => save.best[i]).length;
  return { done, total: idx.length, locked: idx[0] > save.unlocked };
}
function renderHome() {
  setBg(null);
  const keys = Object.keys(TREKS);
  const cards = keys.map((id, n) => {
    const T = TREKS[id], p = trekProgress(id), prev = keys[n - 1];
    return `<button class="tcard ${p.locked ? 'locked' : ''}" style="background-image:url(${T.photos[0].file})" onclick="${p.locked ? `lockedMsg('${prev}')` : `goTrek('${id}')`}">
      <div class="shade"></div><span class="pill">${p.locked ? '🔒 Locked' : `${p.done}/${p.total} solved`}</span>
      <div class="txt"><h3>${esc(T.name)}</h3><p>${esc(T.place)} · ${esc(T.alt)}</p></div></button>`;
  }).join('');
  $app.innerHTML = `<div class="hero"><h1>🥾 Trail Pack</h1><p>A logic puzzle: pack the backpack for the world’s great treks.</p></div>${cards}
    <div class="row"><button class="btn" onclick="showHow()">How to play</button><button class="btn" onclick="toggleMute()">${save.mute ? '🔇 Sound off' : '🔊 Sound on'}</button></div>`;
}
function lockedMsg(prev) { SND.bad(); overlay(`<div class="pad"><h2>🔒 Not yet</h2><p>Solve every stage of <b>${esc(TREKS[prev].name)}</b> first.</p><div class="row"><button class="btn primary" onclick="closeOverlay()">OK</button></div></div>`); }

function renderTrek() {
  const T = TREKS[curTrek], idx = trekLevels(curTrek), ph = T.photos[0];
  setBg(ph.file);
  const stages = idx.map((i, k) => {
    const L = LEVELS[i], locked = i > save.unlocked, b = save.best[i];
    return `<button class="stage ${locked ? 'locked' : ''}" ${locked ? '' : `onclick="startLevel(${i})"`}>
      <span class="n" style="background:${T.color}">${locked ? '🔒' : k + 1}</span>
      <span class="t"><b>${esc(L.title)}</b><span>${L.N}×${L.N} pack · ${L.N} gear items${L.tier >= 3 ? ' · expert' : L.tier === 2 ? ' · medium' : ' · easy'}</span></span>
      <span class="st">${b ? '✓ ' + fmt(b) : ''}</span></button>`;
  }).join('');
  $app.innerHTML = `
    <div class="top"><button class="ib" onclick="goHome()">←</button><h1>${esc(T.name)}</h1><button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button></div>
    <div class="thead" style="background-image:url(${ph.file})"><div class="shade"></div><div class="txt"><h2>${esc(T.name)}</h2><p>${esc(T.place)} · ${esc(T.alt)}</p></div></div>
    ${creditHTML(ph.file)}
    ${stages}`;
}

/* ---------- overlays & navigation ---------- */
function overlay(html, dismiss = true) { $layer.innerHTML = `<div class="overlay" ${dismiss ? 'onclick="if(event.target===this)closeOverlay()"' : ''}><div class="modal">${html}</div></div>`; }
function closeOverlay() { $layer.innerHTML = ''; }
function goHome() { screen = 'home'; closeOverlay(); render(); window.scrollTo(0, 0); }
function goTrek(id) { curTrek = id; screen = 'trek'; closeOverlay(); render(); window.scrollTo(0, 0); }

function showHow() {
  overlay(`<div class="pad"><h2>How to play</h2>
    <ol class="how">
      <li><b>One gear item in every coloured pocket.</b> The tags under the pack say which item belongs to which colour. Each pocket also shows its item in the corner.</li>
      <li><b>One per row and one per column.</b> That spreads the weight across the pack.</li>
      <li><b>Keep enemies apart.</b> Gear that doesn’t get along can’t touch, even diagonally (the red pairs list which).</li>
      <li><b>Heavy low, light high</b> (when you see the ▲▼ bar): ▼ gear in the bottom half, ▲ gear in the top half.</li>
      <li><b>Tap once for ✕</b> to note a square where gear can’t go. <b>Tap twice</b> to place it. Every puzzle has one answer you can reach by logic alone, no guessing.</li>
    </ol><button class="btn primary" style="width:100%" onclick="closeOverlay()">Let’s pack</button></div>`);
}
function showWin(t, isBest, prev) {
  const L = lvl(), T = TREKS[L.trek], idx = trekLevels(L.trek), k = idx.indexOf(lv);
  const ph = photoFor(L.trek, k), lastInTrek = k === idx.length - 1, lastAll = lv === LEVELS.length - 1;
  overlay(`<div class="photo" style="background-image:url(${ph.file})"><div class="cap">${esc(ph.caption)}</div></div>
    <div class="pad">
      <h2 style="text-align:center">${lastInTrek ? `${esc(T.name)} complete! 🚩` : 'Pack ready!'}</h2>
      <div class="bigtime">⏱ ${fmt(t)}</div>
      <div class="sub">${isBest ? (prev ? `<b>New best!</b> Previous best ${fmt(prev)}.` : '<b>First solve!</b>') : `Best ${fmt(prev)}.`}${hints ? ` ${hints} hint${hints > 1 ? 's' : ''} used (+${hints * 30}s).` : ''}</div>
      <div class="fact"><b>FUN FACT</b>${esc(T.facts[k % T.facts.length])}</div>
      ${creditHTML(ph.file, true)}
      <div class="row" style="margin-top:14px">
        <button class="btn" onclick="closeOverlay();startLevel(lv)">Replay</button>
        <button class="btn" onclick="goTrek('${L.trek}')">Stages</button>
        ${lastAll ? '' : `<button class="btn primary" onclick="${lastInTrek ? 'goHome()' : 'closeOverlay();startLevel(lv+1)'}">${lastInTrek ? 'Next trek →' : 'Next stage →'}</button>`}
      </div></div>`, false);
}

/* ---------- boot ---------- */
(function boot() {
  const q = new URLSearchParams(location.search);
  if (q.has('unlock')) save.unlocked = LEVELS.length - 1;
  if (q.has('noanim')) document.head.insertAdjacentHTML('beforeend', '<style>*{animation:none!important}</style>'); // debug: for screenshots
  if (q.has('lv')) return startLevel(+q.get('lv'));
  if (q.has('trek')) return goTrek(q.get('trek'));
  render();
})();
