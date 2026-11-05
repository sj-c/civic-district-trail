// 1. Discover: the geofenced "entering the Civic District" prompt, with the
// time question folded in so it's a single tap.

import { T } from '../data/strings.js';
import { TIME_OPTIONS } from '../config.js';
import { node, $$ } from './dom.js';
import { ROOTS_LOGO } from '../data/photos.js';

export function renderPrompt({ time, onStart, onNotNow }) {
  let chosen = time;
  const el = node(`
    <div class="prompt" role="group" aria-labelledby="prompt-title">
      <img class="prompt__logo" src="${ROOTS_LOGO}" alt="${T.prompt.logoAlt}" />
      <h2 id="prompt-title" class="prompt__title" tabindex="-1">${T.prompt.title}</h2>
      <p class="prompt__q" id="prompt-q">${T.prompt.timeQuestion}</p>
      <div class="chips" role="radiogroup" aria-labelledby="prompt-q">
        ${TIME_OPTIONS.map((m) => `<button type="button" class="chip" role="radio" data-time="${m}">${T.prompt.minutes(m)}</button>`).join('')}
      </div>
      <div class="actions">
        <button type="button" class="btn btn--primary btn--block" data-act="start">${T.prompt.start}</button>
        <button type="button" class="btn btn--text btn--block" data-act="later">${T.prompt.notNow}</button>
      </div>
    </div>`);

  const sync = () =>
    $$('[data-time]', el).forEach((b) => {
      const on = Number(b.dataset.time) === chosen;
      b.classList.toggle('chip--on', on);
      b.setAttribute('aria-checked', String(on));
    });
  sync();

  el.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.time) {
      chosen = Number(t.dataset.time);
      sync();
    } else if (t.dataset.act === 'start') onStart(chosen);
    else if (t.dataset.act === 'later') onNotNow();
  });
  return el;
}
