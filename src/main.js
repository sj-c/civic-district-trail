// App orchestrator: wires location → geofences → flow (prompt, route, stops,
// navigation, stamps) and the UI pieces together.

import './styles.css';
import { API_KEY, MAP_ID, DISTRICT_CENTER, DISTRICT_ZOOM, START_LOCATION } from './config.js';
import { T } from './data/strings.js';
import { STOPS, STOPS_BY_ID, FEATURED_STOPS } from './data/stops.js';
import * as store from './store.js';
import * as loc from './location.js';
import { createTracker, distanceM, nearest, insidePolygon, bearing } from './geofence.js';
import { DISTRICT_POLYGON } from './data/district.js';
import { planRoute, planAlternative, reverseKind, stopsOf, minutesFor } from './planner.js';
import { getRoute, pathLength } from './routing.js';
import * as gmap from './map.js';
import { $, esc, announce, toast } from './ui/dom.js';
import { initSheet, showSheet, hideSheet, sheetKind, onSheetChange, setMode } from './ui/sheet.js';
import { showScreen, hideScreen } from './ui/screen.js';
import { renderPrompt } from './ui/prompt.js';
import { renderPersonalise } from './ui/personalise.js';
import { renderSummary } from './ui/summary.js';
import { createStopCard } from './ui/stopCard.js';
import { renderPassport } from './ui/passport.js';
import { renderJourneyCard } from './ui/journeyCard.js';
import { renderReward } from './ui/reward.js';
import { initDemoPanel } from './ui/demoPanel.js';
import { playStamp } from './ui/stampFx.js';
import { initHome } from './ui/home.js';
import { createNavigation } from './ui/navigation.js';

const tracker = createTracker(STOPS);
let mainGeom = null;
let altGeom = null;
let geomToken = 0;
let computing = false;
let card = null; // open stop card
let summary = null; // open summary card
let demo = null;
let lastPan = 0;
let nav = null; // active walking directions
let navHeading = 0;

// ───────────────────────── State helpers ─────────────────────────
const S = () => store.getState();
const routeIds = () => S().route?.stopIds ?? [];
const nextStopId = () => routeIds()[S().currentStopIndex] ?? null;
const isComplete = () => !!S().route && S().currentStopIndex >= routeIds().length;
const insideStop = (id) => tracker.inside.has(id);
const showAlt = () => !!S().route?.alt && S().arrived.length === 0 && Object.keys(S().stamps).length === 0;
const add = (arr, id) => (arr.includes(id) ? arr : [...arr, id]);
// In the district = inside the boundary polygon or any site's geofence.
const inDistrict = (p) => tracker.inside.size > 0 || insidePolygon(p, DISTRICT_POLYGON);

function furthestArrivedIndex() {
  const st = S();
  return routeIds().reduce((m, id, i) => (st.arrived.includes(id) ? i : m), -1);
}

function stats() {
  const st = S();
  const ids = routeIds();
  const furthest = furthestArrivedIndex();
  const legs = mainGeom?.legDistances ?? [];
  return {
    theme: T.themes[st.route?.theme ?? st.prefs.theme],
    stamps: ids.filter((id) => st.stamps[id]).length,
    total: ids.length,
    visited: ids.filter((id) => st.arrived.includes(id)).length,
    distanceM: legs.slice(0, Math.max(0, furthest)).reduce((a, b) => a + b, 0),
    path: mainGeom?.path ?? stopsOf(ids),
    stops: stopsOf(ids).map((s) => ({ ...s, collected: !!st.stamps[s.id], collectedAt: st.stamps[s.id] })),
  };
}

