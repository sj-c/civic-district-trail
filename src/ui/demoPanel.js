// Demo controls: beside the phone on desktop, a floating 🧭 drawer on mobile.

import { T } from '../data/strings.js';
import { $ } from './dom.js';

// ctx: { view(), onWalk(), onStopWalk(), onReset() }
// view(): { walking, walkLabel, walkDisabled }
export function initDemoPanel(el, ctx) {
  el.innerHTML = `
    <div class="demo__head">
      <button type="button" class="icon-btn demo__close" data-act="close" aria-label="${T.demo.close}">✕</button>
    </div>

    <section class="demo__section">
      <div class="demo__walk">
        <button type="button" class="demo-btn demo-btn--primary" data-act="walk" data-slot="walk"></button>
        <button type="button" class="demo-btn" data-act="stopwalk" data-slot="stopwalk">${T.demo.stopWalking}</button>
      </div>
    </section>

    <section class="demo__section">
      <button type="button" class="demo-btn demo-btn--danger" data-act="reset" data-slot="reset">↺ ${T.demo.reset}</button>
    </section>`;

  const slot = (n) => el.querySelector(`[data-slot="${n}"]`);
  let resetArmed = null;

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'walk') {
      ctx.onWalk();
      closeOnMobile();
    } else if (b.dataset.act === 'stopwalk') ctx.onStopWalk();
    else if (b.dataset.act === 'close') setOpen(false);
    else if (b.dataset.act === 'reset') {
      // Two-step confirm without a blocking dialog.
      if (resetArmed) {
        clearTimeout(resetArmed);
        resetArmed = null;
        b.textContent = `↺ ${T.demo.reset}`;
        ctx.onReset();
        closeOnMobile();
      } else {
        b.textContent = 'Tap again to reset';
        resetArmed = setTimeout(() => {
          resetArmed = null;
          b.textContent = `↺ ${T.demo.reset}`;
        }, 3000);
      }
    }
  });

  // Mobile drawer
  const fab = $('#demo-fab');
  function setOpen(open) {
    el.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    fab.setAttribute('aria-label', open ? T.demo.close : T.demo.open);
  }
  function closeOnMobile() {
    if (window.matchMedia('(max-width: 819px)').matches) setOpen(false);
  }
  fab.addEventListener('click', () => setOpen(!el.classList.contains('open')));

  function update() {
    const v = ctx.view();
    const walk = slot('walk');
    walk.textContent = v.walking ? T.demo.walking : v.walkLabel;
    walk.disabled = v.walking || v.walkDisabled;
    slot('stopwalk').hidden = !v.walking;
  }
  update();
  return { update };
}
