/* Trail Oops!: quick hiking microgames. Survive the dumb ways to die, earn coins, unlock hikers, backgrounds and real photos. */
const { ORDER, TREKS, CHARS, BGS } = DATA;
const $app = document.getElementById('app'), $layer = document.getElementById('layer');

/* ---------- save ---------- */
let save = { coins: 0, owned: { bean: true, meadow: true }, equip: { char: 'bean', bg: 'meadow' }, won: {}, deaths: 0, seen: false, mute: false };
try { const s = JSON.parse(localStorage.getItem('trailoops1') || '{}'); Object.assign(save, s); save.owned = Object.assign({ bean: true, meadow: true }, s.owned); save.equip = Object.assign({ char: 'bean', bg: 'meadow' }, s.equip); } catch (e) {}
const persist = () => { try { localStorage.setItem('trailoops1', JSON.stringify(save)); } catch (e) {} };

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
  ok: () => { tone(660, .08, 'triangle'); tone(880, .12, 'triangle', .1, .07); },
  coin: () => tone(1175, .1, 'square', .05),
  die: () => { tone(330, .2, 'sawtooth', .08); tone(247, .2, 'sawtooth', .08, .18); tone(165, .4, 'sawtooth', .08, .36); buzz(80); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .13, i * .12)),
  buy: () => [784, 988, 1175].forEach((f, i) => tone(f, .15, 'triangle', .1, i * .08))
};

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, window.__instant ? 0 : ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const creditHTML = file => { const c = CREDITS[file.split('/').pop()]; if (!c) return ''; return `<p class="credit">Photo: ${esc(c.artist)} · <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> · Wikimedia Commons</p>`; };
const stageKey = (trek, i) => `${trek}-${i + 1}`;
const trekWon = trek => TREKS[trek].photos.filter((_, i) => save.won[stageKey(trek, i)]).length;
const trekUnlocked = trek => { const k = ORDER.indexOf(trek); return k === 0 || trekWon(ORDER[k - 1]) >= 3; };
const stageUnlocked = (trek, i) => trekUnlocked(trek) && (i === 0 || save.won[stageKey(trek, i - 1)]);

