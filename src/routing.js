// Walking routes via the Routes API (with turn-by-turn steps for navigation
// mode, which come back in the same call). Each ordered stop list is computed once
// and cached in memory + localStorage. If routing fails for any reason we
// fall back to straight lines and flag the result as offline.

import { API_KEY } from './config.js';
import { distanceM } from './geofence.js';

const LS_KEY = 'civic-trail:routes:v2'; // v2: includes turn-by-turn steps
const memory = new Map();
const inflight = new Map();

const keyFor = (stops) => stops.map((s) => s.id).join('>');
const ll = (s) => ({ lat: s.lat, lng: s.lng });

function readDisk() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeDisk(key, value) {
  try {
    const all = readDisk();
    all[key] = value;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
}

// Compact [lat, lng] pairs for storage.
const pack = (path) => path.map((p) => [+p.lat.toFixed(6), +p.lng.toFixed(6)]);
const unpack = (arr) => arr.map(([lat, lng]) => ({ lat, lng }));

function fromDisk(v) {
  return { legSteps: v.legs.map(() => []), ...v, path: unpack(v.path), legs: v.legs.map(unpack) };
}

function toDisk(r) {
  return { ...r, path: pack(r.path), legs: r.legs.map(pack) };
}

export async function getRoute(stops) {
  const key = keyFor(stops);
  if (memory.has(key)) return memory.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const disk = readDisk()[key];
  if (disk) {
    const r = fromDisk(disk);
    memory.set(key, r);
    return r;
  }

  const p = (async () => {
    let result;
    if (stops.length < 2) {
      result = straightLine(stops);
    } else {
      try {
        result = await viaJsLibrary(stops);
      } catch {
        try {
          result = await viaRest(stops);
        } catch {
          result = straightLine(stops);
        }
      }
    }
    memory.set(key, result);
    // Only persist real routes, so a temporary failure can be retried after a reload.
    if (!result.offline) writeDisk(key, toDisk(result));
    inflight.delete(key);
    return result;
  })();
  inflight.set(key, p);
  return p;
}

// Maps JavaScript API Routes library (Route.computeRoutes).
async function viaJsLibrary(stops) {
  const lib = await google.maps.importLibrary('routes');
  const Route = lib?.Route;
  if (!Route?.computeRoutes) throw new Error('Route class unavailable');
  const { routes } = await Route.computeRoutes({
    origin: ll(stops[0]),
    destination: ll(stops[stops.length - 1]),
    intermediates: stops.slice(1, -1).map((s) => ({ location: ll(s) })),
    travelMode: 'WALKING',
    fields: ['path', 'distanceMeters', 'durationMillis', 'legs'],
  });
  const r = routes?.[0];
  if (!r?.path?.length || !r.legs?.length) throw new Error('No route');
  const toLL = (p) => ({ lat: typeof p.lat === 'function' ? p.lat() : p.lat, lng: typeof p.lng === 'function' ? p.lng() : p.lng });
  const legs = r.legs.map((leg) => (leg.path || []).map(toLL));
  if (legs.length !== stops.length - 1 || legs.some((l) => l.length < 2)) throw new Error('Bad legs');
  return {
    path: r.path.map(toLL),
    legs,
    legSteps: r.legs.map((leg) => (leg.steps || []).map((s) => step(s.instructions, s.maneuver, s.distanceMeters))),
    legDistances: r.legs.map((leg, i) => leg.distanceMeters ?? pathLength(legs[i])),
    distanceM: r.distanceMeters ?? legs.reduce((a, l) => a + pathLength(l), 0),
    offline: false,
  };
}

// REST computeRoutes with a minimal field mask.
async function viaRest(stops) {
  const wp = (s) => ({ location: { latLng: { latitude: s.lat, longitude: s.lng } } });
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.polyline.encodedPolyline,' +
        'routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction',
    },
    body: JSON.stringify({
      origin: wp(stops[0]),
      destination: wp(stops[stops.length - 1]),
      intermediates: stops.slice(1, -1).map(wp),
      travelMode: 'WALK',
      languageCode: 'en-GB',
      units: 'METRIC',
    }),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r?.polyline?.encodedPolyline || !r.legs?.length) throw new Error('No route');
  const legs = r.legs.map((leg) => decodePolyline(leg.polyline.encodedPolyline));
  return {
    path: decodePolyline(r.polyline.encodedPolyline),
    legs,
    legSteps: r.legs.map((leg) => (leg.steps || []).map((s) => step(s.navigationInstruction?.instructions, s.navigationInstruction?.maneuver, s.distanceMeters))),
    legDistances: r.legs.map((leg, i) => leg.distanceMeters ?? pathLength(legs[i])),
    distanceM: r.distanceMeters ?? legs.reduce((a, l) => a + pathLength(l), 0),
    offline: false,
  };
}

function straightLine(stops) {
  const legs = [];
  for (let i = 1; i < stops.length; i++) legs.push([ll(stops[i - 1]), ll(stops[i])]);
  const legDistances = legs.map(pathLength);
  return {
    path: stops.map(ll),
    legs,
    legSteps: legs.map(() => []), // navigation synthesises a "walk towards" step
    legDistances,
    distanceM: legDistances.reduce((a, b) => a + b, 0),
    offline: stops.length >= 2,
  };
}

// "Walk south-west on St Andrew's Rd\nDestination will be on the right" → text + detail
function step(instructions = '', maneuver = 'STRAIGHT', distanceM = 0) {
  const [text = '', ...rest] = String(instructions).split('\n');
  return { text, detail: rest.join(' '), maneuver: maneuver || 'STRAIGHT', distanceM: distanceM || 0 };
}

export function pathLength(path) {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += distanceM(path[i - 1], path[i]);
  return d;
}

// Standard Google encoded-polyline decoder.
export function decodePolyline(str) {
  const out = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let result = 0;
      let shift = 0;
      let b;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    out.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return out;
}
