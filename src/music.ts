// Background music: "astral blur", the 24 kHz floatbeat in experiments/, ported
// to run in the page. galaxy-raid plays its bytebeats through a
// ScriptProcessorNode filling one sample at a time (src/app/music.ts); this does
// the same, only the source is a stereo float engine rather than a one-liner, so
// the node has two output channels and the samples go out as-is.
//
// The original is a general synth framework — ADSR envelopes, 2- and 4-operator
// FM voices, wave-shapers, filters, delays, a Householder/Hadamard reverb, a
// mixer and a sequencer — and the tune uses maybe a third of it. What survives
// here is only what this song reaches: three waveforms, one envelope shape, one
// random LFO, the 2-op voice (a plain oscillator is the same voice with the
// modulator turned off), gain, the low-pass, the multi-tap delay, the diffuser.
// Dropped: tri/sqr/sawtf waves, the 4-op voice, wave-shaping synths, mod_wav,
// env_const, mono/softclip/dcremove, the single-tap delay, and the high-pass and
// mono branches of the filter.
//
// Everything that was an object with named fields is an array here — envelopes,
// LFOs, notes, effects, mixer channels — indexed by the constants below. It is
// the same data in a form that costs no property names.
//
// Two quirks of the original are reproduced deliberately, because they are what
// it sounds like, not what it means:
//   - `filter` allocates its history with Array(2).fill(Array(3).fill(...)), so
//     all three history rows AND both channels are one shared array. The biquad
//     it looks like collapses to a one-pole per section, fed by both channels in
//     turn. Faithfully collapsed here (K/G below), not "fixed".
//   - `diff` builds a `flip` array of random signs and then multiplies by 1.
//     Dead code; dropped.
// Its two real bugs are dropped too: `m.target in ["freq", ...]` is always false
// (`in` tests keys of an array), so every modulator is additive — which is what
// this tune wants anyway, all of its LFOs target a modulator phase; and
// notefreq() ignores the second argument it is handed.
import { ac, muted, setMuted } from "./sfx";

/* ------------------------------------------------------------------ the song */
// Rows encoded one character each: a tick count as 'A'+n (< 'N'), then two
// characters per event — patch letter 'a'..'g', then the pitch as chr(110+p).
// Patch letters: a chord, b bass, c pulse, d pulse2, e bass-in, f bass-out,
// g note-off (the bass is the only voice that is ever released early).
const PATS = [
  "Ba[BabBaiBagEafMBaXBa_BadBagBafDabMBaTBa[BadBagEabMBaVBa]BabBagEafM",
  "Ba[BabBaiBagEafMBaXBa_BadBagBafDabMBaTBa[BadBagEabMBaVBa]BabBagEafCKebAgn",
  "Ba[bgBabBaiBagEafMAgnBaXbdBa_BadBagBafDabMAgnBaTb`Ba[BadBagEabMAgnBaVbbBa]BabBagEafMAgn",
  "Ba[bgBabBaiBagBafFcrFcuFcrAgnBaXbdBa_BadBagBafFabcrFcuFcrAgnBaTb`Ba[BadBagBabFcsFcsFcsAgnBaVbbBa]BabBagBafFcrFcpFcrAgn",
  "Ba[bgBabBaiBagBafFcrdwFcudzFcrd|AgnBaXbdBa_BadBagBafFabcrd~Fcud~FcrdzAgnBaTb`Ba[BadBagBabFcsd|Fcsd|FcsdzAgnBaVbbBa]BabBagBafFcrdwFcpduFcrduAgn",
  "Ba[bgBabBaiBagEafMAgnBaXbdBa_BadBagBafDabMAgnBaTb`Ba[BadBagEabMAgnBaVfbBa]BabBagEafM",
];
// which pattern plays when: the four-bar pattern, a variant, then it builds
const ARR = "012233442500";

// One patch per letter:
// [pitch offset, amp A D S R, mod A D S R, carrier, modulator, mod level,
//  LFO frequency multiple, LFO depth, mixer channel, is-the-bass]
// A mod level of 0 means no modulator at all: no second envelope, no LFO — the
// plain-oscillator voice.
const P = [
  [0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 1, 1, 16, 0.03, 1, 0],
  [-24, 0.01, 0, 1, 0.01, 3.333, 3.333, 0, 0, 2, 0, 2, 4, 0.01, 2, 1],
  [0, 0.001, 0.75, 0, 0, 0.001, 0.75, 0, 0, 0, 1, 0.5, 1, 0.03, 4, 0],
  [0, 0.001, 0.75, 0, 0, 0.001, 0.75, 0, 0, 0, 1, 0.5, 1, 0.03, 3, 0],
  [-24, 3.333, 0, 1, 0.01, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 1],
  [-24, 0.01, 6.666, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 1],
];