/* ---------- the hiker (a bean in a hat) ---------- */
function hikerSVG(mood = 'idle', w = 54, ch = save.equip.char) {
  const C = CHARS[ch] || CHARS.bean, ink = '#3b2a1f', body = mood === 'burnt' ? '#ff8a73' : C.color;
  const eyes = mood === 'dead' ? `<path d="M-9 -41 l6 6 M-3 -41 l-6 6 M3 -41 l6 6 M9 -41 l-6 6" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
    : mood === 'happy' ? `<path d="M-9 -36 q3.5 -4.5 7 0 M2 -36 q3.5 -4.5 7 0" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="-5.5" cy="-37" r="${mood === 'scared' ? 5.2 : 4.4}" fill="#fff"/><circle cx="5.5" cy="-37" r="${mood === 'scared' ? 5.2 : 4.4}" fill="#fff"/><circle cx="${mood === 'scared' ? -5.5 : -4.5}" cy="-37" r="${mood === 'scared' ? 1.6 : 2.2}" fill="${ink}"/><circle cx="${mood === 'scared' ? 5.5 : 6.5}" cy="-37" r="${mood === 'scared' ? 1.6 : 2.2}" fill="${ink}"/>`;
  const mouth = mood === 'scared' ? `<ellipse cx="0" cy="-26.5" rx="2.6" ry="3.4" fill="${ink}"/>` : mood === 'dead' ? `<path d="M-4 -26 q4 -3 8 0" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` : `<path d="M-3.5 -27 q3.5 3.5 7 0" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  const hats = {
    beanie: `<path d="M-14.5 -47 a14.5 14.5 0 0 1 29 0z" fill="#ff7f9f"/><rect x="-15" y="-49" width="30" height="5" rx="2.5" fill="#ff5f89"/><circle cx="0" cy="-63" r="4.5" fill="#fff"/>`,
    chullo: `<path d="M-14.5 -47 a14.5 14.5 0 0 1 29 0z" fill="#e0443e"/><path d="M-12 -52 h24 M-9 -57 h18" stroke="#ffd166" stroke-width="2.2"/><path d="M-9 -61.5 h18" stroke="#3a78d8" stroke-width="2"/><path d="M-15 -48 l-3 17 l8 -4 z M15 -48 l3 17 l-8 -4 z" fill="#e0443e"/><circle cx="-16.5" cy="-30" r="2.4" fill="#ffd166"/><circle cx="16.5" cy="-30" r="2.4" fill="#ffd166"/><circle cx="0" cy="-63.5" r="3.6" fill="#ffd166"/>`,
    alpine: `<ellipse cx="0" cy="-48" rx="19" ry="4.5" fill="#4f8a5e"/><path d="M-10 -48 l3 -15 h14 l3 15z" fill="#69a977"/><rect x="-10" y="-53" width="20" height="3.5" fill="#3d6e4a"/><path d="M6 -55 q10 -12 14 -22 q-2 12 -9 21z" fill="#e0443e"/>`,
    gaucho: `<ellipse cx="0" cy="-48" rx="20" ry="4.5" fill="#3b3340"/><rect x="-11" y="-58" width="22" height="11" rx="4" fill="#4a4152"/><rect x="-11" y="-52" width="22" height="3" fill="#e0443e"/>`,
    safari: `<ellipse cx="0" cy="-47" rx="21" ry="5.5" fill="#d9b77a"/><path d="M-12 -47 a12 13 0 0 1 24 0z" fill="#e8cc92"/><rect x="-12" y="-52" width="24" height="4" fill="#8a6b3b"/>`,
    sherpa: `<path d="M-14.5 -47 a14.5 14.5 0 0 1 29 0z" fill="#d94a4a"/><rect x="-15" y="-50" width="30" height="5" rx="2.5" fill="#fff"/><path d="M-15 -46 l-4 18 l9 -4 z M15 -46 l4 18 l-9 -4 z" fill="#d94a4a"/><path d="M-17 -34 v10 M17 -34 v10" stroke="#fff" stroke-width="2"/><circle cx="0" cy="-63" r="4" fill="#fff"/>`
  };
  const halo = mood === 'dead' ? `<ellipse cx="0" cy="-70" rx="11" ry="3.4" fill="none" stroke="#ffd166" stroke-width="2.6"/>` : '';
  return `<svg viewBox="-26 -76 52 80" width="${w}" height="${Math.round(w * 80 / 52)}" style="overflow:visible${mood === 'dead' ? ';opacity:.8' : ''}">
    <rect x="-21" y="-32" width="12" height="20" rx="5" fill="#f4b266"/>
    <rect x="-9" y="-4" width="7" height="7" rx="3" fill="#5b4636"/><rect x="2" y="-4" width="7" height="7" rx="3" fill="#5b4636"/>
    <rect x="-15" y="-52" width="30" height="50" rx="15" fill="${body}"/><circle cx="-10" cy="-30" r="3" fill="#ff9fb8" opacity=".6"/><circle cx="10" cy="-30" r="3" fill="#ff9fb8" opacity=".6"/>
    ${eyes}${mouth}${hats[C.hat] || hats.beanie}${halo}
    ${mood === 'scared' ? '<text x="14" y="-50" font-size="12">💦</text>' : ''}</svg>`;
}

/* ---------- state ---------- */
let screen = 'home', runId = 0, current = null, R = null, shopTab = 'chars', curTrek = null;
window.__auto = false; // tests: solve every microgame automatically

