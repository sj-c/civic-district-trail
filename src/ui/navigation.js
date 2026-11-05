// Turn-by-turn walking navigation to the next stop, Google Maps style:
// green instruction banner on top, ETA bar with Exit at the bottom. The same
// currentLocation updates drive it in simulated and real-GPS modes.

import { T } from '../data/strings.js';
import { $, esc, formatDistance, toast } from './dom.js';
import { distanceM, bearing } from '../geofence.js';
import { icon as uiIcon, COMPASS as COMPASS_ICON } from './icons.js';

const WALK_M_PER_MIN = 80; // ≈ 4.8 km/h
const ARRIVING_M = 35;

const ICONS = {
  straight: '<path d="M11 20V8.8l-4.6 4.6L5 12l7-7 7 7-1.4 1.4L13 8.8V20z"/>',
  right: '<path d="M6 20v-7a4 4 0 0 1 4-4h6.2l-2.6-2.6L15 5l5 5-5 5-1.4-1.4 2.6-2.6H10a2 2 0 0 0-2 2v7z"/>',
  uturn: '<path d="M16 20V9a4 4 0 0 0-8 0v4.2l2.6-2.6L12 12l-5 5-5-5 1.4-1.4L6 13.2V9a6 6 0 0 1 12 0v11z"/>',
  dest: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
};

function icon(maneuver = '', arriving = false) {
  const m = maneuver.toUpperCase();
  const mirror = /LEFT/.test(m);
  let body;
  if (arriving) body = ICONS.dest;
  else if (/UTURN/.test(m)) body = ICONS.uturn;
  else if (/SLIGHT|FORK|RAMP|MERGE|KEEP/.test(m) && /LEFT|RIGHT/.test(m)) body = `<g transform="rotate(${mirror ? -40 : 40} 12 12)">${ICONS.straight}</g>`;
  else if (/LEFT|RIGHT/.test(m)) body = ICONS.right;
  else body = ICONS.straight;
  const flip = mirror && !arriving && !/SLIGHT|FORK|RAMP|MERGE|KEEP/.test(m) ? ' transform="scale(-1 1) translate(-24 0)"' : '';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"${flip}>${body}</g></svg>`;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const compass = (deg) => COMPASS[Math.round(deg / 45) % 8];

// "Walk south-west on St Andrew's Rd" → small "on" + big "St Andrew's Rd".
function bannerText(text) {
  const m = /^(.*?)\s+(onto|on|towards|toward|to)\s+(.+)$/i.exec(text || '');
  if (!m) return `<span class="nav__big">${esc(text)}</span>`;
  return `<span class="nav__small">${esc(m[2])}</span> <span class="nav__big">${esc(m[3])}</span>`;
}

// Local planar projection (metres) for point-to-segment maths.
function project(p, a, b) {
  const k = Math.cos((a.lat * Math.PI) / 180) * 111320;
  const bx = (b.lng - a.lng) * k;
  const by = (b.lat - a.lat) * 110540;
  const px = (p.lng - a.lng) * k;
  const py = (p.lat - a.lat) * 110540;
  const len2 = bx * bx + by * by;
  const t = len2 ? Math.max(0, Math.min(1, (px * bx + py * by) / len2)) : 0;
  const dx = px - t * bx;
  const dy = py - t * by;
  return { t, off: Math.hypot(dx, dy), point: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t } };
}