// ───────────────────────── Boot ─────────────────────────
function boot() {
  $('#status-time').textContent = T.statusTime;
  initHome({
    onYou: openPassport,
    onDirections: () => (S().route && !isComplete() && !S().finished ? startNav() : toast(T.home.noRouteYet)),
  });
  $('#offline-chip').textContent = `⚠ ${T.topbar.offlineRoute}`;
  $('#offline-chip').title = T.topbar.offlineRouteTitle;
  $('#recenter').setAttribute('aria-label', T.topbar.recenter);
  $('#recenter').addEventListener('click', () => (nav ? gmap.navCamera(loc.getLocation(), navHeading) : gmap.panTo(loc.getLocation())));
  $('#screen').addEventListener('keydown', (e) => e.key === 'Escape' && hideScreen());

  initSheet();
  onSheetChange(syncChrome);
  syncChrome();
  loc.initLocation(S().location);
  tracker.prime(S().location);
  demo = initDemoPanel($('#demo-panel'), demoCtx);
  // Keep the demo panel's labels in sync with any state change (one update per frame at most).
  let demoQueued = false;
  store.subscribe(() => {
    if (demoQueued) return;
    demoQueued = true;
    requestAnimationFrame(() => {
      demoQueued = false;
      demo.update();
    });
  });

  loc.onLocationChange(onLocation);

  if (!API_KEY) {
    showError('missing');
    return;
  }
  // Google calls this global when the key is rejected (bad key, referrer not allowed, API disabled).
  window.gm_authFailure = () => showError('auth', 'Google rejected the API key. The browser console shows the exact code, e.g. RefererNotAllowedMapError.');

  gmap
    .initMap($('#map'), {
      apiKey: API_KEY,
      mapId: MAP_ID,
      center: DISTRICT_CENTER,
      onPinClick: (id) => openStop(id),
      onUserDrag: (p) => {
        ensureSimulated();
        loc.stopWalk();
        loc.setLocation(p, 'drag');
      },
      onAltClick: switchToAlt,
    })
    .then(onMapReady)
    .catch((err) => showError('load', err?.message || String(err)));
}

function onMapReady() {
  const st = S();
  gmap.setUserPosition(loc.getLocation());
  refreshMapDecor();
  if (st.route) {
    loadRouteGeometry({ fit: true });
    showBaseSheet();
  } else {
    gmap.showDistrict(DISTRICT_CENTER, DISTRICT_ZOOM);
    if (st.prompt === 'accepted') openPersonalise();
    else if (st.prompt === 'shown' || (st.prompt === 'idle' && inDistrict(loc.getLocation()))) {
      store.setState({ prompt: 'shown' });
      showPrompt();
    }
  }
  demo.update();
}

function showError(kind, detail) {
  const el = $('#error');
  el.hidden = false;
  el.innerHTML = `
    <div class="error-card" role="alert">
      <div class="error-card__icon" aria-hidden="true">🗺️</div>
      <h2>${kind === 'missing' ? T.errors.missingKeyTitle : T.errors.invalidKeyTitle}</h2>
      <ol>${T.errors.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      ${detail ? `<p class="muted small">${esc(T.errors.detail(detail))}</p>` : ''}
      <button type="button" class="btn btn--primary" onclick="location.reload()">${T.errors.retry}</button>
    </div>`;
}

// ───────────────────────── Location → geofences ─────────────────────────
function onLocation(p, source) {
  gmap.setUserPosition(p);
  if (source === 'walk' && !nav && performance.now() - lastPan > 400) {
    lastPan = performance.now();
    gmap.keepInView(p);
  }
  const { inside, entered } = tracker.update(p);
  store.setState({ location: p });
  handleDistrict(p);
  updateNav(p, source);
  handleArrival(inside, entered);
  for (const id of routeIds()) if (inside.has(id)) tryAwardStamp(id);
  card?.refresh();
  summary?.refresh();
  updateApproach();
  demo.update();
}

// The prompt shows when the dot enters the Civic District boundary (or any
// site's geofence). "Not now" holds it back until the dot leaves and comes back.
function handleDistrict(p) {
  const st = S();
  if (!inDistrict(p)) {
    if (st.prompt === 'dismissed') store.setState({ prompt: 'idle' });
    return;
  }
  if (st.route || st.prompt !== 'idle' || !gmap.isReady()) return;
  loc.stopWalk(); // a demo walk pauses at the district edge while the prompt is up
  store.setState({ prompt: 'shown' });
  closeStopCard();
  showPrompt();
  announce(T.prompt.announce);
}

// Open the stop card when the dot is inside the next stop's geofence: on
// entering it, or on any move if the visitor hasn't arrived there yet (e.g. the
// route was built while already standing at the first stop).
function handleArrival(inside, entered) {
  const id = nextStopId();
  if (!id || S().finished || !inside.has(id)) return;
  if (entered.has(id) || !S().arrived.includes(id)) arriveAt(id);
}