/* ---------- stage ---------- */
function bgStyle() {
  const id = save.equip.bg;
  if (id.startsWith('photo:')) { const f = id.slice(6); return { css: `background:linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12)),url(photos/${f}.jpg) center/cover`, ground: 'rgba(120,190,140,.55)' }; }
  const b = BGS[id] || BGS.meadow; return { css: `background:linear-gradient(${b.sky[0]},${b.sky[1]})`, ground: b.ground };
}
function fitStage() { const st = document.getElementById('stage'), inner = document.getElementById('inner'); if (st && inner) inner.style.transform = `scale(${st.clientWidth / 360})`; }
window.addEventListener('resize', fitStage);
function resetBox(box) { const b = bgStyle(); box.style.cssText = b.css; box.innerHTML = `<div style="position:absolute;left:0;top:255px;width:360px;height:105px;background:${b.ground};border-radius:40px 40px 0 0;pointer-events:none"></div>`; box.style.transform = box.style.transform || ''; fitStage(); }

function runMicro(id, speed) {
  return new Promise(resolve => {
    const def = MICRO[id], box = document.getElementById('inner'), intervals = [], timers = [], listeners = []; let done = false;
    const bar = document.getElementById('tbar');
    const finish = (won, why) => { if (done) return; done = true; intervals.forEach(clearInterval); timers.forEach(clearTimeout); listeners.forEach(([el, t, f]) => el.removeEventListener(t, f)); if (bar) { bar.style.transition = 'none'; } current = null; resolve({ won, why }); };
    resetBox(box); const keep = box.style.transform; // transform is set by fitStage on the element's style
    const c = {
      box, speed,
      E(css, html, inter) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;' + (inter ? '' : 'pointer-events:none;') + css; if (html != null) d.innerHTML = html; box.appendChild(d); return d; },
      hiker: (mood, w) => hikerSVG(mood, w),
      loop(fn) { let last = Date.now(); intervals.push(setInterval(() => { const n = Date.now(); const dt = Math.min(.05, (n - last) / 1000); last = n; if (!done) fn(dt); }, 16)); },
      after(ms, fn) { timers.push(setTimeout(() => { if (!done) fn(); }, ms)); },
      on(el, type, fn) { el.addEventListener(type, fn); listeners.push([el, type, fn]); },
      pt(e) { const r = box.getBoundingClientRect(), s = r.width / 360; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; },
      win: () => finish(true), lose: why => finish(false, why)
    };
    const inst = def.make(c) || {}; current = { id, inst, finish };
    const ms = (def.fixed ? def.time : def.time / speed) * 1000;
    if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth; bar.style.transition = `width ${ms}ms linear`; bar.style.width = '0%'; }
    timers.push(setTimeout(() => finish(!!def.survive, 'time'), ms));
    if (window.__auto) setTimeout(() => { if (!done && inst.solve) inst.solve(); }, 60);
  });
}

