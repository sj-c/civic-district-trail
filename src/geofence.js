// Pure client-side geofencing: Haversine distance, no API calls.

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceM(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isInside(stop, loc) {
  return distanceM(stop, loc) <= (stop.geofenceRadiusM ?? 60);
}

// Ray-casting point-in-polygon test (lat/lng treated as planar: fine at city scale).
export function insidePolygon(loc, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.lat > loc.lat !== b.lat > loc.lat && loc.lng < ((b.lng - a.lng) * (loc.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside;
  }
  return inside;
}

// Compass bearing in degrees (0 = north, clockwise).
export function bearing(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function nearest(stops, loc) {
  let best = null;
  let bestD = Infinity;
  for (const s of stops) {
    const d = distanceM(s, loc);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

// Tracks which geofences contain the current location and reports
// enter/exit transitions on each update.
export function createTracker(stops) {
  let inside = new Set();
  return {
    get inside() {
      return inside;
    },
    // Set the starting state without firing any transitions.
    prime(loc) {
      inside = new Set(stops.filter((s) => isInside(s, loc)).map((s) => s.id));
    },
    update(loc) {
      const now = new Set(stops.filter((s) => isInside(s, loc)).map((s) => s.id));
      const entered = new Set([...now].filter((id) => !inside.has(id)));
      const exited = new Set([...inside].filter((id) => !now.has(id)));
      const wasEmpty = inside.size === 0;
      inside = now;
      return { inside: now, entered, exited, wasEmpty };
    },
  };
}