const BASEFREQ = 453;          // the pitch every note ratio multiplies
const { sin, cos, tan, min, max, floor, round, random, PI } = Math;
const lerp = (a: number, b: number, x: number): number => x * b + (1 - x) * a;

/* ------------------------------------------------------------- the generator */
// Builds one sample function for a given sample rate. Everything the engine
// derives — tick length, envelope slopes, delay lengths, filter coefficients —
// is in seconds or Hz, so the song plays at its intended pitch and tempo at
// whatever rate the AudioContext runs at; the file was written for 24 kHz.
export function sampler(SR: number): () => number[] {
  const TL = (SR * 60) / 90 / 2;        // samples per tick: 90 BPM, 2 ticks a beat

  // --- waves. mod is phase modulation in radians, folded into the same call ---
  const fmod = (a: number, b: number): number => ((a % b) + b) % b;
  const W = [
    (x: number, m: number): number => sin(2 * PI * x + m),                 // sine
    (x: number, _m: number): number => fmod(2 * x + 1, 2) - 1,             // saw
    (x: number, m: number): number => W[0](x, 0.5 * (W[0](2 * x, m) + m)), // rounded square
  ];

  // --- envelope: [value, stage, held, active, attack, decay, sustain, release]
  // Stage 0 attack, 1 decay, 2 sustain, 3 release. Zero-length stages need no
  // special case: 1/SR/0 is Infinity, so the ramp reaches its target in one step.
  const env = (e: number[]): number => {
    if (!e[3]) return 0;
    const out = e[0], top = e[5] ? 1 : e[6];
    if (!e[2] && e[1] != 3) e[1] = 3;
    if (!e[1]) {
      e[0] = min(e[0] + 1 / SR / e[4], top);
      if (e[0] == top) e[1] = e[5] ? 1 : 2;
    } else if (e[1] == 1) {
      e[0] = max(e[0] - 1 / SR / e[5], e[6]);
      if (e[0] == e[6]) e[1] = e[6] ? 2 : 3;
    } else if (e[1] == 3) {
      e[0] = max(e[0] - 1 / SR / e[7], 0);
      if (!e[0]) e[3] = 0;
    }
    return out;
  };

  // --- LFO: smoothstep-interpolated random, bipolar. [freq, depth, phase, from, to]
  const lfo = (l: number[]): number => {
    if (l[2] >= 1) { l[2] -= 1; l[3] = l[4]; l[4] = 2 * random() - 1; }
    const p = l[2], c = 3 * p * p - 2 * p * p * p;
    l[2] += l[0] / SR;
    return (l[3] * (1 - c) + l[4] * c) * l[1];
  };

  // --- a voice: [ratio, carrier phase, mod phase, amp env, mod env, carrier,
  //               modulator, mod level, LFO, mixer channel, is-the-bass]
  const notes: any[][] = [];
  const voice = (n: any[]): number => {
    const step = (BASEFREQ * n[0]) / SR;
    const m = n[7] ? n[7] * W[n[6]](n[2] + lfo(n[8]), 0) * env(n[4]) : 0;
    const out = W[n[5]](n[1], m) * env(n[3]);
    n[1] = (n[1] + step) % 1;
    n[2] = (n[2] + step) % 1;
    return out;
  };

  /* ------------------------------------------------------------- effects ---- */
  // Each effect is [kind, ...state]: 0 gain, 1 low-pass, 2 multi-tap delay,
  // 3 diffuser. Kinds 2 and 3 run 8 internal channels.
  const CH = 8;
  const buf = (len: number): Float64Array => new Float64Array(max(1, round(len)));

  const gain = (db: number): any[] => [0, 2 ** (db / 6)];

  // The collapsed filter (see the header): per section, one state that both
  // channels run through, K the pole and G the gain.
  const lpf = (cut: number, order: number): any[] => {
    const a = tan((PI * min(cut, 10300)) / SR), a2 = a * a, co: number[] = [];
    for (let i = 0; i < order; i++) {
      const r = sin((PI * (2 * i + 1)) / (4 * order)), s = a2 + 2 * a * r + 1;
      co.push((2 * (1 - a2)) / s + (4 * a * r) / s - 1, (4 * a2) / s);
    }
    return [1, co, new Float64Array(order)];
  };

  // [3, buffers, write index]: 8 taps of random length up to maxdur ms, mixed
  // by a Hadamard matrix. Feeds the reverb its density.
  const diff = (maxdur: number): any[] => {
    const n = (maxdur / 1e3) * SR, bufs: Float64Array[] = [];
    for (let c = 0; c < CH; c++) bufs.push(buf(floor((n * c) / CH + (n / CH) * random()) + 1));
    return [3, bufs, 0];
  };

  // [2, buffers, write index, feedback, mix, mod depth, mod frequency]: 8 taps
  // spread over an octave of delay times, read at a slowly wobbling position and
  // mixed by a Householder matrix.
  const delay = (time: number, fdbk: number, mix: number, mod: number, modf: number): any[] => {
    const bufs: Float64Array[] = [];
    for (let c = 0; c < CH; c++) bufs.push(buf(min((time / 1e3) * SR * 2 ** (c / CH), 1e6)));
    return [2, bufs, 0, fdbk, mix, (SR / 960) * mod, modf];
  };

  const fx = (f: any[], sig: number[]): number[] => {
    if (!f[0]) return [sig[0] * f[1], sig[1] * f[1]];

    if (f[0] == 1) {
      const co: number[] = f[1], st: Float64Array = f[2], out = [sig[0], sig[1]];
      for (let i = 0; i < st.length; i++) {
        for (let c = 0; c < 2; c++) {
          st[i] = co[2 * i] * st[i] + out[c];
          out[c] = co[2 * i + 1] * st[i];
        }
      }
      return out;
    }

    // both multi-channel effects take either a stereo pair (spread to mono
    // across all 8 taps, dry kept as the 9th) or another effect's 9 values
    const wide = sig.length > 2 ? sig : Array(CH + 1).fill((sig[0] + sig[1]) / 2);
    const bufs: Float64Array[] = f[1], tap: number[] = [];

    if (f[0] == 3) {
      for (let i = 0; i < CH; i++) {
        const p = f[2] % bufs[i].length;
        tap[i] = bufs[i][p];
        bufs[i][p] = wide[i];
      }
      f[2]++;
      // Hadamard, then the 1/sqrt(8) that keeps it unitary
      for (let len = 1; len < CH; len *= 2) {
        for (let i = 0; i < CH; i += len * 2) {
          for (let j = i; j < i + len; j++) {
            const x = tap[j], y = tap[j + len];
            tap[j] = x + y;
            tap[j + len] = x - y;
          }
        }
      }
      for (let i = 0; i < CH; i++) tap[i] *= (1 / CH) ** 0.5;
      return tap.concat(wide[CH]);
    }

    for (let i = 0; i < CH; i++) {
      const b = bufs[i], L = b.length;
      const pos = f[2] + f[5] * (1 - cos((f[6] * 2 * PI * f[2]) / SR / 2 ** (i / CH)));
      tap[i] = lerp(b[floor(pos) % L], b[(floor(pos) + 1) % L], pos % 1);
    }
    // Householder: every tap gets -2/n of the sum
    let sum = 0;
    for (let i = 0; i < CH; i++) sum += tap[i];
    sum *= -2 / CH;
    for (let i = 0; i < CH; i++) tap[i] += sum;

    for (let i = 0; i < CH; i++) bufs[i][f[2] % bufs[i].length] = wide[i] + tap[i] * f[3];
    f[2]++;
    return sig.length > 2
      ? [0, 1].map((c) => lerp(wide[CH], lerp(tap[c], wide[c], 0.5), f[4]))
      : [0, 1].map((c) => lerp(sig[c], tap[c], f[4]));
  };

  /* --------------------------------------------------------------- mixer ---- */
  // [destination channel (-1 is the output), effects...]. Channels are processed
  // top down and only ever send downward, so one pass resolves the whole graph.
  const MIX: any[][] = [
    [-1, gain(-12), diff(20), diff(40), diff(80), diff(160), delay(200, 0.85, 0.75, 0.85, 1.5)],
    [0, lpf(1500, 2)],
    [-1, gain(-15)],
    [0, gain(3), lpf(2000, 2), delay(4, 0, 0.5, 1, 2)],
    [3, gain(3)],
  ];
  const SIG: number[][] = MIX.map(() => [0, 0]);

  /* ----------------------------------------------------------- sequencer ---- */
  // The encoded patterns, flattened into [ticks, patch, pitch, patch, pitch, ...]
  const ROWS: number[][] = [];
  for (const a of ARR) {
    const s = PATS[+a];
    for (let i = 0; i < s.length; ) {
      const c = s.charCodeAt(i++);
      if (c < 78) ROWS.push([c - 65]);
      else ROWS[ROWS.length - 1].push(c - 97, s.charCodeAt(i++) - 110);
    }
  }

  let now = 0, next = 0, ptr = 0;

  return (): number[] => {
    if (now >= next) {
      const row = ROWS[ptr];
      for (let i = 1; i < row.length; i += 2) {
        const p = P[row[i]], pitch = row[i + 1];
        if (!p) {
          // note-off: release every envelope of the bass voice
          for (const n of notes) if (n[10]) { n[3][2] = 0; if (n[4]) n[4][2] = 0; }
        } else {
          notes.push([
            2 ** ((pitch + p[0]) / 12), 0, 0,
            [0, 0, 1, 1, p[1], p[2], p[3], p[4]],
            p[11] && [0, 0, 1, 1, p[5], p[6], p[7], p[8]],
            p[9], p[10], p[11],
            p[11] && [p[12] * BASEFREQ * 2 ** (pitch / 12), p[13], 1, 0, 0],
            p[14], p[15],
          ]);
        }
      }
      next += row[0] * TL;
      ptr = (ptr + 1) % ROWS.length;    // the song loops
    }
    now++;

    const sum = [0, 0];
    for (let i = 0; i < notes.length; ) {
      if (!notes[i][3][3]) { notes.splice(i, 1); continue; }
      const out = voice(notes[i]), s = SIG[notes[i][9]];
      s[0] += out;
      s[1] += out;
      i++;
    }

    for (let j = MIX.length; j--; ) {
      let sig = SIG[j];
      for (let k = 1; k < MIX[j].length; k++) sig = fx(MIX[j][k], sig);
      const dst = MIX[j][0] < 0 ? sum : SIG[MIX[j][0]];
      dst[0] += sig[0];
      dst[1] += sig[1];
      SIG[j] = [0, 0];
    }
    return sum;
  };
}