/* ---------- a round ---------- */
function hud() {
  const el = document.getElementById('hud'); if (!el || !R) return;
  el.innerHTML = `<span class="lives">${'❤️'.repeat(R.lives)}${'🖤'.repeat(3 - R.lives)}</span><span class="dots">${R.list.map((_, i) => `<i class="${R.res[i] || (i === R.idx ? 'cur' : '')}"></i>`).join('')}</span><span class="coinp"><i class="coin"></i>${save.coins}</span>`;
}
function say(html, cls = '') { const t = document.getElementById('say'); if (!t) return; t.className = 'say ' + cls; t.innerHTML = html; t.style.display = html ? 'flex' : 'none'; }
async function playRound(trek, stageIdx) {
  const my = ++runId, T = TREKS[trek], base = 1 + stageIdx * .2 + ORDER.indexOf(trek) * .07;
  R = { trek, stage: stageIdx, lives: 3, idx: 0, list: shuffle(T.pool).slice(0, 8), res: [], base, earned: 0 };
  screen = 'play'; renderPlay();
  for (let i = 0; i < R.list.length; i++) {
    if (my !== runId) return;
    R.idx = i; hud();
    const id = R.list[i], def = MICRO[id], sp = base * (1 + .035 * i);
    resetBox(document.getElementById('inner'));
    say(`${i === 4 ? '<small>FASTER!</small>' : ''}${esc(def.title)}`, 'title'); SND.tap(); await sleep(i === 0 ? 1000 : 800); if (my !== runId) return;
    say('');
    const res = await runMicro(id, sp); if (my !== runId) return;
    if (res.won) { R.res[i] = 'w'; save.coins++; R.earned++; persist(); SND.ok(); say('✅ Nice!', 'good'); hud(); await sleep(450); say(''); }
    else {
      R.res[i] = 'l'; R.lives--; save.deaths++; persist(); SND.die(); hud();
      await deathCard(def, res); if (my !== runId) return;
      if (R.lives <= 0) return gameOver();
    }
  }
  winRound();
}
function deathCard(def, res) {
  return new Promise(resolve => {
    const box = document.getElementById('stage'); const card = document.createElement('div'); card.className = 'death';
    const why = res.why === 'time' ? 'Ran out of time' : def.death.name;
    card.innerHTML = `<div class="ghost">${hikerSVG('dead', 70)}</div><div class="dnum">DUMB WAY TO DIE #${save.deaths}</div><div class="dname">${def.death.icon} ${esc(def.death.name)}</div>
      <div class="dtip"><b>REAL TIP</b>${esc(def.tip)}</div><div class="dgo">tap to continue</div>`;
    box.appendChild(card); let done = false; const go = () => { if (done) return; done = true; card.remove(); resolve(); };
    setTimeout(() => card.addEventListener('pointerdown', go), window.__instant ? 0 : 900); setTimeout(go, window.__instant ? 0 : 5200);
  });
}
function gameOver() {
  const k = R.res.filter(r => r === 'w').length; say('');
  overlay(`<div class="pad"><div class="bigghost">${hikerSVG('dead', 90)}</div><h2>Out of lives!</h2><p class="mid">You survived ${k} of ${R.list.length} microgames.</p>
    <button class="big" onclick="closeOverlay();playRound('${R.trek}',${R.stage})">↺ Try again</button><button class="sm wide" onclick="goTrek('${R.trek}')">Back to ${esc(TREKS[R.trek].name)}</button></div>`, false);
}
function winRound() {
  const T = TREKS[R.trek], key = stageKey(R.trek, R.stage), first = !save.won[key], bonus = first ? 5 : 3, perfect = R.lives === 3;
  save.won[key] = true; save.coins += bonus + (perfect ? 2 : 0); persist(); hud(); SND.win(); confetti(); buzz([30, 40, 30]);
  const ph = T.photos[R.stage], nextBg = first ? `<div class="unl">🎉 New background unlocked: <b>${esc(T.name)} photo ${R.stage + 1}</b></div>` : '';
  setTimeout(() => overlay(`<div class="photo" style="background-image:url(${ph.file})"><div class="cap">${esc(ph.caption)}</div></div>
    <div class="pad"><h2>You survived! 🎉</h2>
      <div class="coinrow"><i class="coin"></i>+${R.earned} microgames · +${bonus} stage bonus${perfect ? ' · +2 perfect run' : ''}</div>
      <div class="fact"><b>FUN FACT</b>${esc(ph.fact)}</div>${creditHTML(ph.file)}${nextBg}
      <div class="row"><button class="sm" onclick="goShop()">🛍️ Shop</button><button class="sm" onclick="goTrek('${R.trek}')">${esc(T.name)}</button></div>
      ${R.stage < 2 ? `<button class="big" style="margin-top:12px" onclick="closeOverlay();playRound('${R.trek}',${R.stage + 1})">Next stage →</button>` : (trekUnlocked(ORDER[ORDER.indexOf(R.trek) + 1] || 'x') ? `<button class="big" style="margin-top:12px" onclick="goHome()">Next trek unlocked →</button>` : '')}</div>`, false), window.__instant ? 0 : 500);
}
function confetti() { const em = ['🎉', '⭐', '🥾', '🏔️', '✨', '💰']; for (let i = 0; i < 30; i++) { const d = document.createElement('div'); d.className = 'conf'; d.textContent = em[i % em.length]; d.style.left = Math.random() * 100 + 'vw'; d.style.animationDelay = Math.random() * .8 + 's'; d.style.fontSize = (16 + Math.random() * 16) + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 3600); } }

