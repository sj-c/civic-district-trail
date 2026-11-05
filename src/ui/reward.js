// Mock reward screen with a drawn QR-style code. Neutral, generic design.
// No real logos or scheme branding.

import { T } from '../data/strings.js';
import { node } from './dom.js';

// ctx: { stamps, claimed, onClaim(), onBack() }
export function renderReward(ctx) {
  const code = `CT-${(1000 + ((ctx.stamps * 7919) % 9000)).toString()}-${new Date().getFullYear()}`;
  const el = node(`
    <div class="screen__inner reward">
      <div class="screen__bar">
        <button type="button" class="icon-btn" data-act="back" aria-label="${T.reward.back}">←</button>
      </div>
      <h1 class="screen__title" tabindex="-1">${T.reward.title}</h1>
      <div class="reward-card">
        <div class="reward-card__top">
          <span class="reward-card__mark" aria-hidden="true">★</span>
          <div>
            <p class="reward-card__title">${T.reward.cardTitle}</p>
            <p class="reward-card__sub">${T.reward.cardSub(ctx.stamps)}</p>
          </div>
        </div>
        <p class="reward-card__value">${T.reward.cardValue}</p>
        <div class="reward-card__qr"><canvas width="232" height="232" role="img" aria-label="Sample QR-style code (prototype)"></canvas></div>
        <p class="reward-card__code">${code}</p>
        <div class="reward-card__claimed" data-slot="claimed" hidden>
          <span class="check" aria-hidden="true">✓</span>
          <div><strong>${T.reward.claimed}</strong><p>${T.reward.claimedBody}</p></div>
        </div>
      </div>
      <div aria-live="polite" class="sr-only" data-slot="live"></div>
      <button type="button" class="btn btn--primary btn--block btn--lg" data-act="claim">${T.reward.claim}</button>
      <p class="fineprint">${T.reward.finePrint}</p>
    </div>`);

  drawQr(el.querySelector('canvas'), code);

  const setClaimed = (announce) => {
    el.querySelector('[data-slot="claimed"]').hidden = false;
    el.querySelector('.reward-card').classList.add('reward-card--claimed');
    const btn = el.querySelector('[data-act="claim"]');
    btn.disabled = true;
    btn.textContent = `✓ ${T.reward.claimed}`;
    if (announce) el.querySelector('[data-slot="live"]').textContent = T.reward.claimed;
  };
  if (ctx.claimed) setClaimed(false);

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'back') ctx.onBack();
    else if (b.dataset.act === 'claim') {
      ctx.onClaim();
      setClaimed(true);
    }
  });
  return el;
}

// Deterministic QR-looking pattern: finder squares + seeded noise. Not scannable.
function drawQr(canvas, seedText) {
  const c = canvas.getContext('2d');
  const N = 29;
  const s = Math.floor(canvas.width / N);
  let seed = [...seedText].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  c.fillStyle = '#fff';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#202124';
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.52) c.fillRect(x * s, y * s, s, s);
  const finder = (fx, fy) => {
    c.fillStyle = '#202124';
    c.fillRect(fx * s, fy * s, 7 * s, 7 * s);
    c.fillStyle = '#fff';
    c.fillRect((fx + 1) * s, (fy + 1) * s, 5 * s, 5 * s);
    c.fillStyle = '#202124';
    c.fillRect((fx + 2) * s, (fy + 2) * s, 3 * s, 3 * s);
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
}
