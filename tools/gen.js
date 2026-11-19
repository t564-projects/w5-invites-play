// Generates levels.js: Meowdoku-style puzzles on a backpack.
// Each level is an N x N pack split into N coloured pockets. Each pocket holds one specific gear item.
// Rules: one item per pocket, row and column; incompatible gear can't touch (even diagonally);
// heavy gear in the lower half, light gear in the upper half.
// Every kept puzzle has exactly ONE solution and can be solved by logic alone (no guessing).
// Run: node tools/gen.js
const fs = require('fs'), path = require('path');
const { ITEMS } = require('../data.js');

const has = (id, t) => ITEMS[id].tags.includes(t);
const one = (x, y) => (has(x, 'food') && has(y, 'smelly')) || (has(x, 'wet') && (has(y, 'electronic') || has(y, 'down'))) || ((has(x, 'sharp') || has(x, 'hot')) && has(y, 'soft'));
const incompat = (a, b) => one(a, b) || one(b, a);
const weightOk = (id, r, N) => { const mid = Math.floor(N / 2), w = ITEMS[id].weight; return w === 'H' ? r >= mid : w === 'L' ? r <= mid : true; };

let seed = 20261119;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- puzzle = { N, items[k] (gear id of pocket k), region[cell] -> pocket, weight:boolean } ----
function domains(P) {
  const { N, items, region, weight } = P, d = items.map(() => []);
  for (let x = 0; x < N * N; x++) { const k = region[x]; if (!weight || weightOk(items[k], Math.floor(x / N), N)) d[k].push(x); }
  return d;
}
const compat = (P, a, x, b, y) => {
  const N = P.N, rx = Math.floor(x / N), cx = x % N, ry = Math.floor(y / N), cy = y % N;
  if (rx === ry || cx === cy) return false;
  if (Math.abs(rx - ry) === 1 && Math.abs(cx - cy) === 1 && incompat(P.items[a], P.items[b])) return false;
  return true;
};

// count solutions (up to cap) by search
function countSolutions(P, cap) {
  const d = domains(P), order = d.map((_, i) => i).sort((a, b) => d[a].length - d[b].length), placed = [];
  let count = 0, first = null;
  (function rec(n) {
    if (count >= cap) return;
    if (n === order.length) { count++; if (!first) first = placed.slice(); return; }
    const k = order[n];
    for (const x of d[k]) {
      if (placed.every(([b, y]) => compat(P, k, x, b, y))) { placed.push([k, x]); rec(n + 1); placed.pop(); }
    }
  })(0);
  return { count, first };
}

// tier-1 logic: place a pocket once it has one spot left (cross out everything it touches),
// and fill a row/column when only one pocket can still reach it.
function singles(P) {
  const { N } = P, d = domains(P).map(a => new Set(a)), K = d.length, done = new Set();
  const rows = x => Math.floor(x / N), cols = x => x % N;
  for (let g = 0; g < 200; g++) {
    let changed = false;
    for (let a = 0; a < K; a++) if (d[a].size === 1 && !done.has(a)) {
      done.add(a); const x = [...d[a]][0];
      for (let b = 0; b < K; b++) if (b !== a) for (const y of [...d[b]]) if (!compat(P, a, x, b, y)) { d[b].delete(y); changed = true; }
    }
    if (d.some(s => s.size === 0)) return false;
    for (const f of [rows, cols]) for (let line = 0; line < N; line++) {
      const reach = []; for (let a = 0; a < K; a++) if ([...d[a]].some(x => f(x) === line)) reach.push(a);
      if (reach.length === 1) { const a = reach[0]; for (const x of [...d[a]]) if (f(x) !== line) { d[a].delete(x); changed = true; } }
    }
    if (!changed) break;
  }
  return d.every(s => s.size === 1);
}

