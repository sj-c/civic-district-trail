// The single source of truth for the visitor's location. The simulator
// (teleport, walk, drag) and real GPS both call setLocation(), so every
// downstream check (geofences, stamps, AR unlock) runs the same code path.

import { distanceM } from './geofence.js';

let current = null;
const listeners = new Set();
let walk = null;
let gpsWatchId = null;

export function initLocation(loc) {
  current = { lat: loc.lat, lng: loc.lng };
}

export const getLocation = () => current;

export function onLocationChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setLocation(loc, source = 'sim') {
  current = { lat: loc.lat, lng: loc.lng };
  for (const fn of listeners) fn(current, source);
}

export function teleport(loc) {
  stopWalk();
  setLocation(loc, 'teleport');
}

// Animate along a polyline at constant speed. Resolves true when the end is
// reached, false if interrupted.
export function walkAlong(path, durationMs) {
  stopWalk();
  return new Promise((resolve) => {
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + distanceM(path[i - 1], path[i]));
    const total = cum[cum.length - 1];
    if (path.length < 2 || total < 0.5) {
      setLocation(path[path.length - 1], 'walk');
      resolve(true);
      return;
    }
    const t0 = performance.now();
    let me = null;
    const step = (now) => {
      if (walk !== me) return; // stopped (possibly by a listener during the last update)
      const f = Math.min(1, (now - t0) / durationMs);
      const d = f * total;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const seg = cum[i] - cum[i - 1] || 1;
      const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / seg));
      const a = path[i - 1];
      const b = path[i];
      setLocation({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }, 'walk');
      if (walk !== me) return;
      if (f < 1) {
        walk.raf = requestAnimationFrame(step);
      } else {
        walk = null;
        resolve(true);
      }
    };
    walk = me = { raf: requestAnimationFrame(step), resolve };
  });
}

export function stopWalk() {
  if (!walk) return;
  cancelAnimationFrame(walk.raf);
  const { resolve } = walk;
  walk = null;
  resolve(false);
}

export const isWalking = () => walk !== null;

export function startGps({ onError, onFix }) {
  if (!('geolocation' in navigator)) {
    onError?.('unsupported');
    return false;
  }
  stopWalk();
  let first = true;
  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps');
      onFix?.(first);
      first = false;
    },
    (err) => {
      stopGps();
      onError?.(err.code === 1 ? 'denied' : 'failed');
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return true;
}

export function stopGps() {
  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  gpsWatchId = null;
}

export const isGpsOn = () => gpsWatchId !== null;
