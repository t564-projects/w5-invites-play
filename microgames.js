/* Trail Oops!: the microgames. Each one is a few seconds, one action, and a funny (and educational) way to die.
 *
 * def(id, { title, time, survive, death:{icon,name}, tip, make(c) })
 *   time    seconds at speed 1 (it shrinks as the game speeds up)
 *   survive true = you win by lasting until the time is up; otherwise you win by doing the task
 *   make(c) builds the scene in the 360 x 360 box and returns { solve() } (solve is used by the tests)
 * c: box, speed, E(css, html, interactive), hiker(mood, width), loop(fn(dt)), after(ms, fn), on(el, type, fn), pt(e), win(), lose(why)
 */
const MICRO = {};
const def = (id, o) => { MICRO[id] = Object.assign({ id }, o); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const slow = (speed, k = .5) => 1 + (speed - 1) * k; // dampened speed-up for things that would become impossible

/* ---------- pick one (water, jacket, turnaround) ---------- */
function pickGame(scene, options) {
  return c => {
    scene(c);
    const area = { x0: 8, x1: 212, y0: 70, y1: 288 }, btns = [];
    const spots = [[18, 80], [188, 80], [18, 185], [188, 185]];
    options.slice().sort(() => Math.random() - .5).forEach((o, i) => {
      const b = c.E(`left:${spots[i][0]}px;top:${spots[i][1]}px;width:150px;height:66px;border-radius:20px;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.2);display:flex;align-items:center;gap:8px;padding:0 10px;font-weight:900;font-size:14px;line-height:1.1;color:#4a3f6b;cursor:pointer;touch-action:none`,
        `<span style="font-size:32px">${o.e}</span><span>${o.t}</span>`, true);
      const ang = Math.random() * 6.28, v = (55 + Math.random() * 40) * c.speed;
      const s = { b, o, x: spots[i][0], y: spots[i][1], vx: Math.cos(ang) * v, vy: Math.sin(ang) * v };
      b.addEventListener('pointerdown', e => { e.stopPropagation(); o.ok ? c.win() : c.lose(o.why); });
      btns.push(s);
    });
    c.loop(dt => btns.forEach(s => {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < area.x0 || s.x > area.x1) { s.vx = -s.vx; s.x = clamp(s.x, area.x0, area.x1); }
      if (s.y < area.y0 || s.y > area.y1) { s.vy = -s.vy; s.y = clamp(s.y, area.y0, area.y1); }
      s.b.style.left = s.x + 'px'; s.b.style.top = s.y + 'px';
    }));
    return { solve() { btns.find(s => s.o.ok).b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } };
  };
}

def('water', { title: 'Treat the water!', time: 3.4, death: { icon: '🤢', name: 'Drank the pond water' },
  tip: 'Clear water can still carry germs. Filter, purify or boil water from streams and ponds before you drink it.',
  make: pickGame(c => { c.E('left:80px;top:16px;font-size:44px;opacity:.95', '🐸'); c.E('left:20px;top:46px;width:320px;height:22px;border-radius:99px;background:#8aa86a;opacity:.7'); },
    [{ e: '🧪', t: 'Filter it', ok: true }, { e: '🔥', t: 'Boil it', ok: true }, { e: '🥤', t: 'Drink it raw', why: 'raw' }, { e: '🐸', t: 'Ask the frog', why: 'frog' }]) });

def('jacket', { title: 'Dress for the rain!', time: 3.4, death: { icon: '🥶', name: 'Wore cotton in the rain' },
  tip: 'Cotton stays wet and chills you. Wear a waterproof shell over wool or synthetic layers.',
  make: pickGame(c => { c.E('left:0;top:0;width:360px;height:360px;font-size:20px;line-height:1.1;opacity:.55;overflow:hidden;animation:rain .5s linear infinite', '💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧<br>&nbsp;&nbsp;💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧 &nbsp;&nbsp; 💧'); c.E('left:140px;top:6px;font-size:50px', '🌧️'); },
    [{ e: '🧥', t: 'Rain shell', ok: true }, { e: '👕', t: 'Cotton tee', why: 'cotton' }, { e: '🩳', t: 'Shorts', why: 'shorts' }, { e: '🕶️', t: 'Sunglasses', why: 'shades' }]) });