// path: [{lat,lng}] from the visitor to the stop. steps: [{text, detail, maneuver, distanceM}].
export function createNavigation({ path, steps, target, onExit, onRecentre }) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + distanceM(path[i - 1], path[i]));
  const total = cum[cum.length - 1] || distanceM(path[0], target);
  if (!steps?.length) {
    steps = [{ text: T.nav.towards(compass(bearing(path[0], target)), target.shortName), detail: '', maneuver: 'DEPART', distanceM: total }];
  }
  const stepTotal = steps.reduce((a, s) => a + s.distanceM, 0) || total;
  const scale = total / stepTotal; // our path may start a few metres before the routed leg
  const stepEnds = [];
  steps.reduce((a, s, i) => (stepEnds[i] = a + s.distanceM * scale), 0);

  const el = $('#nav');
  el.innerHTML = `
    <div class="nav__top" role="status" aria-live="polite" aria-label="${T.nav.label}">
      <div class="nav__banner">
        <div class="nav__turn">
          <span class="nav__icon" data-slot="icon"></span>
          <span class="nav__dist" data-slot="dist"></span>
        </div>
        <p class="nav__instr" data-slot="instr"></p>
      </div>
      <div class="nav__then" data-slot="then"></div>
    </div>
    <div class="nav__side">
      <button type="button" class="nav__round" data-act="decor" aria-label="${T.nav.compass}">${COMPASS_ICON}</button>
      <button type="button" class="nav__round" data-act="decor" aria-label="${T.nav.search}">${uiIcon('search')}</button>
      <button type="button" class="nav__round nav__round--alert" data-act="decor" aria-label="${T.nav.sound}">${uiIcon('mute')}</button>
      <button type="button" class="nav__round" data-act="decor" aria-label="${T.nav.routes}">${uiIcon('fork')}</button>
    </div>
    <button type="button" class="nav__recentre" data-act="recentre">${uiIcon('start', 18)} ${T.nav.recentre}</button>
    <div class="nav__bar">
      <span class="nav__grip" aria-hidden="true"></span>
      <div class="nav__eta">
        <strong><span data-slot="mins"></span> <span class="nav__walk">${uiIcon('walk', 24)}</span></strong>
        <span data-slot="meta"></span>
      </div>
      <button type="button" class="nav__assist" data-act="decor" aria-label="${T.nav.assistant}">${uiIcon('spark', 26)}</button>
      <button type="button" class="nav__exit" data-act="exit">${T.nav.exit}</button>
    </div>`;
  el.hidden = false;
  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'exit') onExit();
    else if (b.dataset.act === 'recentre') onRecentre?.();
    else if (b.dataset.act === 'decor') toast(T.home.notInPrototype);
  };
  requestAnimationFrame(() => el.classList.add('open'));

  const slot = (n) => el.querySelector(`[data-slot="${n}"]`);
  const put = (n, html) => {
    const s = slot(n);
    if (s.__html !== html) s.innerHTML = s.__html = html;
  };

  function update(loc) {
    // Where are we along the path?
    let best = { off: Infinity };
    for (let i = 1; i < path.length; i++) {
      const pr = project(loc, path[i - 1], path[i]);
      if (pr.off < best.off) best = { ...pr, i, along: cum[i - 1] + pr.t * (cum[i] - cum[i - 1]) };
    }
    const along = path.length > 1 ? best.along : 0;
    const remaining = path.length > 1 ? Math.max(0, total - along) + best.off : distanceM(loc, target);

    // Heading: look ~20 m ahead along the path.
    let ahead = target;
    const goal = along + 20;
    for (let i = 1; i < path.length; i++) {
      if (cum[i] >= goal) {
        const f = (goal - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
        ahead = { lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * f, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * f };
        break;
      }
    }
    const heading = distanceM(loc, ahead) > 2 ? bearing(loc, ahead) : bearing(loc, target);

    // Current step and the one after it.
    let k = stepEnds.findIndex((end) => end > along + 1);
    if (k < 0) k = steps.length - 1;
    const arriving = remaining < ARRIVING_M;
    const cur = steps[k];
    const next = steps[k + 1];
    if (arriving) {
      put('icon', icon('', true));
      put('dist', '');
      put('instr', `<span class="nav__big">${esc(T.nav.arriving(target.shortName))}</span>`);
      put('then', '');
    } else {
      put('icon', icon(cur.maneuver));
      put('dist', esc(formatDistance(Math.max(5, stepEnds[k] - along))));
      put('instr', bannerText(cur.text));
      put('then', next ? `<span>${T.nav.then}</span>${icon(next.maneuver)}<span class="nav__then-text">${esc(next.text)}</span>` : '');
    }
    slot('then').hidden = arriving || !next;

    const mins = Math.max(1, Math.ceil(remaining / WALK_M_PER_MIN));
    const eta = new Date(Date.now() + mins * 60000).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' });
    put('mins', esc(T.nav.min(mins)));
    put('meta', esc(`${formatDistance(remaining)} · ${T.nav.arriveAt(eta)}`));

    const rest = path.length > 1 ? [best.point, ...path.slice(best.i)] : [loc, target];
    return { remaining, heading, rest };
  }

  function destroy() {
    el.classList.remove('open');
    setTimeout(() => {
      if (el.classList.contains('open')) return;
      el.hidden = true;
      el.innerHTML = '';
    }, 260);
  }

  return { target, path, update, destroy };
}
