// Tiny WebAudio synth. The context is created lazily on the first call, which
// in practice is always inside a user-gesture handler, so autoplay policy is
// satisfied; every call is try/caught so a missing/blocked AudioContext
// (headless test runs) degrades to silence rather than an exception.
let AC: AudioContext | null = null;

// Mute is a preference, not run state: New game does not clear it and a reload
// restores it, which is why it is its own key rather than part of the saved run.
// Read through the same try/catch localStorage discipline game.ts uses.
const K_MUTE = "colorAlchemy.mute";
export let muted = false;
try { muted = localStorage.getItem(K_MUTE) === "1"; } catch {}

export function setMuted(v: boolean): void {
  muted = v;
  try { localStorage.setItem(K_MUTE, v ? "1" : "0"); } catch {}
}

export function ac(): AudioContext {
  // No webkitAudioContext fallback: unprefixed AudioContext landed in Safari
  // 14.1, the same release that shipped flexbox gap — and the HUD, the
  // cauldron and the overlay buttons are all flex rows with a gap, so a
  // browser old enough to need the prefix cannot lay this game out anyway.
  if (!AC) AC = new AudioContext();
  if (AC.state === "suspended") AC.resume();
  return AC;
}

function tone(
  f: number, at: number, dur: number,
  type: OscillatorType = "square", vol = 0.12, slide = 0,
): void {
  if (muted) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {}
}

export const SFX = {
  select() { tone(660, 0, 0.07, "square", 0.07); },
  cancel() { tone(430, 0, 0.06, "square", 0.05); },
  fail()   { tone(190, 0, 0.22, "sawtooth", 0.09, -120); },
  dupe()   { tone(520, 0, 0.09, "sine", 0.08); },
  hint()   { tone(587, 0, 0.08, "triangle", 0.08); tone(880, 0.07, 0.13, "triangle", 0.08); },
  discover() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, "triangle", 0.11)); },
  fanfare()  { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.32, "triangle", 0.12)); tone(262, 0, 0.9, "sine", 0.07); },
  grand()    { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.09, 0.36, "triangle", 0.12)); tone(196, 0, 1.1, "sine", 0.07); },
};
