// Deterministic route building, no AI:
//  1. Pool = stops matching the theme (minus non-step-free stops if asked).
//  2. Prefer shaded: keep only shaded stops when at least 2 exist.
//  3. Start at the pool stop nearest the visitor.
//  4. Grow the walk nearest-neighbour style from the start until the time
//     budget (MIN_PER_STOP each) is used. Fully written stops count as
//     FEATURED_BONUS_M closer, so they're preferred without big detours.

import { MIN_PER_STOP } from './config.js';
import { STOPS, STOPS_BY_ID } from './data/stops.js';
import { distanceM, nearest } from './geofence.js';

export const stopsForTime = (minutes) => Math.max(2, Math.floor(minutes / MIN_PER_STOP));
export const minutesFor = (stopCount) => stopCount * MIN_PER_STOP;

function poolFor(prefs) {
  let pool = STOPS.filter((s) => s.themes.includes(prefs.theme));
  if (prefs.stepFree) pool = pool.filter((s) => s.stepFree);
  if (prefs.shaded) {
    const shaded = pool.filter((s) => s.shaded);
    if (shaded.length >= 2) pool = shaded;
  }
  return pool;
}

const FEATURED_BONUS_M = 150;

export function planRoute(prefs, userLoc, maxStops = stopsForTime(prefs.time)) {
  const pool = poolFor(prefs);
  if (!pool.length) return [];
  const order = [nearest(pool, userLoc)];
  const left = pool.filter((s) => s !== order[0]);
  const cost = (from, s) => distanceM(from, s) - (s.featured ? FEATURED_BONUS_M : 0);
  while (order.length < maxStops && left.length) {
    const last = order[order.length - 1];
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (cost(last, left[i]) < cost(last, left[bi])) bi = i;
    order.push(left.splice(bi, 1)[0]);
  }
  return keepPairs(untangle(order).map((s) => s.id));
}

// Storyline pairs the route must keep together: [first, then].
// Prototype rule: City Hall & Supreme Court always comes straight after the Padang.
const ALWAYS_NEXT = [['padang', 'city-hall-supreme-court']];

function keepPairs(ids) {
  const out = [...ids];
  for (const [first, then] of ALWAYS_NEXT) {
    const i = out.indexOf(first);
    const j = out.indexOf(then);
    if (i < 0 || j < 0 || j === i + 1) continue;
    out.splice(j, 1);
    out.splice(out.indexOf(first) + 1, 0, then);
  }
  return out;
}

// 2-opt on an open path with a fixed start: reverse any segment that makes
// the walk shorter, until nothing improves. Removes greedy zig-zags.
function untangle(path) {
  const p = [...path];
  const d = (a, b) => (a && b ? distanceM(a, b) : 0);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < p.length - 1; i++) {
      for (let k = i + 1; k < p.length; k++) {
        const delta = d(p[i - 1], p[k]) + d(p[i], p[k + 1]) - d(p[i - 1], p[i]) - d(p[k], p[k + 1]);
        if (delta < -1) {
          p.splice(i, k - i + 1, ...p.slice(i, k + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return p;
}

const same = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);

// One alternative to show in a lighter shade: shadier if possible, else shorter.
export function planAlternative(prefs, userLoc, mainIds) {
  if (!prefs.shaded) {
    const shadier = planRoute({ ...prefs, shaded: true }, userLoc);
    if (shadier.length >= 2 && !same(shadier, mainIds)) return { stopIds: shadier, kind: 'shadier' };
  }
  if (mainIds.length > 2) return { stopIds: mainIds.slice(0, -1), kind: 'shorter' };
  return null;
}

// Label for the route you'd switch back to after taking the alternative.
export const reverseKind = { shadier: 'original', shorter: 'longer', original: 'shadier', longer: 'shorter' };

export const stopsOf = (ids) => ids.map((id) => STOPS_BY_ID[id]).filter(Boolean);
