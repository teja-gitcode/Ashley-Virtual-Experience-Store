import { isCoarsePointer } from "./handheld";

let ctx: AudioContext | null = null;
let muted = false;
let lastStep = 0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  if (v) {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export function footstep() {
  if (muted) return;
  const now = performance.now();
  if (now - lastStep < 280) return;
  lastStep = now;
  const c = getCtx();
  if (!c || c.state !== "running") {
    resumeAudio();
    return;
  }
  const t = c.currentTime;
  const noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t);
}

export function alexGreet() {
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Welcome to Ashley. I'm Alex. I can walk you to a gallery or a piece on the floor.",
    );
    u.rate = 1;
    u.pitch = 1;
    u.volume = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function defaultMuted() {
  return isCoarsePointer();
}