/* ---------- screens ---------- */
function render() { ({ home: renderHome, trek: renderTrek, shop: renderShop, play: renderPlay })[screen](); }
const coinPill = () => `<span class="coinp lg"><i class="coin"></i>${save.coins}</span>`;
function renderHome() {
  const cards = ORDER.map(id => { const T = TREKS[id], n = trekWon(id), open = trekUnlocked(id), prev = TREKS[ORDER[ORDER.indexOf(id) - 1]];
    return `<button class="tcard ${open ? '' : 'locked'}" style="background:linear-gradient(135deg,${T.c1},${T.c2})" onclick="${open ? `goTrek('${id}')` : `lockedMsg('${prev ? esc(prev.name) : ''}')`}">
      <span class="ico">${open ? T.icon : '🔒'}</span><span class="tt"><b>${esc(T.name)}</b><small>${esc(T.place)}</small></span><span class="stars">${[0, 1, 2].map(i => `<i class="${save.won[stageKey(id, i)] ? 'on' : ''}">★</i>`).join('')}</span></button>`; }).join('');
  $app.innerHTML = `<div class="topbar">${coinPill()}<button class="sm" onclick="goShop()">🛍️ Shop</button></div>
    <div class="hero"><div class="herobean">${hikerSVG('scared', 84)}</div><h1>Trail Oops!</h1><p>Don’t die dumb on the trail!</p></div>${cards}
    <div class="row"><button class="sm" onclick="showHow()">How to play</button><button class="sm" onclick="toggleMute()">${save.mute ? '🔇 Sound off' : '🔊 Sound on'}</button></div>`;
}
function lockedMsg(prev) { SND.tap(); overlay(`<div class="pad"><h2>🔒 Not yet</h2><p class="mid">Survive all 3 stages of <b>${esc(prev)}</b> to unlock this trek.</p><button class="big" onclick="closeOverlay()">OK</button></div>`); }
function renderTrek() {
  const T = TREKS[curTrek], won = trekWon(curTrek);
  const stages = [0, 1, 2].map(i => { const ok = stageUnlocked(curTrek, i), done = save.won[stageKey(curTrek, i)];
    return `<button class="stg ${done ? 'done' : ''} ${ok ? '' : 'locked'}" ${ok ? `onclick="playRound('${curTrek}',${i})"` : ''}><span class="n">${ok ? i + 1 : '🔒'}</span><small>Stage ${i + 1}</small>${done ? '<i>✓</i>' : ''}</button>`; }).join('');
  const album = T.photos.map((p, i) => { const un = save.won[stageKey(curTrek, i)]; return `<button class="alb ${un ? '' : 'lk'}" ${un ? `onclick="showPhoto('${curTrek}',${i})"` : ''} style="${un ? `background-image:url(${p.file})` : ''}">${un ? '' : '🔒'}</button>`; }).join('');
  $app.innerHTML = `<div class="topbar"><button class="ib" onclick="goHome()">←</button>${coinPill()}<button class="sm" onclick="goShop()">🛍️ Shop</button></div>
    <div class="thero" style="background:linear-gradient(135deg,${T.c1},${T.c2})"><span class="ico">${T.icon}</span><div><b>${esc(T.name)}</b><small>${esc(T.place)} · ${esc(T.alt)}</small></div></div>
    <div class="sect">SURVIVE A STAGE</div><div class="stgs">${stages}</div>
    <div class="sect">PHOTO ALBUM · ${won}/3</div><div class="albs">${album}</div>
    <p class="hint">Each stage is 8 quick microgames. Lose all 3 lives and you start over. Every stage you survive unlocks a real photo and a fun fact.</p>`;
}
function showPhoto(trek, i) { const p = TREKS[trek].photos[i]; overlay(`<div class="photo" style="background-image:url(${p.file})"><div class="cap">${esc(p.caption)}</div></div><div class="pad"><div class="fact"><b>FUN FACT</b>${esc(p.fact)}</div>${creditHTML(p.file)}<button class="big" style="margin-top:12px" onclick="closeOverlay()">Cool!</button></div>`); }
function renderPlay() {
  $app.innerHTML = `<div class="topbar"><button class="ib" onclick="quitRound()">✕</button><div id="hud" class="hud"></div></div>
    <div class="stagewrap"><div class="stage" id="stage"><div class="inner" id="inner"></div><div id="say" class="say" style="display:none"></div></div></div>
    <div class="tbarwrap"><div id="tbar"></div></div>`;
  resetBox(document.getElementById('inner')); fitStage(); hud();
}
function quitRound() { runId++; if (current) current.finish(false, 'quit'); closeOverlay(); goTrek(R ? R.trek : ORDER[0]); }

