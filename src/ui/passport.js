// 4. Collect: the passport grid of stamps for the current route.

import { T } from '../data/strings.js';
import { node, esc } from './dom.js';

// ctx: { stops:[{...stop, collected, collectedAt}], hasRoute, finished, onBack(), onFinish(), onOpen(id) }
export function renderPassport(ctx) {
  const n = ctx.stops.filter((s) => s.collected).length;
  const fmt = (t) => new Date(t).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  const el = node(`
    <div class="screen__inner passport">
      <div class="screen__bar">
        <button type="button" class="icon-btn" data-act="back" aria-label="${T.passport.back}">←</button>
      </div>
      <h1 class="screen__title" tabindex="-1">${T.passport.title}</h1>
      <p class="muted">${ctx.hasRoute ? T.passport.progress(n, ctx.stops.length) : T.passport.empty}</p>
      ${
        ctx.hasRoute
          ? `<div class="passport__progress" aria-hidden="true"><span style="width:${ctx.stops.length ? (n / ctx.stops.length) * 100 : 0}%"></span></div>
             <ul class="passport__grid">
              ${ctx.stops
                .map(
                  (s, i) => `
                <li>
                  <button type="button" class="pstamp ${s.collected ? 'pstamp--on' : ''}" data-open="${s.id}" style="--hue:${s.hue ?? 30}; --tilt:${((i * 37) % 13) - 6}deg">
                    <span class="pstamp__disc" aria-hidden="true">${s.collected ? s.stampIcon : i + 1}</span>
                    <span class="pstamp__name">${esc(s.shortName)}</span>
                    <span class="pstamp__date">${s.collected ? fmt(s.collectedAt) : '—'}</span>
                    <span class="sr-only">${s.collected ? 'collected' : 'not collected yet'}</span>
                  </button>
                </li>`,
                )
                .join('')}
             </ul>`
          : `<div class="passport__empty" aria-hidden="true">🏅</div>`
      }
      ${
        ctx.hasRoute
          ? `<div class="screen__footer"><button type="button" class="btn btn--primary btn--block btn--lg" data-act="finish">${ctx.finished ? T.passport.seeCard : T.passport.finish}</button></div>`
          : ''
      }
    </div>`);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'back') ctx.onBack();
    else if (b.dataset.act === 'finish') ctx.onFinish();
    else if (b.dataset.open) ctx.onOpen(b.dataset.open);
  });
  return el;
}