def('turnaround', { title: 'Turn around time!', time: 3.4, death: { icon: '🌙', name: 'Got caught on the mountain after dark' },
  tip: 'Pick a turnaround time before you start and stick to it, even when the summit looks close.',
  make: pickGame(c => { c.E('left:110px;top:10px;font-size:52px', '⛰️'); c.E('left:218px;top:6px;font-size:22px;font-weight:900;color:#fff;background:#d94a4a;border-radius:12px;padding:4px 10px', '⏰ 2:20 PM'); c.E('left:218px;top:40px;font-size:12px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)', 'Turnaround: 2:00 PM'); },
    [{ e: '🏁', t: 'Summit! Just 5 more minutes', why: 'summit' }, { e: '↩️', t: 'Turn back now', ok: true }, { e: '📸', t: 'Selfie first', why: 'selfie' }, { e: '☕', t: 'Tea break', why: 'tea' }]) });

/* ---------- bear bag (drag) ---------- */
def('bearbag', { title: 'Hang the food!', time: 4.4, death: { icon: '🐻', name: 'Fed the bear' },
  tip: 'Store food in a bear canister or hang it high, away from your tent. Bears can smell food from far away.',
  make(c) {
    c.E('left:244px;top:20px;font-size:98px;line-height:1', '🌳');
    c.E('left:236px;top:74px;width:60px;height:60px;border:4px dashed rgba(255,255,255,.95);border-radius:50%;animation:blink 1s infinite');
    c.E('left:236px;top:138px;width:60px;text-align:center;font-size:12px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)', 'hang here');
    c.E('left:20px;top:190px', c.hiker('scared', 56));
    const bag = c.E('left:104px;top:206px;font-size:50px;line-height:1;touch-action:none;cursor:grab', '🎒', true);
    const bear = c.E('left:-80px;top:176px;font-size:70px;line-height:1', '🐻');
    let bx = -80, hung = false, drag = null;
    const hang = () => { if (hung) return; hung = true; bag.style.left = '240px'; bag.style.top = '76px'; c.win(); };
    bag.addEventListener('pointerdown', e => { if (hung) return; const p = c.pt(e); drag = { dx: p.x - parseFloat(bag.style.left), dy: p.y - parseFloat(bag.style.top) }; bag.setPointerCapture(e.pointerId); });
    bag.addEventListener('pointermove', e => { if (!drag || hung) return; const p = c.pt(e); bag.style.left = (p.x - drag.dx) + 'px'; bag.style.top = (p.y - drag.dy) + 'px'; });
    bag.addEventListener('pointerup', () => { if (!drag) return; drag = null; const x = parseFloat(bag.style.left), y = parseFloat(bag.style.top); if (Math.hypot(x - 240, y - 76) < 42) hang(); });
    c.loop(dt => { if (hung) return; bx += 82 * c.speed * dt; bear.style.left = bx + 'px'; if (bx > 118) c.lose('bear'); });
    return { solve: hang };
  } });

