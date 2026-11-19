/* Trail Pack: placement puzzle. Pack the backpack for a real trek. */
const { ZONES, ZONE_NAMES, ITEMS, RULES, TREKS } = DATA;
const R = ZONES.length, C = ZONES[0].length;
const $app = document.getElementById('app'), $layer = document.getElementById('layer'), $bg = document.getElementById('bg');

/* ---------- save ---------- */
let save = { unlocked: 0, stars: {}, seen: false, mute: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('trailpack2') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('trailpack2', JSON.stringify(save)); } catch (e) {} };

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
  tap: () => tone(620, .05, 'triangle'),
  place: () => { tone(330, .08, 'triangle'); tone(495, .1, 'triangle', .12, .06); buzz(10); },
  lift: () => tone(440, .06, 'sine', .08),
  bad: () => { tone(190, .22, 'sawtooth', .07); buzz(50); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .13, i * .12))
};

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const trekLevels = id => LEVELS.map((_, i) => i).filter(i => LEVELS[i].trek === id);
const has = (id, t) => ITEMS[id].tags.includes(t);

function ruleBetween(a, b, rules) {
  const one = (x, y) => {
    if (rules.includes('food') && has(x, 'food') && has(y, 'smelly')) return 'food';
    if (rules.includes('wet') && has(x, 'wet') && (has(y, 'electronic') || has(y, 'down'))) return 'wet';
    if (rules.includes('sharp') && (has(x, 'sharp') || has(x, 'hot')) && has(y, 'soft')) return 'sharp';
    return null;
  };
  return one(a, b) || one(b, a);
}
const creditHTML = (file, dark) => {
  const c = CREDITS[file.split('/').pop()];
  if (!c) return '';
  return `<p class="credit ${dark ? 'dark' : ''}">Photo: ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons</p>`;
};
const photoFor = (trek, k) => TREKS[trek].photos[k % TREKS[trek].photos.length];
const setBg = file => { $bg.style.backgroundImage = file ? `url(${file})` : 'none'; };

/* ---------- state ---------- */
let screen = 'home', curTrek = null, lv = 0;
let placed = [], sel = null, rot = 0, hist = [], actions = 0, hinted = false, won = false, msg = '', msgKind = '', ruleOpen = null;

const lvl = () => LEVELS[lv];
const cellsOf = (id, r, c, rt) => ITEMS[id].size === 1 ? [[r, c]] : rt ? [[r, c], [r + 1, c]] : [[r, c], [r, c + 1]];
const remaining = id => lvl().manifest[id] - placed.filter(p => p.id === id).length;
const blockedSet = () => new Set(lvl().blocked.map(([r, c]) => r * C + c));

