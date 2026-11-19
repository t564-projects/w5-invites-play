// Generates levels.js. For each level spec it searches for a set of blocked cells
// (zips jammed shut) so the puzzle has a small number of valid solutions.
// Run: node tools/gen.js
const fs = require('fs'), path = require('path');
const D = require('../data.js');
const { ZONES, ITEMS } = D, R = ZONES.length, C = ZONES[0].length;

// ----- rules -----
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
  if (w === 'H') return r >= 2;
  if (w === 'L') return r <= 2;
  return true;
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

// ----- solver: counts solutions up to cap -----
function solve(manifest, blocked, rules, cap) {
  const list = [];
  for (const id of Object.keys(manifest)) for (let k = 0; k < manifest[id]; k++) list.push({ id, k });
  const pl = list.map(p => placements(p.id, blocked, rules));
  if (pl.some(p => !p.length)) return { count: 0 };
  const order = list.map((_, i) => i).sort((a, b) => pl[a].length - pl[b].length);
  const grid = Array(R * C).fill(null);
  let count = 0, first = null, nodes = 0;
  const lastIdx = {};
  function rec(n) {
    if (count >= cap || nodes > 400000) return;
    if (n === order.length) { count++; if (!first) first = grid.slice(); return; }
    const i = order[n], id = list[i].id;
    for (let pi = 0; pi < pl[i].length; pi++) {
      nodes++;
      // identical copies: keep placement indices increasing to avoid counting permutations
      const prevKey = id + ':' + (list[i].k - 1);
      if (list[i].k > 0 && lastIdx[prevKey] !== undefined) {
        // only valid when the previous copy was placed already (copies are placed in order of k within `order`)
        if (pi <= lastIdx[prevKey]) continue;
      }
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
  return { count, first, truncated: nodes > 400000 };
}

// ----- seeded rng -----
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

// ----- level specs -----
const ALL = ['weight', 'food', 'wet', 'sharp'];
const S = [
  { trek: 'inca', title: 'Day 1 · The trailhead', days: 4, rules: ['weight'], max: 4000, nb: [3, 7], m: { water: 2, food: 1, rain: 1, camera: 1, med: 1, sun: 1 } },
  { trek: 'inca', title: 'Day 2 · Dead Woman’s Pass', days: 4, rules: ['weight', 'food'], max: 2000, nb: [3, 7], m: { water: 2, food: 2, rain: 1, camera: 1, med: 1, bug: 1 } },
  { trek: 'inca', title: 'Day 3 · Phuyupatamarca camp', days: 4, rules: ['weight', 'food', 'wet'], max: 600, nb: [3, 7], m: { water: 2, food: 2, tent: 1, bag: 1, rain: 1, camera: 1, bug: 1 } },
  { trek: 'tmb', title: 'Stage 1 · Les Houches', days: 5, rules: ['weight', 'food', 'wet'], max: 300, nb: [3, 7], m: { water: 2, food: 2, jacket: 1, rain: 1, camera: 1, lamp: 1, med: 1 } },
  { trek: 'tmb', title: 'Stage 4 · Col du Bonhomme', days: 5, rules: ['weight', 'food', 'wet'], max: 120, nb: [3, 7], m: { water: 2, food: 2, jacket: 1, rain: 1, camera: 1, lamp: 1, med: 1, bug: 1, sun: 1 } },
  { trek: 'paine', title: 'Day 2 · French Valley', days: 6, rules: ALL, max: 60, nb: [3, 7], m: { water: 2, food: 2, stove: 1, tent: 1, bag: 1, jacket: 1, rain: 1, med: 1 } },
  { trek: 'paine', title: 'Day 4 · Grey Glacier camp', days: 6, rules: ALL, max: 30, nb: [3, 7], m: { water: 2, food: 3, stove: 1, tent: 1, bag: 1, jacket: 1, rain: 1, lamp: 1, camera: 1 } },
  { trek: 'kili', title: 'Day 3 · Barranco Wall', days: 6, rules: ALL, max: 30, nb: [3, 7], m: { water: 2, food: 2, bag: 1, jacket: 1, rain: 1, med: 1, lamp: 1, camera: 1, boots: 1, sun: 1 } },
  { trek: 'kili', title: 'Day 5 · Karanga camp', days: 6, rules: ALL, max: 12, nb: [3, 7], m: { water: 2, food: 3, bag: 1, jacket: 1, rain: 1, med: 1, lamp: 1, boots: 1, bug: 1, camera: 1 } },
  { trek: 'ebc', title: 'Day 3 · Namche Bazaar', days: 6, rules: ALL, max: 12, nb: [3, 7], m: { water: 2, food: 2, bag: 1, jacket: 1, axe: 1, med: 1, lamp: 1, camera: 1, sun: 1 } },
  { trek: 'ebc', title: 'Day 8 · Gorak Shep', days: 6, rules: ALL, max: 6, nb: [3, 7], m: { water: 2, food: 2, stove: 1, bag: 1, jacket: 1, axe: 1, med: 1, lamp: 1, camera: 1, boots: 1 } }
];

const out = [];
S.forEach((s, li) => {
  const cells = Object.entries(s.m).reduce((a, [id, n]) => a + n * ITEMS[id].size, 0);
  let best = null;
  for (let t = 0; t < 30000 && !best; t++) {
    const hi = Math.min(R * C - 1 - cells, 11), lo = Math.min(3, hi);
    const k = lo + Math.floor(rnd() * (hi - lo + 1));
    if (cells + k > R * C - 1) continue;
    const blocked = new Set();
    while (blocked.size < k) blocked.add(Math.floor(rnd() * R * C));
    const res = solve(s.m, blocked, s.rules, s.max + 1);
    if (res.count >= 1 && res.count <= s.max && !res.truncated) best = { blocked: [...blocked].sort((a, b) => a - b), count: res.count, first: res.first };
  }
  if (!best) { console.error('NO LEVEL for', li, s.title, 'cells', cells); process.exit(1); }
  console.log(li + 1, s.title, '| cells', cells, '| blocked', best.blocked.length, '| solutions', best.count);
  out.push({ trek: s.trek, title: s.title, days: s.days, rules: s.rules, manifest: s.m,
    blocked: best.blocked.map(i => [Math.floor(i / C), i % C]), solutions: best.count,
    solution: (() => { const g = {}; best.first.forEach((c, i) => { if (c) (g[c.i] = g[c.i] || { id: c.id, cells: [] }).cells.push([Math.floor(i / C), i % C]); }); return Object.values(g); })() });
});
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'),
  '/* Generated by tools/gen.js. Do not edit by hand. */\nconst LEVELS = ' + JSON.stringify(out, null, 1) + ';\nif (typeof module !== \'undefined\') module.exports = LEVELS;\n');
console.log('wrote levels.js');
