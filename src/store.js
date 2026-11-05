// One small app-state store with localStorage persistence.

import { DEFAULT_PREFS, START_LOCATION } from './config.js';

const KEY = 'civic-trail:state:v2'; // v2: the three official trail themes

const initialState = () => ({
  location: { ...START_LOCATION },
  prompt: 'idle', // idle | shown | dismissed | accepted
  prefs: { ...DEFAULT_PREFS },
  // { stopIds, alt: { stopIds, kind } | null, theme }
  route: null,
  currentStopIndex: 0,
  arrived: [], // stop ids the visitor has reached
  stamps: {}, // stop id -> timestamp
  found: [], // "Spot this" completed
  storyDone: [],
  finished: false,
  rewardClaimed: false,
  showGeofences: false,
});

let state = load();
const listeners = new Set();
let saveTimer = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return initialState();
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode or quota: progress just won't survive a refresh */
    }
  }, 250);
}

export const getState = () => state;

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  save();
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetState() {
  clearTimeout(saveTimer);
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('civic-trail:')) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  state = initialState();
  for (const fn of listeners) fn(state);
}
