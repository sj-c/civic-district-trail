// Route view, Google Maps "directions" style: a stops card over the top of the
// map (your location → stops → final stop) and a compact bottom sheet with the
// walking time, Start, and the alternative / shorten options.

import { T } from '../data/strings.js';
import { $, node, esc, km, toast } from './dom.js';
import { icon } from './icons.js';

export const NAV_ICON = icon('start', 18);

// ctx: { view(), onOpen(id), onStartNav(), onSwitchAlt(), onCut(), onPassport(), onFinish(), onSeeCard(), onMinimise() }
// view(): { stops:[{id, shortName, collected}], minutes, distanceM, computing, offline,
//           next: {id, shortName, index, inside} | null, alt: {kind} | null, canCut, complete, stampCount }
export function renderSummary(ctx) {
  const el = node('<div class="rsheet"></div>');
  const top = $('#route-top');

  function renderTop(v) {
    const rows = v.stops
      .map((s, i) => {
        const last = i === v.stops.length - 1;
        const mark = s.collected ? 'done' : last ? 'end' : 'stop';
        return `<li class="rcard__row rcard__row--${mark} ${v.next?.id === s.id ? 'rcard__row--next' : ''}">
            <span class="rcard__mark" aria-hidden="true">${mark === 'end' ? icon('pin', 22) : mark === 'done' ? '✓' : ''}</span>
            <button type="button" class="rcard__name" data-open="${s.id}">${esc(s.shortName)}</button>
          </li>`;
      })
      .join('');
    top.innerHTML = `
      <div class="rcard">
        <ol class="rcard__list" aria-label="${T.summary.stopListAria}">
          <li class="rcard__row rcard__row--me"><span class="rcard__mark" aria-hidden="true"></span><span class="rcard__name rcard__name--me">${T.summary.yourLocation}</span></li>
          ${rows}
        </ol>
        <div class="rcard__menu-wrap">
          <button type="button" class="rcard__more" data-act="menu" aria-haspopup="menu" aria-expanded="false" aria-label="${T.summary.more}">${icon('more')}</button>
          <div class="rcard__menu" role="menu" hidden>
            <button type="button" role="menuitem" data-act="passport">${T.summary.passport}</button>
            <button type="button" role="menuitem" data-act="finish">${T.summary.finish}</button>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const v = ctx.view();
    if (v.complete) {
      top.innerHTML = '';
      el.innerHTML = `
        <div class="summary__done">
          <div class="summary__done-icon" aria-hidden="true">🎉</div>
          <h2>${T.summary.allDone}</h2>
          <p class="muted">${T.summary.allDoneBody(v.stampCount)}</p>
          <div class="row">
            <button type="button" class="btn btn--primary" data-act="card">${T.summary.seeCard}</button>
            <button type="button" class="btn btn--tonal" data-act="passport">${T.summary.passport}</button>
          </div>
        </div>`;
      return;
    }
    renderTop(v);
    el.innerHTML = `
      <div class="rsheet__head">
        <span class="rsheet__walk">${icon('walk', 26)}</span>
        <h2 class="rsheet__title">${T.summary.timeDistance(v.minutes, v.distanceM ? km(v.distanceM) : '')}</h2>
        <button type="button" class="rsheet__icon" data-act="decor" aria-label="${T.summary.options}">${icon('tune', 22)}</button>
        <button type="button" class="rsheet__icon" data-act="decor" aria-label="${T.summary.share}">${icon('share', 22)}</button>
        <button type="button" class="rsheet__icon" data-act="minimise" aria-label="${T.summary.close}">${icon('close', 22)}</button>
      </div>
      ${v.computing ? `<p class="note">${T.summary.computing}</p>` : ''}
      ${!v.computing && v.offline ? `<p class="note note--offline">${T.summary.offlineNote}</p>` : ''}
      <div class="rsheet__actions" data-slot="actions"></div>`;
    refresh();
  }

  // Cheap per-location refresh: Start becomes Open once you're at the next stop.
  function refresh() {
    const slot = el.querySelector('[data-slot="actions"]');
    if (!slot) return;
    const v = ctx.view();
    const start = !v.next
      ? ''
      : v.next.inside
        ? `<button type="button" class="gbtn gbtn--start" data-open="${v.next.id}">${T.summary.openStop}</button>`
        : `<button type="button" class="gbtn gbtn--start" data-act="start-nav" aria-label="${esc(T.nav.startAria(v.next.shortName))}">${NAV_ICON} ${T.nav.start}</button>`;
    const html =
      start +
      (v.alt ? `<button type="button" class="gbtn gbtn--pill" data-act="alt">${icon('swap', 20)} ${T.summary.alt[v.alt.kind]}</button>` : '') +
      (v.canCut ? `<button type="button" class="gbtn gbtn--pill" data-act="cut">${icon('timer', 20)} ${T.summary.cutShort}</button>` : '');
    if (slot.__html !== html) slot.innerHTML = slot.__html = html;
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const menu = top.querySelector('.rcard__menu');
    if (b.dataset.act !== 'menu' && menu) {
      menu.hidden = true;
      top.querySelector('[data-act="menu"]')?.setAttribute('aria-expanded', 'false');
    }
    if (b.dataset.open) ctx.onOpen(b.dataset.open);
    else if (b.dataset.act === 'menu') {
      menu.hidden = !menu.hidden;
      b.setAttribute('aria-expanded', String(!menu.hidden));
    } else if (b.dataset.act === 'alt') ctx.onSwitchAlt();
    else if (b.dataset.act === 'cut') ctx.onCut();
    else if (b.dataset.act === 'passport') ctx.onPassport();
    else if (b.dataset.act === 'finish') ctx.onFinish();
    else if (b.dataset.act === 'card') ctx.onSeeCard();
    else if (b.dataset.act === 'start-nav') ctx.onStartNav();
    else if (b.dataset.act === 'minimise') ctx.onMinimise();
    else if (b.dataset.act === 'decor') toast(T.home.notInPrototype);
  };
  el.addEventListener('click', onClick);
  top.onclick = onClick;

  render();
  return { el, render, refresh };
}