function occupancy() {
  const g = new Map();
  placed.forEach((p, i) => cellsOf(p.id, p.r, p.c, p.rot).forEach(([r, c]) => g.set(r * C + c, i)));
  return g;
}
function check(id, r, c, rt) { // can the item physically go here? (rule breaks are allowed but flagged red)
  const cells = cellsOf(id, r, c, rt), blocked = blockedSet(), occ = occupancy(), it = ITEMS[id];
  for (const [rr, cc] of cells) if (rr < 0 || cc < 0 || rr >= R || cc >= C) return { ok: false, why: `The ${it.name.toLowerCase()} doesn\u2019t fit there.` };
  for (const [rr, cc] of cells) {
    if (blocked.has(rr * C + cc)) return { ok: false, why: 'That spot is jammed shut. Pick another.' };
    if (occ.has(rr * C + cc)) return { ok: false, why: 'Something is already there.' };
  }
  return { ok: true, cells };
}
// per-item problems: wrong pocket, or heavy/light in the wrong rows
function itemIssues() {
  const out = [], rules = lvl().rules;
  placed.forEach((p, i) => {
    const it = ITEMS[p.id];
    for (const [rr, cc] of cellsOf(p.id, p.r, p.c, p.rot)) {
      if (!it.zones.includes(ZONES[rr][cc])) { out.push({ i, msg: `${it.e} ${it.name} doesn\u2019t go in the ${ZONE_NAMES[ZONES[rr][cc]].toLowerCase()}.` }); break; }
      if (rules.includes('weight') && it.weight === 'H' && rr < 2) { out.push({ i, msg: `${it.e} ${it.name} is heavy. Keep it in the bottom three rows.` }); break; }
      if (rules.includes('weight') && it.weight === 'L' && rr > 2) { out.push({ i, msg: `${it.e} ${it.name} is light. Keep it out of the bottom two rows.` }); break; }
    }
  });
  return out;
}
function conflicts() {
  const out = [], occ = occupancy(), rules = lvl().rules, seen = new Set();
  placed.forEach((p, i) => cellsOf(p.id, p.r, p.c, p.rot).forEach(([r, c]) => {
    [[1, 0], [0, 1]].forEach(([dr, dc]) => {
      const j = occ.get((r + dr) * C + (c + dc));
      if (j === undefined || j === i || r + dr >= R || c + dc >= C) return;
      const rule = ruleBetween(p.id, placed[j].id, rules), key = Math.min(i, j) + '-' + Math.max(i, j);
      if (rule && !seen.has(key)) { seen.add(key); out.push({ a: i, b: j, rule }); }
    });
  }));
  return out;
}
/* ---------- actions ---------- */
const snap = () => hist.push(JSON.stringify({ placed, sel, rot }));
function startLevel(i) {
  lv = i; curTrek = lvl().trek; screen = 'game';
  placed = (lvl().fixed || []).map(f => {
    const r = Math.min(...f.cells.map(x => x[0])), c = Math.min(...f.cells.map(x => x[1]));
    return { id: f.id, r, c, rot: f.cells.length > 1 && f.cells[0][1] === f.cells[1][1] ? 1 : 0, fixed: true };
  });
  sel = null; rot = 0; hist = []; actions = 0; hinted = false; won = false; ruleOpen = null;
  msg = ''; msgKind = '';
  const first = Object.keys(lvl().manifest)[0]; sel = first;
  const dbg = new URLSearchParams(location.search);
  if (dbg.has('solved')) { // debug: pre-place the stored solution (all of it, or the first N items)
    const n = dbg.get('solved') ? +dbg.get('solved') : 99;
    const fk = new Set((lvl().fixed || []).map(f => f.id + JSON.stringify(f.cells)));
    placed = placed.concat(lvl().solution.filter(s => !fk.has(s.id + JSON.stringify(s.cells))).slice(0, n).map(s => {
      const cells = s.cells, r = Math.min(...cells.map(x => x[0])), c = Math.min(...cells.map(x => x[1]));
      return { id: s.id, r, c, rot: cells.length > 1 && cells[0][1] === cells[1][1] ? 1 : 0 };
    }));
    sel = Object.keys(lvl().manifest).find(k => remaining(k) > 0) || null;
  }
  window.scrollTo(0, 0);
  if (dbg.has('solved') && !Object.keys(lvl().manifest).some(k => remaining(k) > 0)) return afterPlace();
  render();
  if (!save.seen && !dbg.has('seen')) { save.seen = true; persist(); showHow(); }
}
function setMsg(t, k = '') { msg = t; msgKind = k; }
function pick(id) {
  if (won || remaining(id) <= 0) return;
  sel = sel === id ? null : id; if (ITEMS[id].size === 2 && sel) { /* keep rotation */ }
  setMsg(''); SND.tap(); render();
}
function rotate() { rot = rot ? 0 : 1; SND.tap(); render(); }
function tapCell(r, c) {
  if (won) return;
  if (!sel) { setMsg('Pick something from the tray first.', 'hint'); render(); return; }
  const tries = ITEMS[sel].size === 1 ? [[r, c]] : (rot ? [[r, c], [r - 1, c]] : [[r, c], [r, c - 1]]);
  let first = null;
  for (const [ar, ac] of tries) {
    const res = check(sel, ar, ac, rot);
    if (res.ok) {
      snap(); placed.push({ id: sel, r: ar, c: ac, rot: ITEMS[sel].size === 2 ? rot : 0 }); actions++;
      const id = sel; if (remaining(id) <= 0) sel = Object.keys(lvl().manifest).find(k => remaining(k) > 0) || null;
      SND.place(); return afterPlace();
    }
    if (!first) first = res;
  }
  setMsg(first.why, ''); SND.bad(); render();
}
function tapGear(i) {
  if (won) return;
  if (placed[i].fixed) { setMsg('📌 That one is already strapped in. It is a clue: work around it.', 'hint'); SND.tap(); render(); return; }
  snap(); const p = placed.splice(i, 1)[0]; actions++; sel = p.id; rot = p.rot; setMsg(''); SND.lift(); render();
}
function afterPlace() {
  const cf = conflicts(), iss = itemIssues();
  if (iss.length) { setMsg(iss[0].msg); SND.bad(); }
  else if (cf.length) {
    const x = cf[0], a = ITEMS[placed[x.a].id], b = ITEMS[placed[x.b].id];
    setMsg(`${a.e} ${a.name} is touching ${b.e} ${b.name}. ${RULES[x.rule].text}`); SND.bad();
  } else setMsg('');
  const left = Object.keys(lvl().manifest).reduce((n, k) => n + remaining(k), 0);
  if (!left && !cf.length && !iss.length) return win();
  if (!left) setMsg('Everything is in, but the red items break a rule. ' + (msg ? msg : 'Move them.'));
  render();
}
function undo() { if (!hist.length || won) return; const s = JSON.parse(hist.pop()); placed = s.placed; sel = s.sel; rot = s.rot; setMsg(''); SND.lift(); render(); }
function reset() { startLevel(lv); }
function hint() {
  if (won) return; hinted = true;
  const sol = lvl().solution, open = Object.keys(lvl().manifest).filter(k => remaining(k) > 0);
  const id = open[Math.floor(Math.random() * open.length)];
  if (!id) return setMsg('Everything is placed. Check the red items.', 'hint'), render();
  const s = sol.find(x => x.id === id), zone = ZONES[s.cells[0][0]][s.cells[0][1]], row = s.cells[0][0] + 1;
  setMsg(`💡 In one solution, ${ITEMS[id].e} ${ITEMS[id].name} sits in the ${ZONE_NAMES[zone].toLowerCase()}, row ${row}.`, 'hint'); render();
}
function toggleRule(k) { ruleOpen = ruleOpen === k ? null : k; SND.tap(); render(); }
function toggleMute() { save.mute = !save.mute; persist(); if (!save.mute) SND.tap(); render(); }

