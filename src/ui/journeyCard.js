// Shareable journey card drawn on a <canvas>, with PNG download and Web Share.

import { T } from '../data/strings.js';
import { node, toast, formatDistance } from './dom.js';
import { icon } from './icons.js';

const W = 1080;
const H = 1350;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ctx: { theme, stamps, total, visited, distanceM, path:[{lat,lng}], stops:[{lat,lng,collected,stampIcon}], onBack(), onClaim() }
export function renderJourneyCard(ctx) {
  const el = node(`
    <div class="screen__inner journey">
      <div class="screen__bar">
        <button type="button" class="icon-btn" data-act="back" aria-label="${T.journey.back}">←</button>
      </div>
      <h1 class="screen__title" tabindex="-1">${T.journey.title}</h1>
      <canvas class="journey__canvas" width="${W}" height="${H}" role="img"
        aria-label="Journey card: ${ctx.stamps} of ${ctx.total} stamps, ${ctx.visited} stops visited, ${formatDistance(ctx.distanceM)} walked"></canvas>
      <div class="row">
        <button type="button" class="btn btn--primary" data-act="download">${T.journey.download}</button>
        <button type="button" class="btn gshare" data-act="share">${icon('share', 22)} ${T.journey.share}</button>
      </div>
      <button type="button" class="btn btn--reward btn--block btn--lg" data-act="claim">🎁 ${T.journey.claim}</button>
    </div>`);
  const canvas = el.querySelector('canvas');
  draw(canvas, ctx);

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'back') ctx.onBack();
    else if (b.dataset.act === 'claim') ctx.onClaim();
    else if (b.dataset.act === 'download') download(canvas);
    else if (b.dataset.act === 'share') share(canvas);
  });
  return el;
}

const toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, 'image/png'));

async function download(canvas) {
  const blob = await toBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = T.journey.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function share(canvas) {
  const blob = await toBlob(canvas);
  const file = new File([blob], T.journey.fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: T.trailTitle, text: T.journey.shareText });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }
  await download(canvas);
  toast('Sharing isn’t supported here, so the card was downloaded instead.');
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function draw(canvas, ctx) {
  const c = canvas.getContext('2d');

  // Background
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b2e4f');
  g.addColorStop(0.55, '#14507f');
  g.addColorStop(1, '#1a73e8');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.07;
  c.fillStyle = '#fff';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.arc(W - 80 + i * 10, 120 + i * 40, 160 + i * 70, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  // Heading
  c.fillStyle = 'rgba(255,255,255,.75)';
  c.font = `700 30px ${FONT}`;
  c.fillText(T.journey.cardKicker.split('').join(String.fromCharCode(8202)), 80, 120);
  c.fillStyle = '#fff';
  c.font = `800 84px ${FONT}`;
  c.fillText('Civic District', 80, 215);
  c.fillText('Heritage Trail', 80, 305);
  c.fillStyle = 'rgba(255,255,255,.8)';
  c.font = `500 34px ${FONT}`;
  c.fillText(T.journey.cardPlace, 80, 360);

  // Theme pill
  const pill = T.journey.cardTheme(ctx.theme);
  c.font = `600 30px ${FONT}`;
  const pw = c.measureText(pill).width + 56;
  roundRect(c, 80, 392, pw, 56, 28);
  c.fillStyle = 'rgba(255,255,255,.16)';
  c.fill();
  c.fillStyle = '#fff';
  c.fillText(pill, 108, 430);

  // Route outline panel
  const box = { x: 80, y: 490, w: W - 160, h: 440 };
  roundRect(c, box.x, box.y, box.w, box.h, 36);
  c.fillStyle = '#f8fafd';
  c.fill();
  drawRoute(c, ctx, { x: box.x + 60, y: box.y + 50, w: box.w - 120, h: box.h - 100 });

  // Stats
  const stats = [
    [T.journey.stamps, `${ctx.stamps} / ${ctx.total}`],
    [T.journey.stops, String(ctx.visited)],
    [T.journey.distance, formatDistance(ctx.distanceM)],
    [T.journey.date, new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })],
  ];
  stats.forEach(([label, value], i) => {
    const x = 80 + (i % 2) * 470;
    const y = 1000 + Math.floor(i / 2) * 130;
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.font = `600 28px ${FONT}`;
    c.fillText(label.toUpperCase(), x, y);
    c.fillStyle = '#fff';
    c.font = `800 60px ${FONT}`;
    c.fillText(value, x, y + 66);
  });

  // Stamp row + footer
  const collected = ctx.stops.filter((s) => s.collected).slice(0, 8);
  c.font = `40px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  collected.forEach((s, i) => {
    const cx = W - 110 - i * 74;
    c.beginPath();
    c.arc(cx, 1290, 32, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,.95)';
    c.fill();
    c.fillText(s.stampIcon, cx, 1292);
  });
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = 'rgba(255,255,255,.65)';
  c.font = `500 26px ${FONT}`;
  c.fillText(T.journey.footer, 80, 1300);
}

function drawRoute(c, ctx, area) {
  const pts = ctx.path.length >= 2 ? ctx.path : ctx.stops;
  if (!pts.length) return;
  const all = [...pts, ...ctx.stops];
  const lat0 = all.reduce((a, p) => a + p.lat, 0) / all.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = all.map((p) => p.lng * k);
  const ys = all.map((p) => p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(area.w / (maxX - minX || 1e-6), area.h / (maxY - minY || 1e-6));
  const ox = area.x + (area.w - (maxX - minX) * scale) / 2;
  const oy = area.y + (area.h - (maxY - minY) * scale) / 2;
  const P = (p) => [ox + (p.lng * k - minX) * scale, oy + (maxY - p.lat) * scale];

  // Faint grid for a map-ish feel
  c.strokeStyle = '#e3e8ef';
  c.lineWidth = 2;
  for (let i = 0; i <= 6; i++) {
    const x = area.x - 30 + ((area.w + 60) / 6) * i;
    c.beginPath();
    c.moveTo(x, area.y - 30);
    c.lineTo(x, area.y + area.h + 30);
    c.stroke();
  }

  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(...P(p)) : c.moveTo(...P(p))));
  c.strokeStyle = '#1557b0';
  c.lineWidth = 18;
  c.stroke();
  c.strokeStyle = '#4285f4';
  c.lineWidth = 10;
  c.stroke();

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  ctx.stops.forEach((s, i) => {
    const [x, y] = P(s);
    c.beginPath();
    c.arc(x, y, 26, 0, Math.PI * 2);
    c.fillStyle = s.collected ? '#188038' : '#ffffff';
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = s.collected ? '#ffffff' : '#1a73e8';
    c.stroke();
    c.fillStyle = s.collected ? '#fff' : '#1a73e8';
    c.font = `800 26px ${FONT}`;
    c.fillText(s.collected ? '✓' : String(i + 1), x, y + 1);
  });
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
}