/* ---------- balance on the edge (tap left / right) ---------- */
def('balance', { title: 'Don’t fall off the edge!', time: 4.8, survive: true, death: { icon: '🪂', name: 'Fell off the cliff for a selfie' },
  tip: 'Stay well back from cliff edges: they can be loose, wet or windy. No selfie is worth it.',
  make(c) {
    c.E('left:0;top:250px;width:206px;height:120px;background:#c8a97e;border-radius:0 12px 0 0');
    c.E('left:206px;top:262px;width:154px;height:98px;background:rgba(60,50,90,.25)');
    c.E('left:236px;top:296px;font-size:30px;opacity:.7', '☁️');
    const w = c.E('left:146px;top:186px;width:60px;height:66px;transform-origin:50% 100%', c.hiker('scared', 54) + '<div style="position:absolute;right:-8px;top:6px;font-size:24px">📱</div>');
    c.E('left:14px;top:300px;font-size:30px;font-weight:900;color:rgba(255,255,255,.9);text-shadow:0 2px 4px rgba(0,0,0,.4)', '◀ tap');
    c.E('left:262px;top:300px;font-size:30px;font-weight:900;color:rgba(255,255,255,.9);text-shadow:0 2px 4px rgba(0,0,0,.4)', 'tap ▶');
    let a = (Math.random() < .5 ? -1 : 1) * 12, v = 0, n = 0, nt = 0, auto = false, dead = false;
    c.on(c.box, 'pointerdown', e => { v += c.pt(e).x < 180 ? -72 : 72; });
    c.loop(dt => {
      if (dead) return;
      nt -= dt; if (nt <= 0) { n = (Math.random() * 2 - 1) * 44 * slow(c.speed, .8); nt = .35; }
      if (auto) v += -(a * 12 + v * 3.5) * dt;
      v += (a * 2.6 + n) * dt; a += v * dt;
      w.style.transform = `rotate(${a}deg)`;
      if (Math.abs(a) >= 38) { dead = true; w.style.transition = 'transform .6s, top .6s'; w.style.transform = `rotate(${a > 0 ? 100 : -100}deg)`; if (a > 0) w.style.top = '300px'; c.lose('fell'); }
    });
    return { solve() { auto = true; } };
  } });

/* ---------- eat only trail mix (go / no-go) ---------- */
def('berries', { title: 'Only eat trail mix!', time: 5.2, death: { icon: '🤮', name: 'Ate a mystery mushroom' },
  tip: 'Never eat wild berries, plants or mushrooms unless you are 100% sure what they are.',
  make(c) {
    let got = 0, need = 3, t = 0, gap = 0; const pips = c.E('left:0;top:6px;width:360px;text-align:center;font-size:22px;letter-spacing:6px', '🥜🥜🥜'.replace(/🥜/g, '⚪'));
    const items = [];
    const spawn = () => { const ok = Math.random() < .5, e = ok ? '🥜' : ['🍄', '🌿', '🫐'][Math.floor(Math.random() * 3)];
      const el = c.E(`left:${20 + Math.random() * 290}px;top:-50px;font-size:46px;line-height:1;touch-action:none;cursor:pointer`, e, true); const it = { el, ok, y: -50, tapped: false };
      el.addEventListener('pointerdown', ev => { ev.stopPropagation(); tap(it); }); items.push(it); };
    const tap = it => { if (it.tapped) return; it.tapped = true; if (!it.ok) { it.el.innerHTML = '🤮'; return c.lose('bad'); } it.el.style.opacity = '.2'; got++; pips.textContent = '🥜'.repeat(got) + '⚪'.repeat(need - got); if (got >= need) c.win(); };
    c.loop(dt => { gap -= dt; if (gap <= 0) { spawn(); gap = .62 / slow(c.speed, .6); } items.forEach(it => { it.y += 150 * c.speed * dt; it.el.style.top = it.y + 'px'; });
      while (items.length && items[0].y > 340) { items.shift().el.remove(); } });
    return { solve() { got = need; c.win(); } };
  } });