function arriveAt(id) {
  if (nav?.target.id === id) endNav({ arrived: true });
  const first = !S().arrived.includes(id);
  store.setState((s) => ({ arrived: add(s.arrived, id) }));
  openStop(id); // refreshes in place if this card is already open
  if (first) {
    announce(T.arrive.announce(STOPS_BY_ID[id].shortName));
    redrawRoute();
  }
}

// ───────────────────────── Sheets ─────────────────────────
function showPrompt() {
  showSheet(
    'prompt',
    renderPrompt({
      time: S().prefs.time,
      onStart: (time) => {
        store.setState((s) => ({ prompt: 'accepted', prefs: { ...s.prefs, time } }));
        gmap.setDistrict(false);
        hideSheet();
        openPersonalise();
      },
      onNotNow: () => {
        store.setState({ prompt: 'dismissed' });
        gmap.setDistrict(false);
        hideSheet();
      },
    }),
    // Pull the prompt down to see the whole district on the map.
    { label: T.prompt.title, collapsible: true, peek: T.prompt.peek, onMode: (m) => setTimeout(() => frameDistrict(m), 280) },
  );
  gmap.setDistrict(true);
  setTimeout(() => {
    $('#prompt-title')?.focus({ preventScroll: true });
    frameDistrict('default');
  }, 300);
}

// Fit the Civic District outline into the map area the sheet leaves visible.
function frameDistrict(mode) {
  if (sheetKind() !== 'prompt') return;
  const bottom = mode === 'collapsed' ? 90 : $('#sheet').offsetHeight + 16;
  gmap.fitTo(gmap.districtPoints(), { top: 120, bottom, left: 24, right: 24 });
}

// Whatever should sit at the bottom when nothing more specific is open.
function showBaseSheet() {
  summary = null;
  const st = S();
  if (st.route) showSummary();
  else if (st.prompt === 'shown') showPrompt();
  else hideSheet();
}

function summaryView() {
  const st = S();
  const ids = routeIds();
  const nid = nextStopId();
  const next = nid ? STOPS_BY_ID[nid] : null;
  const alt = showAlt() ? st.route.alt : null;
  return {
    theme: st.route.theme,
    stops: stopsOf(ids).map((s) => ({ id: s.id, shortName: s.shortName, collected: !!st.stamps[s.id] })),
    minutes: minutesFor(ids.length),
    distanceM: mainGeom && !computing ? mainGeom.distanceM : 0,
    computing,
    offline: !!mainGeom?.offline,
    next: next && { id: next.id, shortName: next.shortName, index: st.currentStopIndex, inside: insideStop(next.id), distance: distanceM(next, loc.getLocation()) },
    alt: alt && { kind: alt.kind, stops: alt.stopIds.length, minutes: minutesFor(alt.stopIds.length) },
    canCut: !st.finished && furthestArrivedIndex() >= 0 && ids.length - st.currentStopIndex > 2,
    complete: st.finished || isComplete(),
    stampCount: ids.filter((id) => st.stamps[id]).length,
  };
}

function showSummary() {
  if (sheetKind() === 'summary' && summary) {
    summary.render();
    return;
  }
  summary = renderSummary({
    view: summaryView,
    onOpen: (id) => openStop(id),
    onStartNav: startNav,
    onSwitchAlt: switchToAlt,
    onCut: cutShort,
    onPassport: openPassport,
    onFinish: finishJourney,
    onSeeCard: openJourneyCard,
    onMinimise: () => setMode('collapsed'),
  });
  showSheet('summary', summary.el, { collapsible: true, label: T.summary.title });
}

function openStop(id) {
  const stop = STOPS_BY_ID[id];
  if (!stop || nav) return; // pins are inactive while navigating
  gmap.setDistrict(false);
  if (card?.id === id) {
    card.refresh();
    return;
  }
  closeStopCard({ silent: true });
  summary = null;
  card = createStopCard(stop, {
    status: () => {
      const st = S();
      const ids = routeIds();
      const i = ids.indexOf(id);
      return {
        inside: insideStop(id),
        distance: distanceM(stop, loc.getLocation()),
        hasRoute: !!st.route,
        onRoute: i >= 0,
        index: i,
        total: ids.length,
        stamped: !!st.stamps[id],
        found: st.found.includes(id),
        storyDone: st.storyDone.includes(id),
        complete: isComplete(),
        nextStop: STOPS_BY_ID[nextStopId()] ?? null,
      };
    },
    onClose: () => closeStopCard(),
    onFound: (sid) => {
      store.setState((s) => ({ found: add(s.found, sid) }));
      if (!tryAwardStamp(sid) && !insideStop(sid) && routeIds().includes(sid)) toast(T.stop.getCloser);
      card?.refresh();
    },
    onStoryDone: (sid) => {
      store.setState((s) => ({ storyDone: add(s.storyDone, sid) }));
      tryAwardStamp(sid);
      card?.refresh();
    },
    onNext: () => startNav(),
    onSeeCard: finishJourney,
  });
  showSheet('stop', card.el, { expandable: true, label: stop.name });
}

