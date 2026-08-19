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
export function sampler(SR: number): () => Float64Array {
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
  // [2, buffers, write index, feedback, mix, mod depth, per-channel angle step,
  //  cos/sin state]. The read position wobbles as cos(k·idx) per channel, which
  //  cost 16 Math.cos calls a sample — 23% of the whole engine, measured. It is
  //  the same value stepped forward instead: rotating (cos, sin) by a fixed
  //  angle is four multiplies, and re-anchoring on Math.cos every 1024 samples
  //  keeps the drift at the noise floor rather than letting it accumulate.
  const delay = (time: number, fdbk: number, mix: number, mod: number, modf: number): any[] => {
    const bufs: Float64Array[] = [], k = new Float64Array(CH);
    const cs = new Float64Array(2 * CH), ks = new Float64Array(2 * CH);
    for (let c = 0; c < CH; c++) {
      bufs.push(buf(min((time / 1e3) * SR * 2 ** (c / CH), 1e6)));
      k[c] = (modf * 2 * PI) / SR / 2 ** (c / CH);
      cs[2 * c] = 1;                              // cos(0), sin(0) at idx 0
      ks[2 * c] = cos(k[c]);                      // the one-sample rotation
      ks[2 * c + 1] = sin(k[c]);
    }
    return [2, bufs, 0, fdbk, mix, (SR / 960) * mod, k, cs, ks];
  };

  // Scratch shared by every effect: S is the signal bus (stereo in [0] and [1],
  // widened in place to 8 taps plus the dry channel when a multi-channel effect
  // needs it), T holds the taps. Both are reused for the life of the sampler —
  // the previous version returned fresh arrays from every stage, which is ~30
  // allocations a sample, and a GC pause inside an audio callback is a click.
  const S = new Float64Array(CH + 1), T = new Float64Array(CH + 1);

  // Runs one effect over S in place and returns the channel count that leaves it.
  const fx = (f: any[], n: number): number => {
    if (!f[0]) { S[0] *= f[1]; S[1] *= f[1]; return n; }

    if (f[0] == 1) {
      const co: number[] = f[1], st: Float64Array = f[2];
      for (let i = 0; i < st.length; i++) {
        for (let c = 0; c < 2; c++) {
          st[i] = co[2 * i] * st[i] + S[c];
          S[c] = co[2 * i + 1] * st[i];
        }
      }
      return n;
    }

    // both multi-channel effects take either a stereo pair (spread to mono
    // across all 8 taps, dry kept as the 9th) or another effect's 9 values
    const bufs: Float64Array[] = f[1], idx: number = f[2];
    const dry0 = S[0], dry1 = S[1];
    if (n == 2) { const m = (S[0] + S[1]) / 2; for (let i = 0; i <= CH; i++) S[i] = m; }

    if (f[0] == 3) {
      for (let i = 0; i < CH; i++) {
        const p = idx % bufs[i].length;
        T[i] = bufs[i][p];
        bufs[i][p] = S[i];
      }
      f[2]++;
      // Hadamard, then the 1/sqrt(8) that keeps it unitary
      for (let len = 1; len < CH; len *= 2) {
        for (let i = 0; i < CH; i += len * 2) {
          for (let j = i; j < i + len; j++) {
            const x = T[j], y = T[j + len];
            T[j] = x + y;
            T[j + len] = x - y;
          }
        }
      }
      const dry = S[CH];
      for (let i = 0; i < CH; i++) S[i] = T[i] * (1 / CH) ** 0.5;
      S[CH] = dry;
      return CH + 1;
    }

    const k: Float64Array = f[6], cs: Float64Array = f[7], ks: Float64Array = f[8];
    const anchor = (idx & 1023) == 0;
    for (let i = 0; i < CH; i++) {
      if (anchor) { cs[2 * i] = cos(k[i] * idx); cs[2 * i + 1] = sin(k[i] * idx); }
      const b = bufs[i], L = b.length;
      const pos = idx + f[5] * (1 - cs[2 * i]);
      const p = floor(pos);
      T[i] = lerp(b[p % L], b[(p + 1) % L], pos % 1);
      // rotate this channel's angle on by one sample, ready for the next call
      const c = cs[2 * i], s = cs[2 * i + 1];
      cs[2 * i] = c * ks[2 * i] - s * ks[2 * i + 1];
      cs[2 * i + 1] = s * ks[2 * i] + c * ks[2 * i + 1];
    }
    // Householder: every tap gets -2/n of the sum
    let sum = 0;
    for (let i = 0; i < CH; i++) sum += T[i];
    sum *= -2 / CH;
    for (let i = 0; i < CH; i++) T[i] += sum;

    for (let i = 0; i < CH; i++) bufs[i][idx % bufs[i].length] = S[i] + T[i] * f[3];
    f[2]++;
    if (n == 2) {
      S[0] = lerp(dry0, T[0], f[4]);
      S[1] = lerp(dry1, T[1], f[4]);
    } else {
      const dry = S[CH];
      S[0] = lerp(dry, lerp(T[0], S[0], 0.5), f[4]);
      S[1] = lerp(dry, lerp(T[1], S[1], 0.5), f[4]);
    }
    return 2;
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
  // one flat pair per channel, rather than an array of arrays that has to be
  // replaced every sample
  const SIG = new Float64Array(2 * MIX.length);
  const OUT = new Float64Array(2);        // what the sampler hands back, reused

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

  return (): Float64Array => {
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

    let sum0 = 0, sum1 = 0;
    for (let i = 0; i < notes.length; ) {
      if (!notes[i][3][3]) { notes.splice(i, 1); continue; }
      const out = voice(notes[i]), s = 2 * notes[i][9];
      SIG[s] += out;
      SIG[s + 1] += out;
      i++;
    }

    for (let j = MIX.length; j--; ) {
      S[0] = SIG[2 * j];
      S[1] = SIG[2 * j + 1];
      let n = 2;
      for (let k = 1; k < MIX[j].length; k++) n = fx(MIX[j][k], n);
      const d: number = MIX[j][0];
      if (d < 0) { sum0 += S[0]; sum1 += S[1]; }
      else { SIG[2 * d] += S[0]; SIG[2 * d + 1] += S[1]; }
      SIG[2 * j] = SIG[2 * j + 1] = 0;
    }
    OUT[0] = sum0;
    OUT[1] = sum1;
    return OUT;
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
    // scalars, not the two arrays: the sampler hands back the same Float64Array
    // every call, so holding on to it as "the previous sample" would alias
    let pos = 0, s = next(), a0 = s[0], a1 = s[1];
    s = next();
    let b0 = s[0], b1 = s[1];
    node = c.createScriptProcessor(4096, 1, 2);
    node.onaudioprocess = (e: AudioProcessingEvent): void => {
      const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1);
      for (let i = 0; i < l.length; i++) {
        pos += step;
        while (pos >= 1) {
          pos--;
          a0 = b0; a1 = b1;
          const v = next();
          b0 = v[0]; b1 = v[1];
        }
        l[i] = (a0 + (b0 - a0) * pos) * VOL;
        r[i] = (a1 + (b1 - a1) * pos) * VOL;
      }
    };
    node.connect(c.destination);
  } catch {}
}

// Every pointer and key event lands here, not just the first: creating the
// node is idempotent, and ac() resumes a context that is suspended — which iOS
// can leave it even after a gesture, and which nothing else would retry.
export function wakeAudio(): void {
  try { ac(); } catch {}
  startMusic();
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