/* ---------- follow the right trail marker ---------- */
def('lost', { title: 'Follow the trail markers!', time: 5.6, death: { icon: '🧭', name: 'Got hopelessly lost' },
  tip: 'Stay on marked trails. If you think you are lost, stop, stay calm and retrace your steps.',
  make(c) {
    const COL = [['🟦', 'blue'], ['🟥', 'red'], ['🟩', 'green'], ['🟨', 'yellow']];
    let fork = 0, goal = null; const total = 3;
    const holder = c.E('left:0;top:0;width:360px;height:360px');
    const label = c.E('left:0;top:10px;width:360px;text-align:center;font-size:20px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5)', '');
    const draw = () => {
      holder.innerHTML = ''; const cols = COL.slice().sort(() => Math.random() - .5).slice(0, 3); goal = cols[Math.floor(Math.random() * 3)];
      label.innerHTML = `Follow ${goal[0]} <span style="font-size:14px">(${fork + 1}/${total})</span>`;
      cols.forEach((col, i) => { const x = 20 + i * 112, p = document.createElement('div');
        p.style.cssText = `position:absolute;left:${x}px;top:70px;width:100px;height:230px;border-radius:50px 50px 0 0;background:linear-gradient(#e9d6a8,#cdb27c);box-shadow:0 5px 0 rgba(0,0,0,.18);display:flex;flex-direction:column;align-items:center;padding-top:20px;gap:10px;font-size:34px;cursor:pointer;touch-action:none`;
        p.innerHTML = `<span style="font-size:22px">⬆️</span><span>${col[0]}</span><span style="opacity:.8;font-size:28px">🌲</span>`;
        p.dataset.good = col === goal ? '1' : '';
        p.addEventListener('pointerdown', e => { e.stopPropagation(); choose(p.dataset.good === '1'); }); holder.appendChild(p); });
    };
    const choose = ok => { if (!ok) return c.lose('wrong'); fork++; if (fork >= total) return c.win(); draw(); };
    draw();
    return { solve() { for (let i = 0; i < total; i++) holder.querySelector('[data-good="1"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } };
  } });

/* ---------- sunscreen (scrub) ---------- */
def('sunscreen', { title: 'Put on sunscreen!', time: 4.6, death: { icon: '🦞', name: 'Turned into a lobster' },
  tip: 'The sun is much stronger at altitude. Use sunscreen, sunglasses and a hat, even when it is cloudy.',
  make(c) {
    const face = c.E('left:70px;top:50px;width:220px;height:240px;border-radius:50%;background:#ffd9b8;box-shadow:inset 0 -8px 0 rgba(0,0,0,.08)');
    const burn = c.E('left:70px;top:50px;width:220px;height:240px;border-radius:50%;background:#ff4d3d;opacity:0');
    c.E('left:112px;top:118px;font-size:28px', '👁️'); c.E('left:196px;top:118px;font-size:28px', '👁️'); c.E('left:150px;top:200px;font-size:30px', '👄');
    c.E('left:290px;top:30px;font-size:60px;animation:spin 6s linear infinite', '☀️');
    const spots = [[160, 160], [100, 190], [220, 190], [160, 85], [70, 130]].map(([x, y]) => { const el = c.E(`left:${x - 24}px;top:${y - 24}px;width:48px;height:48px;border-radius:50%;border:4px dashed #fff;background:rgba(255,255,255,.35)`, ''); return { x, y, el, acc: 0, done: false }; });
    let down = false, last = null, t = 0;
    const cover = s => { s.done = true; s.el.style.background = '#fff'; s.el.style.border = '4px solid #fff'; if (spots.every(q => q.done)) c.win(); };
    c.on(c.box, 'pointerdown', e => { down = true; last = c.pt(e); });
    c.on(c.box, 'pointerup', () => { down = false; });
    c.on(c.box, 'pointermove', e => { if (!down) return; const p = c.pt(e), d = Math.hypot(p.x - last.x, p.y - last.y); last = p; spots.forEach(s => { if (!s.done && Math.hypot(p.x - s.x, p.y - s.y) < 34) { s.acc += d; if (s.acc > 46) cover(s); } }); });
    c.loop(dt => { t += dt; burn.style.opacity = Math.min(.6, t / (4.6 / c.speed) * .6); });
    return { solve() { spots.forEach(cover); } };
  } });

/* ---------- back away slowly (rhythm) ---------- */
def('backaway', { title: 'Back away slowly!', time: 5.2, survive: true, death: { icon: '🐻', name: 'Ran from a bear' },
  tip: 'Stay about 25 m from wildlife and 100 m from bears. If one approaches, back away slowly. Never run.',
  make(c) {
    let d = 3.2, step = 0, last = -9, now = 0, dead = false, auto = false, autoT = .3;
    const animal = c.E('left:0;top:190px;font-size:66px;line-height:1', '🐻');
    const me = c.E('left:0;top:200px', c.hiker('scared', 54));
    const dist = c.E('left:0;top:14px;width:360px;text-align:center;font-size:20px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5)', '');
    c.E('left:0;top:318px;width:360px;text-align:center;font-size:15px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5)', 'tap to step back… slowly, not too fast!');
    const place = () => { const mx = 250 + (d - 3) * 0, ax = 250 - d * 52 - 40; me.style.left = (250 + Math.max(0, d - 3) * 20) + 'px'; animal.style.left = ax + 'px'; dist.textContent = `🐻 ${Math.max(0, Math.round(d * 12))} m away`; };
    const tap = () => { if (dead) return; if (now - last < .42) { dead = true; me.innerHTML = c.hiker('dead', 54); return c.lose('ran'); } last = now; d = Math.min(d + 1, 6); place(); };
    c.on(c.box, 'pointerdown', tap);
    const gap = .74 / slow(c.speed, .45);
    c.loop(dt => { if (dead) return; now += dt; step += dt; if (step >= gap) { step = 0; d -= 1; place(); if (d <= 0) { dead = true; c.lose('caught'); } }
      if (auto) { autoT -= dt; if (autoT <= 0) { tap(); autoT = .56; } } });
    place();
    return { solve() { auto = true; } };
  } });

/* ---------- lightning (dodge) ---------- */
def('lightning', { title: 'Dodge the lightning!', time: 5.4, survive: true, death: { icon: '⚡', name: 'Struck by lightning on the ridge' },
  tip: 'In a thunderstorm get off ridges and summits and away from lone tall trees. Lightning strikes the highest point.',
  make(c) {
    c.E('left:0;top:0;width:360px;height:360px;background:rgba(40,30,80,.35)'); c.E('left:20px;top:8px;font-size:54px', '⛈️'); c.E('left:240px;top:20px;font-size:46px', '🌩️');
    const lanes = [0, 1, 2].map(i => c.E(`left:${i * 120}px;top:70px;width:120px;height:280px;border-left:2px dashed rgba(255,255,255,.25)`, ''));
    const me = c.E('left:0;top:236px', c.hiker('scared', 54)); let lane = 1, now = 0, gap = .45, bolts = [], first = true, dead = false, auto = false;
    const move = l => { lane = l; me.style.left = (l * 120 + 33) + 'px'; }; move(1);
    c.on(c.box, 'pointerdown', e => { move(clamp(Math.floor(c.pt(e).x / 120), 0, 2)); });
    const warnT = .62 / slow(c.speed, .6);
    c.loop(dt => {
      if (dead) return; now += dt; gap -= dt;
      if (gap <= 0) { gap = .95 / slow(c.speed, .55); const l = first ? lane : Math.floor(Math.random() * 3); first = false;
        const set = [l]; if (c.speed > 1.25 && Math.random() < .4) { const o = (l + 1 + Math.floor(Math.random() * 2)) % 3; set.push(o); }
        set.forEach(x => { const el = c.E(`left:${x * 120}px;top:70px;width:120px;height:280px;background:rgba(255,235,80,.3);display:grid;place-items:center;font-size:44px`, '⚠️'); bolts.push({ lane: x, at: now + warnT, el, hit: false }); }); }
      bolts.forEach(b => { if (!b.hit && now >= b.at) { b.hit = true; b.el.style.background = 'rgba(255,255,160,.85)'; b.el.innerHTML = '⚡'; b.el.style.fontSize = '120px'; b.t = now + .2; if (b.lane === lane) { dead = true; me.innerHTML = c.hiker('dead', 54); c.lose('zap'); } }
        if (b.hit && now > b.t) b.el.remove(); });
      bolts = bolts.filter(b => !(b.hit && now > b.t));
      if (auto) { const warned = bolts.filter(b => !b.hit).map(b => b.lane); if (warned.includes(lane)) move([0, 1, 2].find(l => !warned.includes(l))); }
    });
    return { solve() { auto = true; } };
  } });

/* ---------- yaks: get to the uphill side (drag) ---------- */
def('yak', { title: 'Yaks coming! Uphill side!', time: 3.8, death: { icon: '🐂', name: 'Bumped off the trail by a yak' },
  tip: 'On mountain trails, step to the uphill side when yaks or mules pass, so they cannot push you off the edge.',
  make(c) {
    c.E('left:0;top:0;width:360px;height:150px;background:linear-gradient(#b9a98f,#a39279);border-radius:0 0 40px 40px'); c.E('left:20px;top:40px;font-size:60px', '⛰️'); c.E('left:240px;top:60px;font-size:40px', '🪨');
    c.E('left:0;top:168px;width:360px;height:90px;background:#e9d9b3'); c.E('left:0;top:258px;width:360px;height:110px;background:#6b5d7e'); c.E('left:140px;top:290px;font-size:34px;opacity:.7', '☁️');
    c.E('left:230px;top:112px;font-size:13px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)', '⬆ uphill side');
    const me = c.E('left:140px;top:196px;touch-action:none', c.hiker('scared', 54), true); let y = 196, drag = null, yx = 390, dead = false, safe = false;
    const yaks = c.E('left:390px;top:176px;font-size:62px;line-height:1;white-space:nowrap', '🐂🐂🐂');
    me.addEventListener('pointerdown', e => { const p = c.pt(e); drag = { dx: p.x - parseFloat(me.style.left), dy: p.y - y }; me.setPointerCapture(e.pointerId); });
    me.addEventListener('pointermove', e => { if (!drag) return; const p = c.pt(e); me.style.left = clamp(p.x - drag.dx, 0, 300) + 'px'; y = clamp(p.y - drag.dy, 60, 250); me.style.top = y + 'px'; if (y < 128 && !safe) { safe = true; } });
    me.addEventListener('pointerup', () => { drag = null; });
    c.loop(dt => { if (dead) return; yx -= 150 * c.speed * dt; yaks.style.left = yx + 'px'; const mx = parseFloat(me.style.left);
      if (safe && y < 140) { /* wait for the yaks to pass: you are safe */ if (yx + 190 < mx - 10) c.win(); return; }
      if (yx < mx + 50 && yx + 200 > mx && y > 150) { dead = true; me.innerHTML = c.hiker('dead', 54); c.lose('bump'); } });
    return { solve() { y = 100; me.style.top = '100px'; safe = true; } };
  } });

/* ---------- pole pole: tap on the slow beat (rhythm) ---------- */
def('polepole', { title: 'Pole pole! Go slowly!', time: 5.6, fixed: true, death: { icon: '🤒', name: 'Climbed too fast' },
  tip: '“Pole pole” means “slowly slowly” in Swahili. Climbing too fast is the main cause of altitude sickness.',
  make(c) {
    c.E('left:80px;top:80px;width:200px;height:200px;border-radius:50%;border:6px solid #fff;background:rgba(255,255,255,.25)');
    const ring = c.E('left:80px;top:80px;width:200px;height:200px;border-radius:50%;border:8px solid #ff8e72;opacity:.9');
    c.E('left:140px;top:140px', c.hiker('idle', 80));
    const txt = c.E('left:0;top:300px;width:360px;text-align:center;font-size:20px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5)', 'tap when the ring fits…');
    const iv = 1.05 / slow(c.speed, .35), first = .95, need = 4, tol = .27, beats = Array.from({ length: need }, (_, i) => first + i * iv);
    let now = 0, hit = 0, auto = false, dead = false;
    const tap = () => { if (dead) return; const k = beats.findIndex((b, i) => i >= hit && Math.abs(now - b) <= tol); if (k !== hit) { dead = true; return c.lose('rushed'); } hit++; txt.textContent = ['Slow…', 'Steady…', 'Good…', 'Nice and slow!'][Math.min(3, hit - 1)]; ring.style.borderColor = '#4cc38a'; setTimeout(() => ring.style.borderColor = '#ff8e72', 150); if (hit >= need) c.win(); };
    c.on(c.box, 'pointerdown', tap);
    c.loop(dt => { if (dead) return; now += dt; if (hit < need) { const nb = beats[hit], s = 1 + clamp((nb - now) / .9, 0, 1) * 1.1; ring.style.transform = `scale(${s})`; if (now > nb + tol) { dead = true; c.lose('late'); } }
      if (auto && hit < need && now >= beats[hit] - .02) tap(); });
    return { solve() { auto = true; } };
  } });

/* ---------- gust: crouch and hold ---------- */
def('gust', { title: 'Wind! Hold on!', time: 5.4, survive: true, death: { icon: '🪁', name: 'Blown away by the wind' },
  tip: 'In strong wind, crouch low, keep your weight centred and secure loose gear. Patagonian gusts can knock you off your feet.',
  make(c) {
    c.E('left:20px;top:20px;font-size:50px;opacity:.9', '☁️'); c.E('left:240px;top:60px;font-size:40px;opacity:.8', '☁️');
    const me = c.E('left:150px;top:192px;transform-origin:50% 100%;transition:transform .12s', c.hiker('scared', 62));
    const wind = c.E('left:0;top:120px;width:360px;font-size:54px;white-space:nowrap;opacity:0', '💨 💨 💨');
    const msg = c.E('left:0;top:300px;width:360px;text-align:center;font-size:22px;font-weight:900;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5)', 'press and HOLD when the wind comes');
    const times = [1.15 / slow(c.speed, .5), 3.1 / slow(c.speed, .5)], dur = 1.05, warn = .5; let now = 0, holding = false, auto = false, dead = false;
    const hold = v => { holding = v; me.style.transform = v ? 'scaleY(.7) scaleX(1.1)' : 'none'; };
    c.on(c.box, 'pointerdown', () => hold(true)); c.on(c.box, 'pointerup', () => hold(false)); c.on(c.box, 'pointerleave', () => hold(false));
    c.loop(dt => { if (dead) return; now += dt; let inGust = false, warned = false;
      times.forEach(t => { if (now >= t - warn && now < t) warned = true; if (now >= t && now < t + dur) inGust = true; });
      wind.style.opacity = inGust ? 1 : warned ? .55 : 0; wind.style.left = inGust ? (360 - (now % dur) / dur * 460) + 'px' : '300px'; msg.textContent = warned ? 'HOLD!' : inGust ? 'HOLD!!' : 'press and HOLD when the wind comes';
      if (auto) hold(warned || inGust);
      if (inGust && !holding && times.some(t => now > t + .22 && now < t + dur)) { dead = true; me.style.transition = 'transform .8s'; me.style.transform = 'translate(-260px,-90px) rotate(-300deg)'; c.lose('blown'); } });
    return { solve() { auto = true; } };
  } });

/* ---------- put out the fire (tap fast) ---------- */
def('fire', { title: 'Put out the fire!', time: 4.2, death: { icon: '🔥', name: 'Started a forest fire' },
  tip: 'Drown your campfire with water, stir the ashes and feel for heat. Embers left behind can start wildfires.',
  make(c) {
    c.E('left:20px;top:200px', c.hiker('scared', 54)); c.E('left:260px;top:90px;font-size:80px;line-height:1', '🌲'); c.E('left:210px;top:150px;font-size:70px;line-height:1', '🌲');
    const f = c.E('left:140px;top:150px;font-size:100px;line-height:1;transform-origin:50% 100%', '🔥'); c.E('left:150px;top:235px;font-size:36px', '🪵');
    const bucket = c.E('left:60px;top:96px;font-size:60px;line-height:1;transition:transform .08s;touch-action:none', '🪣', true);
    const bar = c.E('left:70px;top:20px;width:220px;height:20px;border-radius:99px;background:rgba(255,255,255,.7);overflow:hidden'); const fill = c.E('left:0;top:0;height:100%;width:100%;background:#ff7043;border-radius:99px', ''); bar.appendChild(fill);
    let hp = 100, done = false;
    const pour = () => { if (done) return; hp -= 11 / slow(c.speed, .4); bucket.style.transform = 'rotate(-35deg)'; setTimeout(() => bucket.style.transform = 'none', 90); if (hp <= 0) { done = true; f.innerHTML = '💨'; c.win(); } };
    c.on(c.box, 'pointerdown', pour);
    c.loop(dt => { if (done) return; hp = Math.min(100, hp + 13 * c.speed * dt); fill.style.width = Math.max(0, hp) + '%'; f.style.transform = `scale(${.5 + hp / 100})`; });
    return { solve() { hp = -1; pour(); } };
  } });