/* ---------- shop ---------- */
function goShop() { runId++; screen = 'shop'; closeOverlay(); render(); window.scrollTo(0, 0); }
function renderShop() {
  const items = shopTab === 'chars' ? Object.keys(CHARS).map(id => ({ id, kind: 'char', name: CHARS[id].name, price: CHARS[id].price, trek: CHARS[id].trek, owned: !!save.owned[id], eq: save.equip.char === id, prev: hikerSVG('happy', 56, id) }))
    : [...Object.keys(BGS).map(id => ({ id, kind: 'bg', name: BGS[id].name, price: BGS[id].price, trek: BGS[id].trek, owned: !!save.owned[id], eq: save.equip.bg === id, prev: `<div class="bgp" style="background:linear-gradient(${BGS[id].sky[0]},${BGS[id].sky[1]})"><i style="background:${BGS[id].ground}"></i></div>` })),
      ...ORDER.flatMap(t => TREKS[t].photos.map((p, i) => ({ id: 'photo:' + stageKey(t, i), kind: 'bg', name: `${TREKS[t].name} ${i + 1}`, price: 0, trek: t, owned: !!save.won[stageKey(t, i)], eq: save.equip.bg === 'photo:' + stageKey(t, i), photo: true, need: `Survive ${TREKS[t].name} stage ${i + 1}`, prev: `<div class="bgp" style="background:url(${p.file}) center/cover"></div>` })))];
  const cards = items.map(it => { const afford = save.coins >= it.price;
    const act = it.eq ? '<span class="eq">✓ In use</span>' : it.owned ? `<button class="sm" onclick="equip('${it.kind}','${it.id}')">Use</button>` : it.photo ? `<span class="need">🔒 ${esc(it.need)}</span>` : `<button class="sm buy ${afford ? '' : 'no'}" onclick="buy('${it.kind}','${it.id}')"><i class="coin"></i>${it.price}</button>`;
    return `<div class="item ${it.owned ? '' : 'lk'}"><div class="prev">${it.prev}</div><b>${esc(it.name)}</b>${it.trek ? `<small>${esc(TREKS[it.trek].icon + ' ' + TREKS[it.trek].name)}</small>` : '<small>Starter</small>'}${act}</div>`; }).join('');
  $app.innerHTML = `<div class="topbar"><button class="ib" onclick="goHome()">←</button>${coinPill()}<span></span></div><h2 class="shoph">Shop</h2>
    <div class="tabs"><button class="tab ${shopTab === 'chars' ? 'on' : ''}" onclick="setTab('chars')">🥾 Hikers</button><button class="tab ${shopTab === 'bgs' ? 'on' : ''}" onclick="setTab('bgs')">🖼️ Backgrounds</button></div>
    <div class="items">${cards}</div><p class="hint">Earn coins by surviving microgames. Photo backgrounds unlock for free when you survive that stage.</p>`;
}
function setTab(t) { shopTab = t; SND.tap(); renderShop(); }
function buy(kind, id) { const price = kind === 'char' ? CHARS[id].price : BGS[id].price; if (save.coins < price) { SND.die(); const b = document.querySelector('.buy.no'); return overlay(`<div class="pad"><h2>Not enough coins</h2><p class="mid">You need <i class="coin"></i>${price}. You have <i class="coin"></i>${save.coins}. Survive more microgames to earn coins!</p><button class="big" onclick="closeOverlay()">OK</button></div>`); } save.coins -= price; save.owned[id] = true; save.equip[kind === 'char' ? 'char' : 'bg'] = id; persist(); SND.buy(); renderShop(); }
function equip(kind, id) { save.equip[kind === 'char' ? 'char' : 'bg'] = id; persist(); SND.tap(); renderShop(); }