function closeStopCard({ silent = false } = {}) {
  if (!card) return;
  card.destroy();
  card = null;
  if (!silent) showBaseSheet();
}

// ───────────────────────── Personalise & route ─────────────────────────
function openPersonalise() {
  showScreen(
    renderPersonalise({
      prefs: S().prefs,
      onBuild: buildRoute,
      onBack: () => {
        hideScreen();
        store.setState({ prompt: 'shown' });
        showPrompt();
      },
    }),
    { label: T.personalise.title },
  );
}

function buildRoute(prefs) {
  const here = loc.getLocation();
  const ids = planRoute(prefs, here);
  if (ids.length < 1) {
    toast('No stops match those options. Try another theme.');
    return;
  }
  store.setState({
    prefs,
    prompt: 'accepted',
    route: { stopIds: ids, alt: planAlternative(prefs, here, ids), theme: prefs.theme },
    currentStopIndex: 0,
    arrived: [],
    stamps: {},
    found: [],
    storyDone: [],
    finished: false,
    rewardClaimed: false,
  });
  hideScreen();
  mainGeom = altGeom = null;
  gmap.clearRoutes();
  refreshMapDecor();
  loadRouteGeometry({ fit: true });
  showSummary();
}

// Routes are cached per ordered stop list, so this is cheap after the first call.
async function loadRouteGeometry({ fit = false } = {}) {
  const st = S();
  if (!st.route) return;
  const token = ++geomToken;
  computing = true;
  summary?.render();
  const [m, a] = await Promise.all([
    getRoute(stopsOf(st.route.stopIds)),
    showAlt() ? getRoute(stopsOf(st.route.alt.stopIds)) : Promise.resolve(null),
  ]);
  if (token !== geomToken) return;
  computing = false;
  mainGeom = m;
  altGeom = a;
  redrawRoute();
  $('#offline-chip').hidden = !(m?.offline || a?.offline);
  if (fit) gmap.fitTo([...m.path, ...(a?.path ?? []), loc.getLocation()]);
  summary?.render();
}

function redrawRoute() {
  if (!S().route) return gmap.clearRoutes();
  gmap.drawRoutes({ main: mainGeom, alt: showAlt() ? altGeom : null, doneLegs: Math.max(0, furthestArrivedIndex()) });
}

function switchToAlt() {
  const r = S().route;
  if (!r?.alt || !showAlt()) return;
  store.setState({
    route: { ...r, stopIds: r.alt.stopIds, alt: { stopIds: r.stopIds, kind: reverseKind[r.alt.kind] } },
    currentStopIndex: 0,
  });
  refreshMapDecor();
  loadRouteGeometry();
  toast(`${T.summary.alt[r.alt.kind]} selected`);
  showSummary();
}

// Mid-walk personalisation: keep what's been visited, then only the next 2 stops.
function cutShort() {
  const st = S();
  const ids = st.route.stopIds;
  const i = st.currentStopIndex;
  store.setState({ route: { ...st.route, stopIds: [...ids.slice(0, i), ...ids.slice(i, i + 2)], alt: null } });
  refreshMapDecor();
  loadRouteGeometry();
  toast(T.summary.cutDone);
  showSummary();
}

