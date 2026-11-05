// App-wide constants. User-facing text lives in data/strings.js.

const env = import.meta.env || {};
const rawKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '';
export const API_KEY = /^your-|^$/.test(rawKey.trim()) ? '' : rawKey.trim();
export const MAP_ID = env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

// Where the simulated visitor starts (and returns to on Reset demo).
export const START_LOCATION = { lat: 1.2918, lng: 103.8553 }; // War Memorial Park, just outside the district boundary

// Opening view: shows all 22 pins and the start dot on a phone-width map.
export const DISTRICT_CENTER = { lat: 1.2912, lng: 103.8501 };
export const DISTRICT_ZOOM = 15.45;

export const MIN_PER_STOP = 8; // planning budget per stop, including walking
export const TIME_OPTIONS = [20, 45, 90];
export const DEFAULT_PREFS = { time: 20, theme: 'nationhood', stepFree: false, shaded: false };
export const THEME_IDS = ['nationhood', 'functions', 'fortunes'];

export const STORY_SECONDS = 60;
