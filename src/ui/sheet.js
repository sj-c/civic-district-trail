// The single bottom sheet, Google Maps style. Content swaps slide the sheet
// down and back up; re-showing the same kind swaps content in place.
//
// Collapsible sheets have three positions you can drag (or tap / arrow-key)
// between: 'collapsed' (a slim tab, so the map is visible), 'default' (half
// height) and, if expandable, 'expanded' (full screen).

import { $ } from './dom.js';
import { T } from '../data/strings.js';

const PEEK_PX = 74; // keep in sync with --peek-h in styles.css
const DRAG_SNAP_PX = 60;
const FLING_PX_PER_MS = 0.5;

let current = null;
let swapTimer = null;
let el;
let body;
let handle;
let peekEl;
let mode = 'default';
let opts = { expandable: false, collapsible: false, onMode: null };
let drag = null;
let lastPointerUp = 0;
let changeListener = () => {};

export const onSheetChange = (fn) => (changeListener = fn);

export function initSheet() {
  el = $('#sheet');
  body = el.querySelector('.sheet__body');
  handle = el.querySelector('.sheet__handle');
  peekEl = el.querySelector('.sheet__peek');

  // Keyboard / assistive tech: a click without a preceding pointer gesture.
  handle.addEventListener('click', () => {
    if (performance.now() - lastPointerUp > 400) stepOnTap();
  });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') step(+1);
    else if (e.key === 'ArrowUp') step(-1);
    else return;
    e.preventDefault();
  });

  handle.addEventListener('pointerdown', (e) => {
    if (handle.hidden || e.button > 0) return;
    drag = { y0: e.clientY, t0: performance.now(), dy: 0, moved: false, base: mode === 'collapsed' ? el.offsetHeight - PEEK_PX : 0 };
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.dy = e.clientY - drag.y0;
    if (!drag.moved && Math.abs(drag.dy) < 5) return;
    drag.moved = true;
    el.classList.add('dragging');
    const max = el.offsetHeight - PEEK_PX;
    let y = drag.base + drag.dy;
    if (y < 0) y *= 0.25; // rubber-band past the top
    if (y > max) y = max + (y - max) * 0.25;
    el.style.transform = `translateY(${y}px)`;
  });
  const endDrag = () => {
    if (!drag) return;
    const { dy, moved, t0 } = drag;
    drag = null;
    lastPointerUp = performance.now();
    el.classList.remove('dragging');
    el.style.transform = '';
    if (!moved) return stepOnTap();
    const v = dy / Math.max(1, performance.now() - t0);
    const down = dy > DRAG_SNAP_PX || v > FLING_PX_PER_MS;
    const up = dy < -DRAG_SNAP_PX || v < -FLING_PX_PER_MS;
    const big = Math.abs(dy) > el.offsetHeight * 0.5;
    if (mode === 'expanded' && down) setMode(big ? 'collapsed' : 'default');
    else if (mode === 'default' && down) setMode('collapsed');
    else if (mode === 'default' && up && opts.expandable) setMode('expanded');
    else if (mode === 'collapsed' && up) setMode(big && opts.expandable ? 'expanded' : 'default');
  };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);

  // Let the recenter button float just above the sheet.
  new ResizeObserver(syncOffset).observe(el);
  el.addEventListener('transitionend', syncOffset);
}

export function showSheet(kind, content, { expandable = false, collapsible = expandable, expanded = false, label = '', peek = '', onMode = null } = {}) {
  clearTimeout(swapTimer);
  const apply = () => {
    current = kind;
    opts = { expandable, collapsible: collapsible || expandable, onMode: null };
    el.dataset.kind = kind;
    el.setAttribute('aria-label', label || kind);
    el.classList.toggle('expandable', opts.collapsible);
    handle.hidden = !opts.collapsible;
    peekEl.textContent = peek || label;
    setMode(expanded ? 'expanded' : 'default');
    opts.onMode = onMode;
    body.replaceChildren(content);
    body.scrollTop = 0;
    changeListener(kind);
    requestAnimationFrame(() => {
      el.classList.add('open');
      syncOffset();
    });
  };
  if (current && current !== kind && el.classList.contains('open')) {
    el.classList.remove('open');
    current = kind;
    swapTimer = setTimeout(apply, 230);
  } else {
    apply();
  }
}

export function hideSheet() {
  clearTimeout(swapTimer);
  el.classList.remove('open');
  current = null;
  syncOffset();
  changeListener(null);
}

export const sheetKind = () => current;

export function setMode(m) {
  if (m === 'expanded' && !opts.expandable) m = 'default';
  mode = m;
  el.classList.toggle('expanded', m === 'expanded');
  el.classList.toggle('collapsed', m === 'collapsed');
  body.inert = m === 'collapsed';
  const label = m === 'collapsed' ? T.sheet.show : m === 'expanded' ? T.sheet.collapse : opts.expandable ? T.sheet.expand : T.sheet.minimise;
  handle.setAttribute('aria-label', `${label}. ${T.sheet.dragHint}`);
  handle.setAttribute('aria-expanded', String(m !== 'collapsed'));
  syncOffset();
  opts.onMode?.(m);
}

export const setExpanded = (v) => setMode(v ? 'expanded' : 'default');
export const isExpanded = () => mode === 'expanded';

// Positions ordered top (full) to bottom (tab).
function positions() {
  return opts.expandable ? ['expanded', 'default', 'collapsed'] : ['default', 'collapsed'];
}

function step(dir) {
  const p = positions();
  const i = Math.max(0, p.indexOf(mode));
  setMode(p[Math.min(p.length - 1, Math.max(0, i + dir))]);
}

// Tap: a minimised tab comes back up; otherwise expand if possible, else minimise.
function stepOnTap() {
  if (mode === 'collapsed' || mode === 'expanded') setMode('default');
  else setMode(opts.expandable ? 'expanded' : 'collapsed');
}

function syncOffset() {
  const app = $('#app');
  const open = el.classList.contains('open');
  const h = !open ? 0 : mode === 'collapsed' ? PEEK_PX : el.offsetHeight;
  app.style.setProperty('--sheet-offset', `${h}px`);
}
