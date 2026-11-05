// Stamp-press animation shown when a stamp is awarded.

import { T } from '../data/strings.js';
import { $, esc } from './dom.js';

let timer = null;

export function playStamp(stop) {
  const fx = $('#stamp-fx');
  clearTimeout(timer);
  fx.innerHTML = `
    <div class="stamp-fx__stamp" style="--hue:${stop.hue ?? 30}">
      <span class="stamp-fx__ring"></span>
      <span class="stamp-fx__icon">${stop.stampIcon}</span>
      <span class="stamp-fx__name">${esc(stop.shortName)}</span>
    </div>
    <p class="stamp-fx__label">${T.stampFx.label}</p>`;
  fx.classList.remove('play');
  void fx.offsetWidth; // restart the CSS animation
  fx.classList.add('play');
  timer = setTimeout(() => fx.classList.remove('play'), 1900);
}
