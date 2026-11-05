// Google Maps: loading, markers, the blue dot, route lines, geofence circles,
// the Civic District outline and the navigation camera.

import { STOPS } from './data/stops.js';
import { DISTRICT_POLYGON, DISTRICT_LABEL_AT } from './data/district.js';
import { T } from './data/strings.js';

let map = null;
let gm = null; // google.maps namespace
let AdvancedMarkerElement = null;
const pinMarkers = new Map();
let userMarker = null;
let userDragging = false;
let routeLines = [];
let altLines = [];
let circles = [];
let districtFill = null;
let districtLine = null;
let districtLabel = null;
let navLine = null;
let approachLine = null;

// Inline bootstrap loader: loads the Maps JS API once, then importLibrary()
// is available for each library we need.
function loadScript(apiKey) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  return new Promise((resolve, reject) => {
    const cb = '__civicTrailMapsReady';
    window[cb] = () => resolve(window.google.maps);
    const params = new URLSearchParams({ key: apiKey, v: 'weekly', loading: 'async', callback: cb, language: 'en-GB', region: 'SG' });
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => reject(new Error('The Google Maps script could not be downloaded (check your internet connection).'));
    document.head.appendChild(s);
  });
}

export async function initMap(el, { apiKey, mapId, center, onPinClick, onUserDrag, onAltClick }) {
  gm = await loadScript(apiKey);
  const [{ Map }, marker] = await Promise.all([gm.importLibrary('maps'), gm.importLibrary('marker')]);
  AdvancedMarkerElement = marker.AdvancedMarkerElement;

  map = new Map(el, {
    center,
    zoom: 16,
    mapId,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
  });

  for (const stop of STOPS) {
    const content = document.createElement('div');
    content.className = `pin ${stop.featured ? 'pin--featured' : 'pin--soon'}`;
    content.innerHTML = `<div class="pin__head"><span class="pin__label">${stop.number}</span></div><span class="pin__name"></span>`;
    const m = new AdvancedMarkerElement({ map, position: { lat: stop.lat, lng: stop.lng }, content, title: stop.name, zIndex: stop.featured ? 20 : 10, gmpClickable: true });
    m.addEventListener('gmp-click', () => onPinClick(stop.id));
    pinMarkers.set(stop.id, { marker: m, content });
  }

  const dot = document.createElement('div');
  dot.className = 'user-dot';
  dot.innerHTML = '<span class="user-dot__halo"></span><span class="user-dot__core"></span><span class="user-dot__arrow"></span>';
  userMarker = new AdvancedMarkerElement({ map, content: dot, gmpDraggable: true, zIndex: 1000, title: 'You (drag to move)' });
  const dragPos = (e) => {
    const p = e.latLng ?? userMarker.position;
    return typeof p.lat === 'function' ? { lat: p.lat(), lng: p.lng() } : { lat: p.lat, lng: p.lng };
  };
  userMarker.addEventListener('gmp-dragstart', () => (userDragging = true));
  userMarker.addEventListener('gmp-drag', (e) => onUserDrag(dragPos(e)));
  userMarker.addEventListener('gmp-dragend', (e) => {
    userDragging = false;
    onUserDrag(dragPos(e));
  });

  // Civic District outline: dashed line + a fill/label shown while highlighted.
  districtFill = new gm.Polygon({ map, paths: DISTRICT_POLYGON, strokeOpacity: 0, fillColor: '#1a73e8', fillOpacity: 0, clickable: false, zIndex: 0 });
  districtLine = new gm.Polyline({ map, path: [...DISTRICT_POLYGON, DISTRICT_POLYGON[0]], strokeOpacity: 0, clickable: false, zIndex: 1 });
  const label = document.createElement('div');
  label.className = 'district-label';
  label.textContent = T.district.label;
  districtLabel = new AdvancedMarkerElement({ position: DISTRICT_LABEL_AT, content: label, zIndex: 5 });
  setDistrict(false);

  map.__onAltClick = onAltClick;
  return map;
}

