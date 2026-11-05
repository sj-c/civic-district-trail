// 3. Experience: the stop card (story + read-aloud, Spot this).

import { T } from '../data/strings.js';
import { STORY_SECONDS } from '../config.js';
import { node, esc, formatDistance } from './dom.js';
import { facadeSvg } from './art.js';
import { createNarrator, speechSupported } from './speech.js';
import { NAV_ICON } from './summary.js';
import { PHOTOS } from '../data/photos.js';

// ctx: { status(), onClose(), onFound(id), onStoryDone(id), onNext(), onSeeCard() }
// status(): { inside, distance, hasRoute, onRoute, index, total, stamped, found, storyDone, complete, nextStop }
export function createStopCard(stop, ctx) {
  const paragraphs = stop.story.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join('');
  const el = node(`
    <article class="stop" aria-labelledby="stop-title-${stop.id}">
      <div class="stop__hero" style="--hue:${stop.hue ?? 30}">
        ${
          PHOTOS[stop.id]
            ? `<img class="stop__photo" src="${PHOTOS[stop.id]}" alt="${esc(T.stop.photoAlt(stop.name))}" />`
            : `${facadeSvg(stop.hue ?? 30)}<span class="stop__hero-ph">${T.stop.photo}</span>`
        }
        <div class="stop__chips" data-slot="chips"></div>
        <button type="button" class="icon-btn icon-btn--float stop__close" data-act="close" aria-label="${T.stop.close}">✕</button>
      </div>
      <div class="stop__content">
        <h2 class="stop__title" id="stop-title-${stop.id}" tabindex="-1">${esc(stop.name)}</h2>
        <p class="status" data-slot="status"></p>
        ${stop.contentStatus !== 'full' ? `<p class="note">${T.stop.comingSoon}</p>` : ''}

        <section class="card-section" aria-label="${T.stop.storyAria}">
          <div class="player">
            <button type="button" class="btn btn--primary player__play" data-act="play" ${speechSupported ? '' : 'disabled'}>
              <span data-slot="play-icon" aria-hidden="true">▶</span> <span data-slot="play-label">${T.stop.play}</span>
            </button>
            <button type="button" class="btn btn--tonal player__stop" data-act="stop" aria-label="${T.stop.stopAudio}" ${speechSupported ? '' : 'disabled'}>■</button>
            <div class="player__track">
              <div class="player__bar" role="progressbar" aria-label="Story progress" aria-valuemin="0" aria-valuemax="${STORY_SECONDS}" aria-valuenow="0"><div class="player__fill" data-slot="fill"></div></div>
              <span class="player__time" data-slot="time">0:00 / 1:00</span>
            </div>
          </div>
          ${speechSupported ? '' : `<p class="muted small">${T.stop.noSpeech}</p>`}
          <p class="small story-done" data-slot="story-done" hidden>${T.stop.storyDone}</p>
          <div class="story">${paragraphs}</div>
        </section>

        <section class="card-section spot" aria-labelledby="spot-h-${stop.id}">
          <h3 id="spot-h-${stop.id}">🔍 ${T.stop.spotTitle}</h3>
          <p>${esc(stop.spotThis.detail)}</p>
          <p class="spot__hint" id="hint-${stop.id}" hidden>💡 ${esc(stop.spotThis.hint)}</p>
          <div class="row">
            <button type="button" class="btn btn--tonal" data-act="hint" aria-expanded="false" aria-controls="hint-${stop.id}">${T.stop.showHint}</button>
            <button type="button" class="btn btn--primary" data-act="found" data-slot="found">${T.stop.found}</button>
          </div>
        </section>


        <div class="stop__footer" data-slot="footer"></div>
      </div>
    </article>`);

  const slot = (name) => el.querySelector(`[data-slot="${name}"]`);
  // Location updates arrive every animation frame while walking; only touch
  // the DOM when something actually changed (keeps focus and hover intact).
  const put = (target, html) => {
    if (target.__html !== html) target.innerHTML = target.__html = html;
  };

  const narrator = createNarrator(stop.story, {
    onState: (s) => {
      slot('play-icon').textContent = s === 'playing' ? '❚❚' : '▶';
      slot('play-label').textContent = s === 'playing' ? T.stop.pause : s === 'paused' ? T.stop.resume : T.stop.play;
    },
    onProgress: (f) => {
      slot('fill').style.width = `${(f * 100).toFixed(1)}%`;
      const secs = Math.round(f * STORY_SECONDS);
      slot('time').textContent = `0:${String(secs).padStart(2, '0')} / 1:00`.replace('0:60', '1:00');
      el.querySelector('.player__bar').setAttribute('aria-valuenow', String(secs));
    },
    onEnd: () => ctx.onStoryDone(stop.id),
  });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    switch (b.dataset.act) {
      case 'close':
        ctx.onClose();
        break;
      case 'play':
        if (narrator.state === 'playing') narrator.pause();
        else narrator.play();
        break;
      case 'stop':
        narrator.stop();
        break;
      case 'hint': {
        const hint = el.querySelector('.spot__hint');
        hint.hidden = !hint.hidden;
        b.textContent = hint.hidden ? T.stop.showHint : T.stop.hideHint;
        b.setAttribute('aria-expanded', String(!hint.hidden));
        break;
      }
      case 'found':
        ctx.onFound(stop.id);
        break;
      case 'next':
        ctx.onNext();
        break;
      case 'card':
        ctx.onSeeCard();
        break;
    }
  });

  function refresh() {
    const s = ctx.status();
    put(slot('chips'),
      (s.onRoute ? `<span class="chip chip--dark">${T.stop.stopOf(s.index + 1, s.total)}</span>` : '') +
      `<span class="chip chip--dark">${T.stop.trailSite(stop.number)}</span>`,
    );

    const status = slot('status');
    status.className = `status ${s.inside ? 'status--here' : 'status--away'}`;
    status.hidden = s.inside; // on site: no status line needed
    if (!s.inside) put(status, `<span aria-hidden="true">🔒</span> ${T.stop.getCloser} · ${T.stop.away(formatDistance(s.distance))}`);

    const found = slot('found');
    found.textContent = s.found ? T.stop.foundDone : T.stop.found;
    found.classList.toggle('btn--done', s.found);
    slot('story-done').hidden = !s.storyDone;


    const footer = slot('footer');
    if (s.onRoute && s.stamped && s.complete) put(footer, `<button type="button" class="btn btn--primary btn--block" data-act="card">${T.stop.lastStop}</button>`);
    else if (s.onRoute && s.stamped && s.nextStop && s.nextStop.id !== stop.id)
      put(footer, `<button type="button" class="btn btn--primary btn--block btn--lg" data-act="next" aria-label="${esc(T.nav.startAria(s.nextStop.shortName))}">${NAV_ICON} ${esc(T.nav.startTo(s.nextStop.shortName))}</button>`);
    else put(footer, '');
  }

  refresh();
  return { id: stop.id, el, refresh, destroy: () => narrator.destroy() };
}
