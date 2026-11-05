// 2. Personalise: one optional screen of chips with defaults pre-selected.

import { T } from '../data/strings.js';
import { THEME_IDS } from '../config.js';
import { node, $$ } from './dom.js';

export function renderPersonalise({ prefs, onBuild, onBack }) {
  const p = { ...prefs };
  const el = node(`
    <div class="screen__inner personalise">
      <div class="screen__bar">
        <button type="button" class="icon-btn" data-act="back" aria-label="${T.personalise.back}">←</button>
      </div>
      <h1 class="screen__title" tabindex="-1">${T.personalise.title}</h1>

      <h2 class="field-label" id="pl-theme">${T.personalise.theme}</h2>
      <div class="chips" role="radiogroup" aria-labelledby="pl-theme">
        ${THEME_IDS.map((id) => `<button type="button" class="chip" role="radio" data-theme="${id}">${T.themes[id]}</button>`).join('')}
      </div>

      <h2 class="field-label" id="pl-access">${T.personalise.access}</h2>
      <div class="chips" role="group" aria-labelledby="pl-access">
        <button type="button" class="chip chip--check" data-toggle="stepFree"><span class="box" aria-hidden="true"></span>${T.personalise.stepFree}</button>
        <button type="button" class="chip chip--check" data-toggle="shaded"><span class="box" aria-hidden="true"></span>${T.personalise.shaded}</button>
      </div>

      <div class="screen__footer">
        <button type="button" class="btn btn--primary btn--block btn--lg" data-act="build">${T.personalise.build}</button>
      </div>
    </div>`);

  const sync = () => {
    $$('[data-theme]', el).forEach((b) => setOn(b, b.dataset.theme === p.theme, 'aria-checked'));
    $$('[data-toggle]', el).forEach((b) => setOn(b, !!p[b.dataset.toggle], 'aria-pressed'));
  };
  sync();

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.theme) p.theme = b.dataset.theme;
    else if (b.dataset.toggle) p[b.dataset.toggle] = !p[b.dataset.toggle];
    else if (b.dataset.act === 'build') return onBuild(p);
    else if (b.dataset.act === 'back') return onBack();
    sync();
  });
  return el;
}

function setOn(b, on, attr) {
  b.classList.toggle('chip--on', on);
  b.setAttribute(attr, String(on));
}
