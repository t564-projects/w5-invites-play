// Generates levels.js for "Climb High, Sleep Low".
// A level = a stretch of a real trek, a number of days, a daily walking limit and a few lodges that are full on some nights.
// The solver counts the valid itineraries so each level has only a few answers to find by reasoning.
// Run: node tools/gen.js
const fs = require('fs'), path = require('path');
const { ROUTES } = require('../data.js');

// ---- the rules (must match game.js) ----
const RULES = { maxGain: 500, base: 3000, maxGainingNights: 3 };
const hoursBetween = (nodes, a, b) => { let h = 0; for (let i = a; i < b; i++) { const d = nodes[i + 1].km - nodes[i].km, up = Math.max(0, nodes[i + 1].alt - nodes[i].alt); h += d / 2.5 + up / 500; } return h; };
const effGain = (prevAlt, alt) => alt > RULES.base ? Math.max(0, alt - Math.max(prevAlt, RULES.base)) : 0;

// Itinerary = the village slept in on each of the first D-1 nights; night D is spent at the end of the stretch.
// Returns the list of problems (empty = valid).
function check(route, L, nights) {
  const nodes = route.nodes, probs = [];
  let from = L.start, prevAlt = nodes[L.start].alt, streak = 0;
  const stops = nights.concat([L.end]);
  stops.forEach((to, i) => {
    const last = i === nights.length;
    if (to < from) { probs.push({ day: i, kind: 'back' }); return; }
    const h = hoursBetween(nodes, from, to);
    if (h > L.maxHours + 1e-9) probs.push({ day: i, kind: 'hours', h });
    if (L.full.some(([v, n]) => v === to && n === i + 1)) probs.push({ day: i, kind: 'full' });
    const g = effGain(prevAlt, nodes[to].alt);
    if (L.rules.includes('gain') && g > RULES.maxGain) probs.push({ day: i, kind: 'gain', g });
    if (nodes[to].alt > RULES.base && nodes[to].alt > prevAlt) streak++; else streak = 0;
    if (L.rules.includes('rest') && streak > RULES.maxGainingNights) probs.push({ day: i, kind: 'rest' });
    if (last && to === from) probs.push({ day: i, kind: 'noprogress' });
    prevAlt = nodes[to].alt; from = to;
  });
  return probs;
}
function solve(route, L, cap) {
  const nn = L.days - 1, sols = [];
  (function rec(i, from, seq) {
    if (sols.length >= cap) return;
    if (i === nn) { if (!check(route, L, seq).length) sols.push(seq.slice()); return; }
    for (let v = from; v < L.end; v++) { seq.push(v); rec(i + 1, v, seq); seq.pop(); }
  })(0, L.start, []);
  return sols;
}

let seed = 424242;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const route = ROUTES.ebc, idx = id => route.nodes.findIndex(n => n.id === id);
const SPECS = [
  { title: 'Lukla to Namche Bazaar', start: 'lukla', end: 'namche', rules: ['hours'], max: 2, days: [2, 2] },
  { title: 'Namche Bazaar to Dingboche', start: 'namche', end: 'dingboche', rules: ['hours', 'gain'], max: 2, days: [3, 4] },
  { title: 'Lukla to Dingboche', start: 'lukla', end: 'dingboche', rules: ['hours', 'gain'], max: 3, days: [4, 6] },
  { title: 'Dingboche to Gorak Shep', start: 'dingboche', end: 'gorak', rules: ['hours', 'gain', 'rest'], max: 2, days: [3, 4] },
  { title: 'Lukla to Lobuche', start: 'lukla', end: 'lobuche', rules: ['hours', 'gain', 'rest'], max: 3, days: [6, 8] },
  { title: 'Lukla to Everest Base Camp', start: 'lukla', end: 'ebc', rules: ['hours', 'gain', 'rest'], max: 3, days: [7, 9] }
];
const out = [];
SPECS.forEach((sp, li) => {
  const start = idx(sp.start), end = idx(sp.end); let best = null;
  for (let t = 0; t < 20000 && !best; t++) {
    const base = { start, end, days: sp.days[0] + Math.floor(rnd() * (sp.days[1] - sp.days[0] + 1)), rules: sp.rules, maxHours: [5.5, 6, 6.5, 7][Math.floor(rnd() * 4)], full: [] };
    const nfull = Math.floor(rnd() * 4);
    for (let k = 0; k < nfull; k++) { const f = [start + 1 + Math.floor(rnd() * (end - start)), 1 + Math.floor(rnd() * base.days)]; if (!base.full.some(g => g[0] === f[0] && g[1] === f[1])) base.full.push(f); }
    if (base.days - 1 < 1) continue;
    const sols = solve(route, base, sp.max + 1);
    const minDays = null;
    if (sols.length >= 1 && sols.length <= sp.max) {
      // prefer harder levels: more nights, fewer solutions
      const score = base.days * 10 - sols.length;
      if (!best || score > best.score) best = { ...base, sols, score };
    }
  }
  if (!best) { console.error('NO LEVEL', sp.title); process.exit(1); }
  // drop "full lodge" notes that don't change the answer, so every clue matters
  for (let k = best.full.length - 1; k >= 0; k--) {
    const trial = { ...best, full: best.full.filter((_, j) => j !== k) };
    const again = solve(route, trial, 99);
    if (again.length === best.sols.length) { best.full = trial.full; }
  }
  console.log(String(li + 1).padStart(2), sp.title.padEnd(40), '| days', best.days, '| max h', best.maxHours, '| full', JSON.stringify(best.full.map(([v, n]) => route.nodes[v].name + '@' + n)), '| solutions', best.sols.length);
  out.push({ trek: 'ebc', title: sp.title, start: sp.start, end: sp.end, days: best.days, rules: sp.rules, maxHours: best.maxHours,
    full: best.full.map(([v, n]) => [route.nodes[v].id, n]), solutions: best.sols.map(s => s.map(v => route.nodes[v].id)) });
});
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'),
  '/* Generated by tools/gen.js. Do not edit by hand. */\nconst LEVELS = ' + JSON.stringify(out) + ';\nif (typeof module !== \'undefined\') module.exports = LEVELS;\n');
console.log('wrote levels.js');