/* ------------------------------------------------------------------ playback */
// Volume: the tune peaks around 0.73, so this keeps it under a third of full
// scale — background, not foreground.
const VOL = 0.4;
// The engine runs at the rate the song was written for and the output is
// interpolated up to whatever the context runs at, which is galaxy-raid's
// arrangement (its bytebeats step a song clock of their own) and halves the
// cost: 15% of a core at 48 kHz becomes 8% at 24 kHz. Generating at the context
// rate instead is a one-word change — sampler(c.sampleRate), step 1 — and sounds
// marginally cleaner if the budget ever stops mattering.
const SONG_SR = 24000;
let node: ScriptProcessorNode | null = null;

// Idempotent, and called from a gesture handler so the context is allowed to
// start. Wrapped like sfx.ts: a blocked or missing AudioContext means silence,
// never an exception.
export function startMusic(): void {
  if (node || muted) return;
  try {
    const c = ac(), next = sampler(SONG_SR), step = SONG_SR / c.sampleRate;
    let pos = 0, a = next(), b = next();
    node = c.createScriptProcessor(4096, 0, 2);
    node.onaudioprocess = (e: AudioProcessingEvent): void => {
      const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1);
      for (let i = 0; i < l.length; i++) {
        pos += step;
        while (pos >= 1) { pos--; a = b; b = next(); }
        l[i] = (a[0] + (b[0] - a[0]) * pos) * VOL;
        r[i] = (a[1] + (b[1] - a[1]) * pos) * VOL;
      }
    };
    node.connect(c.destination);
  } catch {}
}

// Mutes the interface sounds too — one control for all the audio. A disconnected
// ScriptProcessorNode stops being pulled, so muting costs no CPU and the song
// resumes where it left off rather than restarting. Returns the new state.
export function toggleMute(): boolean {
  setMuted(!muted);
  if (muted) { try { (node as ScriptProcessorNode).disconnect(); } catch {} }
  else if (node) { try { node.connect(ac().destination); } catch {} }
  else startMusic();     // muted before the music ever started
  return muted;
}
