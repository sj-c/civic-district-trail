// Read-aloud with the browser's speechSynthesis. The story is queued one
// sentence at a time: this avoids Chrome cutting off long utterances, and lets
// Pause work everywhere (pause = cancel and remember the sentence; resume
// restarts that sentence), since speechSynthesis.pause() is unreliable.

import { STORY_SECONDS } from '../config.js';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

if (speechSupported) {
  // Chrome loads voices asynchronously; asking early warms the list.
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
}

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const lang = (v) => (v.lang || '').replace('_', '-').toLowerCase();
  for (const want of ['en-sg', 'en-gb', 'en-us']) {
    const matches = voices.filter((v) => lang(v) === want);
    if (matches.length) return matches.find((v) => v.localService) || matches[0];
  }
  return voices.find((v) => lang(v).startsWith('en')) || null;
}

export function createNarrator(text, { onState = () => {}, onProgress = () => {}, onEnd = () => {} } = {}) {
  const sentences = (text.replace(/\s*\n+\s*/g, ' ').match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) || [text]).map((s) => s.trim()).filter(Boolean);
  const lengths = sentences.map((s) => s.length);
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const charsBefore = (i) => lengths.slice(0, i).reduce((a, b) => a + b, 0);
  const charsPerSec = total / STORY_SECONDS; // nominal pace for the progress bar

  let index = 0;
  let state = 'idle'; // idle | playing | paused | done
  let gen = 0;
  let raf = 0;
  let startedAt = 0;
  let startTimer = 0;

  const setState = (s) => {
    state = s;
    onState(s);
  };

  function tick() {
    if (state !== 'playing') return;
    const est = Math.min(lengths[index] ?? 0, ((performance.now() - startedAt) / 1000) * charsPerSec);
    onProgress(Math.min(0.999, (charsBefore(index) + est) / total));
    raf = requestAnimationFrame(tick);
  }

  function speakFrom(i) {
    const my = gen;
    index = i;
    if (index >= sentences.length) {
      finish();
      return;
    }
    const u = new SpeechSynthesisUtterance(sentences[index]);
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = 'en-GB';
    }
    u.rate = 1;
    u.onstart = () => {
      if (my === gen) startedAt = performance.now();
    };
    u.onend = () => {
      if (my !== gen || state !== 'playing') return;
      onProgress(charsBefore(index + 1) / total);
      speakFrom(index + 1);
    };
    u.onerror = (e) => {
      if (my !== gen || e.error === 'interrupted' || e.error === 'canceled') return;
      gen++;
      cancelAnimationFrame(raf);
      setState('idle');
    };
    startedAt = performance.now();
    speechSynthesis.speak(u);
  }

  function finish() {
    cancelAnimationFrame(raf);
    onProgress(1);
    setState('done');
    onEnd();
  }

  function halt() {
    gen++;
    clearTimeout(startTimer);
    cancelAnimationFrame(raf);
    if (speechSupported) speechSynthesis.cancel();
  }

  return {
    get state() {
      return state;
    },
    play() {
      if (!speechSupported || state === 'playing') return;
      const from = state === 'done' ? 0 : index;
      halt();
      setState('playing');
      raf = requestAnimationFrame(tick);
      // A short gap after cancel() avoids Safari/Chrome dropping the next utterance.
      startTimer = setTimeout(() => speakFrom(from), 80);
    },
    pause() {
      if (state !== 'playing') return;
      halt();
      setState('paused');
    },
    stop() {
      halt();
      index = 0;
      onProgress(0);
      setState('idle');
    },
    destroy() {
      halt();
    },
  };
}