export const isReady = () => !!map;

// highlight = true while the "entering the Civic District" prompt is up.
export function setDistrict(highlight) {
  if (!districtLine) return;
  const dash = (color, scale, repeat) => [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale }, offset: '0', repeat }];
  districtLine.setOptions({ icons: highlight ? dash('#202124', 3.5, '14px') : dash('#5f6368', 2, '10px') });
  districtFill.setOptions({ fillOpacity: highlight ? 0.1 : 0 });
  districtLabel.map = highlight ? map : null;
}

export const districtPoints = () => DISTRICT_POLYGON;

// ── Navigation camera: follow the dot, tilted, facing the direction of travel.
// Tilt and rotation only exist on vector maps; raster maps just follow the dot.
const isVector = () => map?.getRenderingType?.() === gm.RenderingType?.VECTOR;

export function navCamera(loc, heading) {
  if (!map) return;
  map.moveCamera(isVector() ? { center: loc, zoom: 17.6, tilt: 45, heading } : { center: loc, zoom: 17 });
}

export function resetCamera() {
  if (isVector()) map.moveCamera({ tilt: 0, heading: 0 });
}

export const mapHeading = () => map?.getHeading?.() ?? 0;

// Remaining part of the leg, drawn on top of the route.
export function setNavPath(path) {
  if (!map) return;
  if (!path) {
    navLine?.setMap(null);
    navLine = null;
    return;
  }
  if (!navLine) navLine = new gm.Polyline({ map, zIndex: 8, clickable: false, ...dots('#4c8df6', '#1a73e8', 4, '13px') });
  navLine.setPath(path);
}

// Dotted leg from the visitor to the next stop (null hides it).
export function setApproach(path) {
  if (!map) return;
  if (!path) {
    approachLine?.setMap(null);
    approachLine = null;
    return;
  }
  if (!approachLine) approachLine = new gm.Polyline({ map, zIndex: 3, clickable: false, ...dots('#8ab4f8', '#1a73e8', 2.6, '10px') });
  approachLine.setPath(path);
}

// Turn the blue dot into a direction arrow (deg = travel bearing), or back (null).
export function setUserHeading(deg) {
  const dot = userMarker?.content;
  if (!dot) return;
  dot.classList.toggle('user-dot--nav', deg !== null);
  if (deg !== null) dot.style.setProperty('--rot', `${deg - mapHeading()}deg`);
}

export function setUserPosition(loc) {
  if (!userMarker || userDragging) return;
  userMarker.position = loc;
}

export function panTo(loc) {
  map?.panTo(loc);
}

// Keep the dot on screen without jerking the map every frame.
export function keepInView(loc) {
  if (!map) return;
  const b = map.getBounds();
  if (!b) return;
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  const latPad = (ne.lat() - sw.lat()) * 0.2;
  const lngPad = (ne.lng() - sw.lng()) * 0.15;
  // Bottom of the map is usually under a sheet, so require more margin there.
  const inside =
    loc.lat < ne.lat() - latPad && loc.lat > sw.lat() + latPad * 2 && loc.lng < ne.lng() - lngPad && loc.lng > sw.lng() + lngPad;
  if (!inside) map.panTo(loc);
}

export function fitTo(points, padding = { top: 110, bottom: 300, left: 40, right: 40 }, maxZoom = 18) {
  if (!map || !points.length) return;
  const b = new gm.LatLngBounds();
  points.forEach((p) => b.extend(p));
  map.fitBounds(b, padding);
  // A short walk would otherwise zoom right in to building level.
  gm.event.addListenerOnce(map, 'idle', () => {
    if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
  });
}

export function showDistrict(center, zoom = 16) {
  if (!map) return;
  map.setCenter(center);
  map.setZoom(zoom);
}

