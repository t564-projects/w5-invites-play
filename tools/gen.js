// Generates levels.js, Meowdoku style: each level is a pack with a few items already
// locked in place (clues). The solver picks the fewest clues that leave a small number
// of valid solutions, so the rest has to be worked out from the rules.
// Run: node tools/gen.js
const fs = require('fs'), path = require('path');
const D = require('../data.js');
const { ZONES, ITEMS } = D, R = ZONES.length, C = ZONES[0].length;

// ----- rules (must match game.js) -----
const has = (id, t) => ITEMS[id].tags.includes(t);
function conflict(a, b, rules) {
  const pair = (x, y) => (
    (rules.includes('food') && has(x, 'food') && has(y, 'smelly')) ||
    (rules.includes('wet') && has(x, 'wet') && (has(y, 'electronic') || has(y, 'down'))) ||
    (rules.includes('sharp') && (has(x, 'sharp') || has(x, 'hot')) && has(y, 'soft')));
  return pair(a, b) || pair(b, a);
}
function rowOk(id, r, rules) {
  if (!rules.includes('weight')) return true;
  const w = ITEMS[id].weight;
  return w === 'H' ? r >= 2 : w === 'L' ? r <= 2 : true;
}
function placements(id, blocked, rules) {
  const it = ITEMS[id], out = [];
  const shapes = it.size === 1 ? [[[0, 0]]] : [[[0, 0], [0, 1]], [[0, 0], [1, 0]]];
  for (const sh of shapes) for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const cells = sh.map(([dr, dc]) => [r + dr, c + dc]);
    if (cells.every(([rr, cc]) => rr < R && cc < C && !blocked.has(rr * C + cc) && it.zones.includes(ZONES[rr][cc]) && rowOk(id, rr, rules))) out.push(cells);
  }
  return out;
}

let seed = 987654;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ----- solver: counts solutions up to cap; `fixed` items are already placed -----
function solve(manifest, blocked, rules, cap, fixed = [], randomize = false) {
  const m = { ...manifest }; fixed.forEach(f => m[f.id]--);
  const list = [];
  for (const id of Object.keys(m)) for (let k = 0; k < m[id]; k++) list.push({ id, k });
  const pl = list.map(p => { const a = placements(p.id, blocked, rules); return randomize ? shuffle(a) : a; });
  if (pl.some(p => !p.length)) return { count: 0 };
  const order = list.map((_, i) => i).sort((a, b) => pl[a].length - pl[b].length);
  const grid = Array(R * C).fill(null);
  fixed.forEach((f, fi) => f.cells.forEach(([r, c]) => grid[r * C + c] = { id: f.id, i: -1 - fi }));
  let count = 0, first = null, nodes = 0;
  const lastIdx = {};
  function rec(n) {
    if (count >= cap || nodes > 600000) return;
    if (n === order.length) { count++; if (!first) first = grid.slice(); return; }
    const i = order[n], id = list[i].id;
    for (let pi = 0; pi < pl[i].length; pi++) {
      nodes++;
      const prev = id + ':' + (list[i].k - 1);
      if (list[i].k > 0 && lastIdx[prev] !== undefined && pi <= lastIdx[prev]) continue; // identical copies: no permutations
      const cells = pl[i][pi];
      if (cells.some(([r, c]) => grid[r * C + c] !== null)) continue;
      let ok = true;
      for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= R || cc >= C) continue;
        const o = grid[rr * C + cc];
        if (o && o.i !== i && conflict(id, o.id, rules)) ok = false;
      }
      if (!ok) continue;
      cells.forEach(([r, c]) => grid[r * C + c] = { id, i });
      lastIdx[id + ':' + list[i].k] = pi;
      rec(n + 1);
      delete lastIdx[id + ':' + list[i].k];
      cells.forEach(([r, c]) => grid[r * C + c] = null);
    }
  }
  rec(0);
  return { count, first, truncated: nodes > 600000 };
}
function itemsOf(grid) {
  const g = {};
  grid.forEach((c, i) => { if (c) (g[c.i] = g[c.i] || { id: c.id, cells: [] }).cells.push([Math.floor(i / C), i % C]); });
  return Object.values(g);
}