// logic solver. level 1 = eliminate by pairs + "this row/column has only one pocket left".
// level 2 adds "k pockets fit in only k rows/columns" (and the reverse) for k = 2..3.
function logic(P, allowHall) {
  const { N } = P, d = domains(P).map(a => new Set(a));
  const K = d.length, rows = x => Math.floor(x / N), cols = x => x % N;
  let usedHall = false, guard = 0;
  const subsets = (n, k) => { const out = []; (function r(s, cur) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < n; i++) { cur.push(i); r(i + 1, cur); cur.pop(); } })(0, []); return out; };
  while (guard++ < 200) {
    let changed = false;
    // pairwise support
    for (let a = 0; a < K; a++) for (const x of [...d[a]]) for (let b = 0; b < K; b++) {
      if (a === b) continue;
      let ok = false; for (const y of d[b]) if (compat(P, a, x, b, y)) { ok = true; break; }
      if (!ok) { d[a].delete(x); changed = true; break; }
    }
    if (d.some(s => s.size === 0)) return { solved: false, broken: true };
    // each row/column must hold an item: if only one pocket can reach it, that pocket goes there
    for (const f of [rows, cols]) for (let line = 0; line < N; line++) {
      const reach = []; for (let a = 0; a < K; a++) if ([...d[a]].some(x => f(x) === line)) reach.push(a);
      if (reach.length === 1) { const a = reach[0]; for (const x of [...d[a]]) if (f(x) !== line) { d[a].delete(x); changed = true; } }
    }
    if (!changed && allowHall) {
      for (let k = 2; k <= 3 && !changed; k++) for (const f of [rows, cols]) {
        // k pockets that together only reach k lines own those lines
        for (const S of subsets(K, k)) {
          const lines = new Set(); S.forEach(a => d[a].forEach(x => lines.add(f(x))));
          if (lines.size === k) for (let b = 0; b < K; b++) if (!S.includes(b)) for (const x of [...d[b]]) if (lines.has(f(x))) { d[b].delete(x); changed = true; usedHall = true; }
        }
        // k lines that only k pockets can reach belong to those pockets
        for (const T of subsets(N, k)) {
          const pk = []; for (let a = 0; a < K; a++) if ([...d[a]].some(x => T.includes(f(x)))) pk.push(a);
          if (pk.length === k) for (const a of pk) for (const x of [...d[a]]) if (!T.includes(f(x))) { d[a].delete(x); changed = true; usedHall = true; }
        }
      }
    }
    if (!changed) break;
  }
  return { solved: d.every(s => s.size === 1), usedHall };
}

function growRegions(N, seeds) {
  const region = Array(N * N).fill(-1); seeds.forEach(([x], k) => region[x] = k);
  let left = N * N - N;
  while (left > 0) {
    const cand = [];
    for (let x = 0; x < N * N; x++) if (region[x] < 0) {
      const r = Math.floor(x / N), c = x % N, nb = [];
      if (r > 0 && region[x - N] >= 0) nb.push(region[x - N]); if (r < N - 1 && region[x + N] >= 0) nb.push(region[x + N]);
      if (c > 0 && region[x - 1] >= 0) nb.push(region[x - 1]); if (c < N - 1 && region[x + 1] >= 0) nb.push(region[x + 1]);
      if (nb.length) cand.push([x, nb]);
    }
    const [x, nb] = cand[Math.floor(rnd() * cand.length)];
    region[x] = nb[Math.floor(rnd() * nb.length)]; left--;
  }
  return region;
}

function make(spec) {
  const N = spec.items.length;
  for (let t = 0; t < 3000000; t++) {
    const rows = shuffle([...Array(N).keys()]), cols = shuffle([...Array(N).keys()]);
    // the hidden answer must respect the rules
    let ok = true;
    for (let a = 0; a < N && ok; a++) {
      if (spec.weight && !weightOk(spec.items[a], rows[a], N)) ok = false;
      for (let b = a + 1; b < N && ok; b++) if (Math.abs(rows[a] - rows[b]) === 1 && Math.abs(cols[a] - cols[b]) === 1 && incompat(spec.items[a], spec.items[b])) ok = false;
    }
    if (!ok) continue;
    const seeds = spec.items.map((_, a) => [rows[a] * N + cols[a]]);
    const region = growRegions(N, seeds);
    const sizes = Array(N).fill(0); region.forEach(k => sizes[k]++);
    if (Math.min(...sizes) < 2 && spec.noSingles) continue;
    const P = { N, items: spec.items, region, weight: spec.weight };
    const res = countSolutions(P, 2);
    if (res.count !== 1) continue;
    const tier = singles(P) ? 1 : logic(P, false).solved ? 2 : logic(P, true).solved ? 3 : 4;
    if (spec.tier === 1 ? tier !== 1 : (tier < spec.tier || tier > 3)) continue;
    const sol = []; res.first.forEach(([k, x]) => sol[k] = [Math.floor(x / N), x % N]);
    return { P, sol, tier, tries: t };
  }
  return null;
}

