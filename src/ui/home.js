// Map-app home chrome: search bar, chip row, layers button, location +
// directions buttons, the "Be in the know" panel and the bottom tab bar.
// Styled after the Google Maps phone app. Most controls are decorative in
// this prototype (search would need the Places API, which we don't use).

import { T } from '../data/strings.js';
import { $, esc, toast } from './dom.js';

const svg = (d, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

const ICON = {
  pin: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
  mic: 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  lens: 'M9 3 7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  spark: 'M10 2.5 11.9 8 17.5 10l-5.6 2L10 17.5 8.1 12 2.5 10l5.6-2zM18 13l1 2.8 2.8 1-2.8 1L18 21l-1-3.2-2.8-1 2.8-1z',
  work: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z',
  food: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  cafe: 'M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8zM4 19h16v2H4v-2z',
  layers: 'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zm0-11.47L17.74 9 12 13.47 6.26 9 12 4.53z',
  directions: 'M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z',
  explore: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
  you: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z',
  contribute: 'M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
};

// ctx: { onYou(), onDirections() }
export function initHome(ctx) {
  const H = T.home;

  $('#topbar').innerHTML = `
    <div class="gsearch">
      <span class="gsearch__logo">${svg(ICON.pin, 26)}</span>
      <button type="button" class="gsearch__field" data-home="search">${esc(H.search)}</button>
      <button type="button" class="gsearch__icon" data-home="mic" aria-label="${esc(H.voice)}">${svg(ICON.mic)}</button>
      <button type="button" class="gsearch__icon" data-home="lens" aria-label="${esc(H.lens)}">${svg(ICON.lens)}</button>
      <button type="button" class="gsearch__avatar" data-home="account" aria-label="${esc(H.account)}">${esc(H.avatar)}</button>
    </div>
    <div class="gchips">
      ${H.chips.map((c) => `<button type="button" class="gchip" data-home="chip">${svg(ICON[c.icon], 20)}<span>${esc(c.label)}</span></button>`).join('')}
    </div>
    <div id="offline-chip" class="offline-chip" hidden></div>`;

  $('#map-tools').innerHTML = `
    <button type="button" class="glayers" data-home="layers" aria-label="${esc(H.layers)}">${svg(ICON.layers)}</button>`;

  $('#fab-stack').innerHTML = `
    <button type="button" id="recenter" class="gfab gfab--loc"><span class="gfab__dot" aria-hidden="true"></span></button>
    <button type="button" id="directions" class="gfab gfab--dir" aria-label="${esc(H.directions)}">${svg(ICON.directions, 28)}</button>`;

  $('#home-bottom').innerHTML = `
    <section class="home-sheet" aria-label="${esc(H.exploreTitle)}">
      <span class="home-sheet__grip" aria-hidden="true"></span>
      <div class="home-sheet__row">
        <h2 class="home-sheet__title">${esc(H.exploreTitle)}</h2>
        <div class="weather" aria-label="${esc(H.weatherAria)}">
          <span class="weather__temp"><span aria-hidden="true">☁️</span> ${esc(H.temp)}</span>
          <span class="weather__psi"><span class="weather__dot" aria-hidden="true"></span>${esc(H.psi)}</span>
        </div>
      </div>
    </section>
    <nav class="tabbar" aria-label="${esc(H.tabsAria)}">
      <button type="button" class="tab tab--on" data-home="explore" aria-current="page"><span class="tab__icon">${svg(ICON.explore)}</span>${esc(H.tabs.explore)}</button>
      <button type="button" class="tab" data-home="you"><span class="tab__icon">${svg(ICON.you)}<span class="tab__badge" aria-hidden="true"></span></span>${esc(H.tabs.you)}</button>
      <button type="button" class="tab" data-home="contribute"><span class="tab__icon">${svg(ICON.contribute)}</span>${esc(H.tabs.contribute)}</button>
    </nav>`;

  $('#app').addEventListener('click', (e) => {
    const b = e.target.closest('[data-home]');
    if (!b) return;
    const what = b.dataset.home;
    if (what === 'you') ctx.onYou();
    else if (what === 'explore') return;
    else toast(H.notInPrototype);
  });
  $('#directions').addEventListener('click', ctx.onDirections);
}