function win() {
  won = true; sel = null; render();
  const n = placed.filter(p => !p.fixed).length, par = n + 4;
  let stars = actions <= par ? 3 : actions <= par + 10 ? 2 : 1; if (hinted) stars = Math.max(1, stars - 1);
  save.stars[lv] = Math.max(save.stars[lv] || 0, stars);
  save.unlocked = Math.max(save.unlocked, Math.min(lv + 1, LEVELS.length - 1)); persist();
  SND.win(); confetti(); buzz([30, 40, 30]);
  setTimeout(() => showWin(stars), 650);
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
function render() { screen === 'home' ? renderHome() : screen === 'trek' ? renderTrek() : renderGame(); }

function packHTML() {
  const L = lvl(), blocked = blockedSet(), bad = new Set();
  conflicts().forEach(x => { bad.add(x.a); bad.add(x.b); });
  itemIssues().forEach(x => bad.add(x.i));
  const seenZone = new Set(); let cells = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const z = ZONES[r][c], cls = ['cell', 'z-' + z];
    if (r === 0 || ZONES[r - 1][c] !== z) cls.push('et');
    if (r === R - 1 || ZONES[r + 1][c] !== z) cls.push('eb');
    if (c === 0 || ZONES[r][c - 1] !== z) cls.push('el');
    if (c === C - 1 || ZONES[r][c + 1] !== z) cls.push('er');
    const isB = blocked.has(r * C + c); if (isB) cls.push('blocked');
    let label = ''; if (!seenZone.has(z)) { seenZone.add(z); label = `<span class="zl">${esc(ZONE_NAMES[z].replace(' compartment', '').replace(' pocket', ''))}</span>`; }
    cells += `<div class="${cls.join(' ')}" style="grid-row:${r + 1};grid-column:${c + 1}" onclick="tapCell(${r},${c})">${isB ? '<span class="jam">🔒</span>' : ''}${label}</div>`;
  }
  placed.forEach((p, i) => {
    const cs = cellsOf(p.id, p.r, p.c, p.rot), it = ITEMS[p.id];
    cells += `<div class="gear ${bad.has(i) ? 'bad' : ''} ${p.fixed ? 'fixed' : ''}" style="grid-row:${p.r + 1} / span ${p.rot && it.size === 2 ? 2 : 1};grid-column:${p.c + 1} / span ${!p.rot && it.size === 2 ? 2 : 1};--c:${it.color}" onclick="tapGear(${i})"><span class="ge">${it.e}</span><span class="gn">${esc(it.name)}</span>${p.fixed ? '<span class="pin">📌</span>' : ''}</div>`;
  });
  const guide = L.rules.includes('weight') ? '<div class="wguide"><span>▲</span><span style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:9px;letter-spacing:1px">LIGHT ↔ HEAVY</span><span>▼</span></div>' : '';
  return `<div class="packwrap">${guide}<div class="pack"><div class="grid">${cells}</div></div></div>`;
}

