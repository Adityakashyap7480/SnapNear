// Renders the web app's Web Audio chimes (src/lib/sound.web.ts) into WAV files for the phone app.
// Run once after changing a tone: node scripts/generate-sounds.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
const RATE = 44100;

const wave = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  triangle: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

/** Piecewise automation like AudioParam: [{ t, v, ramp: 'set' | 'exp' }] */
function paramAt(events, t) {
  let value = events[0].v;
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    if (t < e.t) {
      if (e.ramp === 'exp' && i > 0) {
        const prev = events[i - 1];
        const k = (t - prev.t) / (e.t - prev.t);
        return prev.v * (e.v / prev.v) ** k;
      }
      return value;
    }
    value = e.v;
  }
  return value;
}

function voice({ type, freq, gain, start, stop }) {
  return { type, freq, gain, start, stop };
}

const tone = ({ freq, start, duration, type = 'sine', volume = 0.2 }) =>
  voice({
    type,
    freq: [{ t: start, v: freq, ramp: 'set' }],
    gain: [
      { t: start, v: 0.0001, ramp: 'set' },
      { t: start + 0.02, v: volume, ramp: 'exp' },
      { t: start + duration, v: 0.0001, ramp: 'exp' },
    ],
    start,
    stop: start + duration + 0.02,
  });

const SOUNDS = {
  ping: [
    voice({
      type: 'triangle',
      freq: [{ t: 0, v: 523.25, ramp: 'set' }],
      gain: [
        { t: 0, v: 0.2, ramp: 'set' },
        { t: 0.2, v: 0.01, ramp: 'exp' },
      ],
      start: 0,
      stop: 0.22,
    }),
  ],
  broadcast: [
    voice({
      type: 'sine',
      freq: [
        { t: 0, v: 587.33, ramp: 'set' },
        { t: 0.12, v: 880, ramp: 'set' },
      ],
      gain: [
        { t: 0, v: 0.3, ramp: 'set' },
        { t: 0.4, v: 0.001, ramp: 'exp' },
      ],
      start: 0,
      stop: 0.42,
    }),
  ],
  warning: [
    tone({ freq: 880, start: 0, duration: 0.35, volume: 0.22 }),
    tone({ freq: 659.25, start: 0.28, duration: 0.5, volume: 0.2 }),
  ],
  success: [
    ...[523.25, 659.25, 783.99, 1046.5].map((freq, i) => tone({ freq, start: i * 0.1, duration: 0.4, type: 'triangle', volume: 0.22 })),
    tone({ freq: 1046.5, start: 0.4, duration: 0.7, volume: 0.16 }),
    tone({ freq: 1567.98, start: 0.48, duration: 0.5, volume: 0.1 }),
    tone({ freq: 2093, start: 0.58, duration: 0.6, volume: 0.08 }),
  ],
  alarm: [
    ...[0, 1, 2, 3].map((i) => tone({ freq: 1046.5, start: 0.02 + i * 0.16, duration: 0.11, type: 'square', volume: 0.12 })),
    ...[783.99, 987.77, 1174.66, 1567.98].map((freq, i) =>
      tone({ freq, start: 0.82 + i * 0.14, duration: 0.24, type: 'triangle', volume: 0.22 })
    ),
  ],
};

function render(voices) {
  const length = Math.ceil(Math.max(...voices.map((v) => v.stop)) * RATE) + 1;
  const out = new Float32Array(length);
  for (const v of voices) {
    let phase = 0;
    for (let i = Math.floor(v.start * RATE); i < Math.min(length, Math.ceil(v.stop * RATE)); i += 1) {
      const t = i / RATE;
      phase += paramAt(v.freq, t) / RATE;
      out[i] += wave[v.type](phase) * paramAt(v.gain, t);
    }
  }
  return out;
}

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, voices] of Object.entries(SOUNDS)) {
  fs.writeFileSync(path.join(OUT, `${name}.wav`), toWav(render(voices)));
  console.log(`wrote assets/sounds/${name}.wav`);
}