// ───────────────────────── Stamps ─────────────────────────
// Awarded when inside the stop's geofence AND (story finished OR detail found).
function tryAwardStamp(id) {
  const st = S();
  const ids = routeIds();
  const j = ids.indexOf(id);
  if (j < 0 || st.stamps[id] || st.finished || !insideStop(id)) return false;
  if (!st.found.includes(id) && !st.storyDone.includes(id)) return false;

  const stamps = { ...st.stamps, [id]: Date.now() };
  let idx = st.currentStopIndex;
  if (j >= idx) {
    idx = j + 1;
    while (idx < ids.length && stamps[ids[idx]]) idx++;
  }
  store.setState({ stamps, arrived: add(st.arrived, id), currentStopIndex: idx });
  syncChrome();

  const stop = STOPS_BY_ID[id];
  const n = Object.keys(stamps).filter((k) => ids.includes(k)).length;
  playStamp(stop);
  announce(T.stampFx.announce(stop.shortName, n, ids.length));
  refreshMapDecor();
  redrawRoute();
  card?.refresh();
  return true;
}


function refreshMapDecor() {
  const st = S();
  const ids = routeIds();
  gmap.updatePins({ routeIds: ids, stampIds: new Set(Object.keys(st.stamps).filter((k) => ids.includes(k))), nextId: st.finished ? null : nextStopId() });
  gmap.setGeofences(st.showGeofences, { nextId: nextStopId() });
}

// ───────────────────────── Passport, journey card, reward ─────────────────────────
function openPassport() {
  const st = S();
  showScreen(
    renderPassport({
      stops: stats().stops,
      hasRoute: !!st.route,
      finished: st.finished,
      onBack: hideScreen,
      onFinish: finishJourney,
      onOpen: (id) => {
        hideScreen();
        openStop(id);
      },
    }),
    { label: T.passport.title },
  );
}

function finishJourney() {
  if (!S().route) return;
  loc.stopWalk();
  store.setState({ finished: true });
  closeStopCard({ silent: true });
  refreshMapDecor();
  showBaseSheet();
  openJourneyCard();
}

function openJourneyCard() {
  showScreen(renderJourneyCard({ ...stats(), onBack: hideScreen, onClaim: openReward }), { label: T.journey.title });
}

function openReward() {
  showScreen(
    renderReward({
      stamps: stats().stamps,
      claimed: S().rewardClaimed,
      onClaim: () => store.setState({ rewardClaimed: true }),
      onBack: openJourneyCard,
    }),
    { label: T.reward.title },
  );
}

// ───────────────────────── Demo mode ─────────────────────────
function ensureSimulated() {
  if (!loc.isGpsOn()) return;
  loc.stopGps();
  toast(T.demo.gpsOffAuto);
  demo.update();
}

