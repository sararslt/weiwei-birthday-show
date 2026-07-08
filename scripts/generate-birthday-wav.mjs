import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MELODY = [
  { note: "G4", dur: 0.35 },
  { note: "G4", dur: 0.15 },
  { note: "A4", dur: 0.5 },
  { note: "G4", dur: 0.5 },
  { note: "C5", dur: 0.5 },
  { note: "B4", dur: 0.75 },

  { note: "G4", dur: 0.35 },
  { note: "G4", dur: 0.15 },
  { note: "A4", dur: 0.5 },
  { note: "G4", dur: 0.5 },
  { note: "D5", dur: 0.5 },
  { note: "C5", dur: 0.75 },

  { note: "G4", dur: 0.35 },
  { note: "G4", dur: 0.15 },
  { note: "G5", dur: 0.5 },
  { note: "E5", dur: 0.5 },
  { note: "C5", dur: 0.5 },
  { note: "B4", dur: 0.5 },
  { note: "A4", dur: 0.75 },

  { note: "F5", dur: 0.35 },
  { note: "F5", dur: 0.15 },
  { note: "E5", dur: 0.5 },
  { note: "C5", dur: 0.5 },
  { note: "D5", dur: 0.5 },
  { note: "C5", dur: 1.2 },
];

const FREQ = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

const SAMPLE_RATE = 44100;
const GAP = 0.08;

function synthesizeMelody() {
  const totalDuration =
    MELODY.reduce((sum, { dur }) => sum + dur, 0) + GAP * (MELODY.length - 1);
  const samples = Math.ceil(totalDuration * SAMPLE_RATE);
  const buffer = new Float32Array(samples);

  let cursor = 0;

  for (const { note, dur } of MELODY) {
    const start = cursor;
    const length = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = envelope(t, dur);
      const tone =
        Math.sin(2 * Math.PI * FREQ[note] * t) * 0.55 +
        Math.sin(2 * Math.PI * FREQ[note] * 2 * t) * 0.12;
      buffer[start + i] += tone * env * 0.28;
    }

    cursor += length + Math.floor(GAP * SAMPLE_RATE);
  }

  return buffer;
}

function envelope(t, dur) {
  const attack = 0.03;
  const release = 0.08;
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

function encodeWav(floatSamples) {
  const pcm = new Int16Array(floatSamples.length);

  for (let i = 0; i < floatSamples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  const header = Buffer.alloc(44);
  const dataSize = pcm.length * 2;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, Buffer.from(pcm.buffer)]);
}

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, "../public/birthday.wav");
const wav = encodeWav(synthesizeMelody());

writeFileSync(output, wav);
console.log(`Wrote ${output} (${wav.length} bytes)`);