// ----- level specs: `max` = most solutions allowed once the clues are added -----
const ALL = ['weight', 'food', 'wet', 'sharp'];
const S = [
  { trek: 'inca', title: 'Day 1 · The trailhead', days: 4, rules: ['weight'], max: 40, m: { water: 2, food: 1, rain: 1, camera: 1, med: 1, sun: 1 } },
  { trek: 'inca', title: 'Day 2 · Dead Woman’s Pass', days: 4, rules: ['weight', 'food'], max: 24, m: { water: 2, food: 2, rain: 1, camera: 1, med: 1, bug: 1 } },
  { trek: 'inca', title: 'Day 3 · Phuyupatamarca camp', days: 4, rules: ['weight', 'food', 'wet'], max: 12, m: { water: 2, food: 2, tent: 1, bag: 1, rain: 1, camera: 1, bug: 1 } },
  { trek: 'tmb', title: 'Stage 1 · Les Houches', days: 5, rules: ['weight', 'food', 'wet'], max: 8, m: { water: 2, food: 2, jacket: 1, rain: 1, camera: 1, lamp: 1, med: 1 } },
  { trek: 'tmb', title: 'Stage 4 · Col du Bonhomme', days: 5, rules: ['weight', 'food', 'wet'], max: 4, m: { water: 2, food: 2, jacket: 1, rain: 1, camera: 1, lamp: 1, med: 1, bug: 1, sun: 1 } },
  { trek: 'paine', title: 'Day 2 · French Valley', days: 6, rules: ALL, max: 3, m: { water: 2, food: 2, stove: 1, tent: 1, bag: 1, jacket: 1, rain: 1, med: 1 } },
  { trek: 'paine', title: 'Day 4 · Grey Glacier camp', days: 6, rules: ALL, max: 2, m: { water: 2, food: 3, stove: 1, tent: 1, bag: 1, jacket: 1, rain: 1, lamp: 1, camera: 1 } },
  { trek: 'kili', title: 'Day 3 · Barranco Wall', days: 6, rules: ALL, max: 2, m: { water: 2, food: 2, bag: 1, jacket: 1, rain: 1, med: 1, lamp: 1, camera: 1, boots: 1, sun: 1 } },
  { trek: 'kili', title: 'Day 5 · Karanga camp', days: 6, rules: ALL, max: 1, m: { water: 2, food: 3, bag: 1, jacket: 1, rain: 1, med: 1, lamp: 1, boots: 1, bug: 1, camera: 1 } },
  { trek: 'ebc', title: 'Day 3 · Namche Bazaar', days: 6, rules: ALL, max: 1, m: { water: 2, food: 2, bag: 1, jacket: 1, axe: 1, med: 1, lamp: 1, camera: 1, sun: 1 } },
  { trek: 'ebc', title: 'Day 8 · Gorak Shep', days: 6, rules: ALL, max: 1, m: { water: 2, food: 2, stove: 1, bag: 1, jacket: 1, axe: 1, med: 1, lamp: 1, camera: 1, boots: 1 } }
];

const out = [];
S.forEach((s, li) => {
  let best = null;
  for (let t = 0; t < 120; t++) {
    const blocked = new Set(); const nb = Math.floor(rnd() * 4);
    while (blocked.size < nb) blocked.add(Math.floor(rnd() * R * C));
    const base = solve(s.m, blocked, s.rules, 1, [], true);
    if (!base.count) continue;
    const sol = itemsOf(base.first);
    // add clues one at a time, always the one that cuts the solution count the most
    let fixed = [], left = sol.slice(), cnt = solve(s.m, blocked, s.rules, 400, fixed).count;
    while (cnt > s.max && left.length && (!best || fixed.length < best.fixed.length)) {
      let pick = null;
      for (const cand of left) {
        const c = solve(s.m, blocked, s.rules, 400, [...fixed, cand]).count;
        if (!pick || c < pick.c || (c === pick.c && rnd() < .3)) pick = { cand, c };
      }
      fixed.push(pick.cand); left = left.filter(x => x !== pick.cand); cnt = pick.c;
    }
    if (cnt <= s.max && cnt >= 1 && (!best || fixed.length < best.fixed.length)) best = { blocked, fixed, count: cnt, sol };
  }
  if (!best) { console.error('NO LEVEL', li + 1, s.title); process.exit(1); }
  const total = Object.values(s.m).reduce((a, b) => a + b, 0);
  console.log(li + 1, s.title.padEnd(32), '| items', total, '| clues', best.fixed.length, '| jammed', best.blocked.size, '| solutions', best.count);
  out.push({ trek: s.trek, title: s.title, days: s.days, rules: s.rules, manifest: s.m,
    blocked: [...best.blocked].sort((a, b) => a - b).map(i => [Math.floor(i / C), i % C]),
    fixed: best.fixed, solutions: best.count, solution: best.sol });
});
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'),
  '/* Generated by tools/gen.js. Do not edit by hand. */\nconst LEVELS = ' + JSON.stringify(out) + ';\nif (typeof module !== \'undefined\') module.exports = LEVELS;\n');
console.log('wrote levels.js');