// Path (and turn-by-turn steps) for the leg to stop idx: join the routed leg
// at its closest point to the visitor, end exactly on the pin.
function legRoute(idx, here, target) {
  const leg = idx > 0 ? mainGeom?.legs?.[idx - 1] : null;
  if (!leg?.length) return { path: [here, { lat: target.lat, lng: target.lng }], steps: [] };
  let bi = 0;
  let bd = Infinity;
  leg.forEach((p, i) => {
    const d = distanceM(p, here);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  const path = [here, ...leg.slice(bi)];
  if (distanceM(path[path.length - 1], target) > 1) path.push({ lat: target.lat, lng: target.lng });
  return { path, steps: mainGeom.legSteps?.[idx - 1] ?? [] };
}

// The map-app home chrome (tab bar, "Be in the know") shows only when nothing else is up.
function syncChrome() {
  const app = $('#app');
  const home = !nav && !sheetKind();
  app.classList.toggle('home', home);
  // Route view: the stops card replaces the search bar at the top.
  app.classList.toggle('routing', !nav && sheetKind() === 'summary' && !!S().route && !isComplete() && !S().finished);
  updateApproach();
}

// Dotted line from the blue dot to the next stop, like Google's "your location" leg.
function updateApproach() {
  const id = nextStopId();
  const show = !nav && S().route && !S().finished && id && !insideStop(id);
  gmap.setApproach(show ? [loc.getLocation(), STOPS_BY_ID[id]] : null);
}

// ───────────────────────── Walking directions ─────────────────────────
function startNav() {
  const id = nextStopId();
  if (!id || nav || !gmap.isReady()) return;
  if (insideStop(id)) return openStop(id);
  const target = STOPS_BY_ID[id];
  const here = loc.getLocation();
  const { path, steps } = legRoute(S().currentStopIndex, here, target);
  closeStopCard({ silent: true });
  hideSheet();
  summary = null;
  gmap.setDistrict(false);
  $('#app').classList.add('navigating');
  nav = createNavigation({ path, steps, target, onExit: () => endNav(), onRecentre: () => gmap.navCamera(loc.getLocation(), navHeading) });
  navHeading = bearing(here, path[1] ?? target);
  syncChrome();
  updateNav(here, 'start');
  announce(T.nav.started(target.shortName));
  demo.update();
}

const turnToward = (h, goal, f) => (h + (((goal - h + 540) % 360) - 180) * f + 360) % 360;

function updateNav(p, source) {
  if (!nav) return;
  const r = nav.update(p);
  navHeading = source === 'walk' ? turnToward(navHeading, r.heading, 0.12) : r.heading;
  gmap.setNavPath(r.rest);
  if (source !== 'drag') gmap.navCamera(p, navHeading); // don't move the map under a dragging finger
  gmap.setUserHeading(r.heading);
}

function endNav({ arrived = false, silent = false } = {}) {
  if (!nav) return;
  const { target } = nav;
  nav.destroy();
  nav = null;
  $('#app').classList.remove('navigating');
  syncChrome();
  gmap.setNavPath(null);
  gmap.setUserHeading(null);
  gmap.resetCamera();
  if (silent) return;
  if (arrived) toast(T.nav.arrived(target.shortName));
  else {
    showBaseSheet();
    gmap.fitTo([loc.getLocation(), target]);
  }
  demo.update();
}

async function walkNext() {
  if (!gmap.isReady() || loc.isWalking()) return;
  ensureSimulated();
  const st = S();
  const here = loc.getLocation();
  let target;
  let path;
  if (!st.route) {
    target = nearest(FEATURED_STOPS, here);
    path = [here, target];
  } else {
    if (st.finished || isComplete()) return;
    let idx = st.currentStopIndex;
    const ids = st.route.stopIds;
    // Already standing at the current stop? Move on to the next one.
    if (insideStop(ids[idx]) && st.arrived.includes(ids[idx]) && idx < ids.length - 1) {
      idx++;
      store.setState({ currentStopIndex: idx });
      refreshMapDecor();
    }
    target = STOPS_BY_ID[ids[idx]];
    path = legRoute(idx, here, target).path;
    if (!nav) {
      if (card) closeStopCard();
      else showBaseSheet();
    }
  }
  const dist = pathLength(path);
  // Sped-up walking: ~5–8 s per leg, quicker for a few steps to a pin.
  const duration = dist < 100 ? 2500 : Math.min(8000, Math.max(5000, dist * 25));
  if (!nav) gmap.fitTo(path, { top: 120, bottom: 320, left: 50, right: 50 });
  const walking = loc.walkAlong(path, duration);
  demo.update();
  const ok = await walking;
  demo.update();
  if (ok && S().route && target.id === nextStopId() && insideStop(target.id)) arriveAt(target.id);
}

function walkLabel() {
  const st = S();
  if (!st.route) return T.demo.walkInto;
  if (st.finished || isComplete()) return T.demo.walkDone;
  const ids = st.route.stopIds;
  let idx = st.currentStopIndex;
  if (insideStop(ids[idx]) && st.arrived.includes(ids[idx]) && idx < ids.length - 1) idx++;
  return T.demo.walkNext(STOPS_BY_ID[ids[idx]].shortName);
}

const demoCtx = {
  view: () => {
    const st = S();
    return {
      walking: loc.isWalking(),
      walkLabel: walkLabel(),
      walkDisabled: !gmap.isReady() || (!!st.route && (st.finished || isComplete())),
    };
  },
  onWalk: walkNext,
  onStopWalk: () => {
    loc.stopWalk();
    demo.update();
  },
  onReset: resetDemo,
};

function resetDemo() {
  endNav({ silent: true });
  gmap.setDistrict(false);
  loc.stopWalk();
  loc.stopGps();
  closeStopCard({ silent: true });
  hideScreen();
  hideSheet();
  summary = null;
  geomToken++;
  computing = false;
  mainGeom = altGeom = null;
  store.resetState();
  gmap.clearRoutes();
  $('#offline-chip').hidden = true;
  tracker.prime(START_LOCATION);
  loc.teleport(START_LOCATION);
  refreshMapDecor();
  gmap.showDistrict(DISTRICT_CENTER, DISTRICT_ZOOM);
  demo.update();
  toast('Demo reset');
}

boot();