const POCKET = { lid: 'Lid', left: 'Sides', right: 'Sides', main: 'Main', bottom: 'Bottom' };
const pockets = it => [...new Set(it.zones.map(z => POCKET[z]))].join(' · ');

function renderGame() {
  const L = lvl(), T = TREKS[L.trek], k = trekLevels(L.trek).indexOf(lv);
  setBg(photoFor(L.trek, k).file);
  const ids = Object.keys(L.manifest);
  const tray = ids.map(id => {
    const it = ITEMS[id], n = remaining(id);
    return `<button class="tool ${sel === id ? 'sel' : ''} ${n <= 0 ? 'zero' : ''}" style="--c:${it.color}" onclick="pick('${id}')">
      <span class="cnt">${n <= 0 ? '✓' : '×' + n}</span><span class="te">${it.e}</span><span class="tn">${esc(it.name)}</span>
      <span class="tw">${it.weight === 'H' ? 'heavy' : it.weight === 'L' ? 'light' : 'medium'}${it.size === 2 ? ' · 2 cells' : ''}</span>
      <span class="tz">${pockets(it)}</span></button>`;
  }).join('');
  const total = ids.reduce((n, id) => n + L.manifest[id], 0), done = total - ids.reduce((n, id) => n + remaining(id), 0);
  const chips = L.rules.map(r => `<button class="rchip ${ruleOpen === r ? 'on' : ''}" onclick="toggleRule('${r}')">${RULES[r].icon} ${RULES[r].title}</button>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="ib" onclick="goTrek('${L.trek}')">←</button>
      <h1>${esc(T.name)}<small>${esc(L.title)} · ${L.days}-day trek</small></h1>
      <button class="ib" onclick="undo()" ${hist.length && !won ? '' : 'disabled'}>↶</button>
      <button class="ib" onclick="hint()">💡</button>
      <button class="ib" onclick="reset()">⟳</button>
      <button class="ib" onclick="toggleMute()">${save.mute ? '🔇' : '🔊'}</button>
    </div>
    <div class="panel">
      <div class="rules">${chips}</div>
      <div class="rtext">${ruleOpen ? esc(RULES[ruleOpen].text) : 'Tap a rule to read it. Pick gear below, then tap a spot in the backpack.'}</div>
      <div class="msg ${msgKind}">${esc(msg)}</div>
    </div>
    ${packHTML()}
    ${sel && ITEMS[sel].size === 2 ? `<button class="btn rotbtn" onclick="rotate()">⟳ Rotate (${rot ? 'upright' : 'sideways'})</button>` : ''}
    <div class="tray" style="margin-top:16px">${tray}</div>
    <div class="status">Packed ${done} of ${total} items</div>`;
}

function trekProgress(id) {
  const idx = trekLevels(id), got = idx.reduce((a, i) => a + (save.stars[i] || 0), 0), done = idx.filter(i => save.stars[i]).length;
  return { done, total: idx.length, got, max: idx.length * 3, locked: idx[0] > save.unlocked };
}
function renderHome() {
  setBg(null);
  const cards = Object.keys(TREKS).map(id => {
    const T = TREKS[id], p = trekProgress(id), prev = Object.keys(TREKS)[Object.keys(TREKS).indexOf(id) - 1];
    return `<button class="tcard ${p.locked ? 'locked' : ''}" style="background-image:url(${T.photos[0].file})" onclick="${p.locked ? `lockedMsg('${prev}')` : `goTrek('${id}')`}">
      <div class="shade"></div><span class="pill">${p.locked ? '🔒 Locked' : `${p.done}/${p.total} · ${'★'.repeat(p.got)}${'☆'.repeat(p.max - p.got)}`}</span>
      <div class="txt"><h3>${esc(T.name)}</h3><p>${esc(T.place)} · ${esc(T.alt)}</p></div></button>`;
  }).join('');
  $app.innerHTML = `<div class="hero"><h1>🥾 Trail Pack</h1><p>Pack the backpack for the world’s great treks.</p></div>${cards}
    <div class="row"><button class="btn" onclick="showHow()">How to play</button><button class="btn" onclick="toggleMute()">${save.mute ? '🔇 Sound off' : '🔊 Sound on'}</button></div>`;
}
function lockedMsg(prev) { SND.bad(); overlay(`<div class="pad"><h2>🔒 Not yet</h2><p>Finish every stage of <b>${esc(TREKS[prev].name)}</b> first.</p><div class="row"><button class="btn primary" onclick="closeOverlay()">OK</button></div></div>`); }

function renderTrek() {
  const T = TREKS[curTrek], idx = trekLevels(curTrek), ph = T.photos[0];
  setBg(ph.file);
  const stages = idx.map((i, k) => {
    const L = LEVELS[i], locked = i > save.unlocked, st = save.stars[i] || 0;
    return `<button class="stage ${locked ? 'locked' : ''}" ${locked ? '' : `onclick="startLevel(${i})"`}>
      <span class="n" style="background:${T.color}">${locked ? '🔒' : k + 1}</span>
      <span class="t"><b>${esc(L.title)}</b><span>${L.days}-day trek · ${Object.values(L.manifest).reduce((a, b) => a + b, 0)} items · ${L.rules.map(r => RULES[r].icon).join(' ')}</span></span>
      <span class="st">${st ? '★'.repeat(st) + '☆'.repeat(3 - st) : ''}</span></button>`;
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
      <li><b>Pack what the trek needs.</b> The tray shows exactly how many of each item you must bring.</li>
      <li><b>Pick an item, then tap a spot.</b> Each item only fits certain pockets, listed on its tile. Tap packed gear to take it out. Gear with a 📌 is already locked in place: it is a clue.</li>
      <li><b>Follow the rules.</b> Heavy things low, light things high. Food away from smelly gear. Wet away from electronics and down. Sharp and hot away from soft. Anything breaking a rule turns red, and the message says why.</li>
      <li><b>Jammed spots</b> (🔒) can’t be used.</li>
    </ol><button class="btn primary" style="width:100%" onclick="closeOverlay()">Let’s pack</button></div>`);
}
function showWin(stars) {
  const L = lvl(), T = TREKS[L.trek], idx = trekLevels(L.trek), k = idx.indexOf(lv);
  const ph = photoFor(L.trek, k), lastInTrek = k === idx.length - 1, lastAll = lv === LEVELS.length - 1;
  overlay(`<div class="photo" style="background-image:url(${ph.file})"><div class="cap">${esc(ph.caption)}</div></div>
    <div class="pad">
      <div class="stars">${[0, 1, 2].map(n => `<span>${n < stars ? '⭐' : '☆'}</span>`).join('')}</div>
      <h2 style="text-align:center">${lastInTrek ? `${esc(T.name)} complete! 🚩` : 'Pack ready!'}</h2>
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