// ---- level specs: trek, title, gear (one pocket each), rules ----
const S = [
  { trek: 'inca', title: 'Day 1 · The trailhead',          items: ['food', 'bug', 'water', 'camera', 'rain'],                     weight: false, tier: 1 },
  { trek: 'inca', title: 'Day 2 · Dead Woman’s Pass', items: ['food', 'stove', 'water', 'lamp', 'med'],                      weight: false, tier: 1 },
  { trek: 'inca', title: 'Day 3 · Phuyupatamarca camp',    items: ['water', 'food', 'tent', 'bag', 'camera', 'bug'],              weight: true,  tier: 1 },
  { trek: 'tmb',  title: 'Stage 1 · Les Houches',          items: ['water', 'food', 'jacket', 'rain', 'camera', 'lamp'],          weight: true,  tier: 1 },
  { trek: 'tmb',  title: 'Stage 3 · Col de la Seigne',     items: ['water', 'food', 'bag', 'boots', 'lamp', 'bug'],               weight: true,  tier: 2 },
  { trek: 'tmb',  title: 'Stage 5 · Grand Col Ferret',     items: ['water', 'food', 'jacket', 'rain', 'camera', 'med', 'bug'],    weight: true,  tier: 2 },
  { trek: 'paine', title: 'Day 2 · French Valley',         items: ['water', 'food', 'stove', 'tent', 'bag', 'rain', 'med'],         weight: true,  tier: 2 },
  { trek: 'paine', title: 'Day 4 · Grey Glacier camp',     items: ['water', 'food', 'stove', 'jacket', 'rain', 'lamp', 'camera'], weight: true,  tier: 2 },
  { trek: 'paine', title: 'Day 5 · Base Torres at dawn',   items: ['water', 'food', 'stove', 'tent', 'bag', 'camera', 'med'],     weight: true,  tier: 2 },
  { trek: 'kili', title: 'Day 3 · Barranco Wall',          items: ['water', 'food', 'bag', 'jacket', 'rain', 'med', 'lamp'],      weight: true,  tier: 2 },
  { trek: 'kili', title: 'Day 5 · Karanga camp',           items: ['water', 'food', 'stove', 'bag', 'boots', 'camera', 'lamp', 'bug'], weight: true, tier: 2 },
  { trek: 'ebc',  title: 'Day 3 · Namche Bazaar',          items: ['water', 'food', 'bag', 'jacket', 'axe', 'med', 'lamp'],       weight: true,  tier: 2 },
  { trek: 'ebc',  title: 'Day 6 · Lobuche',                items: ['water', 'food', 'stove', 'bag', 'axe', 'camera', 'lamp', 'med'], weight: true, tier: 2 },
  { trek: 'ebc',  title: 'Day 8 · Gorak Shep',             items: ['water', 'food', 'stove', 'bag', 'jacket', 'axe', 'boots', 'lamp'], weight: true, tier: 2 }
];

const out = [];
S.forEach((s, i) => {
  const r = make(s);
  if (!r) { console.error('NO PUZZLE for', i + 1, s.title); process.exit(1); }
  const sizes = Array(r.P.N).fill(0); r.P.region.forEach(k => sizes[k]++);
  console.log(String(i + 1).padStart(2), s.title.padEnd(32), `${r.P.N}x${r.P.N}`, '| tier', r.tier, '| tries', r.tries, '| pocket sizes', sizes.join(','));
  out.push({ trek: s.trek, title: s.title, N: r.P.N, items: s.items, weight: s.weight, tier: r.tier, region: r.P.region, solution: r.sol });
});
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'),
  '/* Generated by tools/gen.js. Do not edit by hand. */\nconst LEVELS = ' + JSON.stringify(out) + ';\nif (typeof module !== \'undefined\') module.exports = LEVELS;\n');
console.log('wrote levels.js');
