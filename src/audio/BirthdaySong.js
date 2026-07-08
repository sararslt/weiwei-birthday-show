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
  { note: "C5", dur: 1.0 },
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

export default class BirthdaySong {
  constructor() {
    this.ctx = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play() {
    const ctx = this._ensureContext();
    let time = ctx.currentTime + 0.1;

    for (const { note, dur } of MELODY) {
      this._playNote(ctx, FREQ[note], time, dur);
      time += dur;
    }
  }

  _playNote(ctx, freq, start, dur) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.05);
    gain.gain.setValueAtTime(0.18, start + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}