// Pin look: route stops become numbered blue pins, collected ones green.
export function updatePins({ routeIds = [], stampIds = new Set(), nextId = null }) {
  for (const stop of STOPS) {
    const entry = pinMarkers.get(stop.id);
    if (!entry) continue;
    const { content, marker } = entry;
    const order = routeIds.indexOf(stop.id);
    const onRoute = order >= 0;
    const label = content.querySelector('.pin__label');
    const name = content.querySelector('.pin__name');
    content.classList.toggle('pin--route', onRoute);
    content.classList.toggle('pin--dim', routeIds.length > 0 && !onRoute);
    content.classList.toggle('pin--done', onRoute && stampIds.has(stop.id));
    content.classList.toggle('pin--next', stop.id === nextId);
    label.textContent = onRoute ? (stampIds.has(stop.id) ? '✓' : String(order + 1)) : String(stop.number);
    name.textContent = onRoute ? stop.shortName : '';
    marker.zIndex = stop.id === nextId ? 60 : onRoute ? 40 : stop.featured ? 20 : 10;
  }
}

function clear(lines) {
  lines.forEach((l) => l.setMap(null));
  return [];
}

const DASH = { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 };
// Google Maps draws walking routes as a chain of dots.
const dots = (fill, stroke, scale = 3.4, repeat = '11px') => ({
  strokeOpacity: 0,
  icons: [{ icon: { path: gm.SymbolPath.CIRCLE, scale, fillColor: fill, fillOpacity: 1, strokeColor: stroke, strokeWeight: 1 }, offset: '0', repeat }],
});

// main / alt: geometry from routing.getRoute(). doneLegs: legs already walked.
export function drawRoutes({ main, alt, doneLegs = 0 }) {
  routeLines = clear(routeLines);
  altLines = clear(altLines);
  if (!map) return;
  if (alt) {
    const opts = alt.offline
      ? { strokeOpacity: 0, icons: [{ icon: { ...DASH, strokeColor: '#8ab4f8' }, offset: '0', repeat: '12px' }] }
      : dots('#a8c7fa', '#7aa7ef', 3, '11px');
    // A wide invisible line underneath makes the dotted alternative easy to tap.
    const hit = new gm.Polyline({ map, path: alt.path, strokeColor: '#000', strokeOpacity: 0.001, strokeWeight: 18, zIndex: 1, clickable: true });
    const line = new gm.Polyline({ map, path: alt.path, zIndex: 2, clickable: false, ...opts });
    hit.addListener('click', () => map.__onAltClick?.());
    altLines.push(hit, line);
  }
  if (main) {
    main.legs.forEach((leg, i) => {
      const done = i < doneLegs;
      const color = done ? '#9aa0a6' : '#1a73e8';
      if (main.offline) {
        routeLines.push(new gm.Polyline({ map, path: leg, strokeOpacity: 0, zIndex: 4, icons: [{ icon: { ...DASH, strokeColor: color }, offset: '0', repeat: '12px' }] }));
      } else {
        routeLines.push(new gm.Polyline({ map, path: leg, zIndex: 4, clickable: false, ...(done ? dots('#bdc1c6', '#9aa0a6') : dots('#1a73e8', '#1557b0')) }));
      }
    });
  }
}

export function clearRoutes() {
  routeLines = clear(routeLines);
  altLines = clear(altLines);
}

export function setGeofences(visible, { nextId = null } = {}) {
  circles = clear(circles);
  if (!visible || !map) return;
  for (const s of STOPS) {
    const isNext = s.id === nextId;
    circles.push(
      new gm.Circle({
        map,
        center: { lat: s.lat, lng: s.lng },
        radius: s.geofenceRadiusM ?? 60,
        strokeColor: isNext ? '#188038' : '#1a73e8',
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: isNext ? '#34a853' : '#4285f4',
        fillOpacity: isNext ? 0.18 : 0.1,
        clickable: false,
        zIndex: 0,
      }),
    );
  }
}
