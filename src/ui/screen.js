// Full-screen panels inside the phone (personalise, passport, journey card, reward).

import { $ } from './dom.js';

let token = 0;
let lastFocus = null;

export function showScreen(content, { label = '' } = {}) {
  const el = $('#screen');
  const my = ++token;
  if (el.hidden) lastFocus = document.activeElement;
  el.hidden = false;
  el.setAttribute('aria-label', label);
  el.replaceChildren(content);
  el.scrollTop = 0;
  requestAnimationFrame(() => {
    if (my !== token) return;
    el.classList.add('open');
    (el.querySelector('[autofocus]') || el.querySelector('h1, h2'))?.focus({ preventScroll: true });
  });
}

export function hideScreen() {
  const el = $('#screen');
  if (el.hidden) return;
  const my = ++token;
  el.classList.remove('open');
  setTimeout(() => {
    if (my !== token) return;
    el.hidden = true;
    el.replaceChildren();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }, 260);
}

export const screenOpen = () => !$('#screen').hidden;