/* ---------- overlays & nav ---------- */
function overlay(html, dismiss = true) { $layer.innerHTML = `<div class="overlay" ${dismiss ? 'onclick="if(event.target===this)closeOverlay()"' : ''}><div class="modal">${html}</div></div>`; }
function closeOverlay() { $layer.innerHTML = ''; }
function goHome() { runId++; screen = 'home'; closeOverlay(); render(); window.scrollTo(0, 0); }
function goTrek(id) { runId++; curTrek = id; screen = 'trek'; closeOverlay(); render(); window.scrollTo(0, 0); }
function toggleMute() { save.mute = !save.mute; persist(); render(); }
function showHow() {
  overlay(`<div class="pad"><h2>How to play</h2><ul class="how">
    <li><span class="i">⚡</span><span>Each <b>microgame</b> lasts a few seconds. Read the big instruction and do it <b>fast</b>!</span></li>
    <li><span class="i">☠️</span><span>Fail and your hiker dies in a dumb way. You lose a ❤️ and learn the <b>real tip</b>.</span></li>
    <li><span class="i">🏔️</span><span>Survive all 8 to finish a stage. It gets <b>faster</b> every time.</span></li>
    <li><span class="i">💰</span><span>Earn coins for hiker outfits and backgrounds, and unlock <b>real photos</b> and fun facts of each trek.</span></li></ul>
    <button class="big" onclick="closeOverlay()">Let’s hike!</button></div>`);
}

/* ---------- boot ---------- */
(function boot() {
  const q = new URLSearchParams(location.search);
  if (q.has('noanim')) document.head.insertAdjacentHTML('beforeend', '<style>*{animation:none!important}</style>'); // debug: for screenshots
  if (q.has('coins')) save.coins = +q.get('coins');
  if (q.has('unlock')) ORDER.forEach(t => [0, 1, 2].forEach(i => save.won[stageKey(t, i)] = true));
  if (q.has('micro')) { screen = 'play'; R = { trek: 'inca', stage: 0, lives: 3, idx: 0, list: ['x'], res: [] }; renderPlay(); say(MICRO[q.get('micro')].title, 'title'); setTimeout(() => { say(''); runMicro(q.get('micro'), +(q.get('speed') || 1)); }, 300); return; } // debug: open one microgame
  if (q.has('death')) { screen = 'play'; R = { trek: 'inca', stage: 0, lives: 2, idx: 1, list: ['x', 'y'], res: ['w'] }; renderPlay(); save.deaths = 7; deathCard(MICRO[q.get('death')], {}); return; } // debug: show a death card
  if (q.has('shop')) { goShop(); return; }
  if (q.has('trek')) { goTrek(q.get('trek')); return; }
  render();
  if (!save.seen && !q.has('seen')) { save.seen = true; persist(); showHow(); }
})();
