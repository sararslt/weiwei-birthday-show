export default class ParticleSfx {
  constructor({ volume = 0.32 } = {}) {
    this.volume = volume;
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  async unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer(0.6);
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  _createNoiseBuffer(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _now() {
    return this.ctx?.currentTime ?? 0;
  }

  playAppear() {
    if (!this.ctx) return;
    this._playToneSweep({
      startHz: 220,
      endHz: 680,
      duration: 1.1,
      peak: 0.14,
      type: "sine",
    });
    this._playSparkle(0.08, 0.06, 4);
  }

  playGather() {
    if (!this.ctx) return;
    this._playToneSweep({
      startHz: 180,
      endHz: 920,
      duration: 1.35,
      peak: 0.16,
      type: "triangle",
    });
    this._playSparkle(0.05, 0.05, 5);
  }

  playScatter() {
    if (!this.ctx) return;
    const t = this._now();

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.85);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + 0.95);

    this._playToneSweep({
      startHz: 520,
      endHz: 90,
      duration: 0.75,
      peak: 0.1,
      type: "sine",
      delay: 0.02,
    });
  }

  playCelebrate() {
    if (!this.ctx) return;
    this._playToneSweep({
      startHz: 260,
      endHz: 1040,
      duration: 1.6,
      peak: 0.18,
      type: "triangle",
    });
    this._playSparkle(0.04, 0.04, 7);
  }

  _playToneSweep({
    startHz,
    endHz,
    duration,
    peak,
    type = "sine",
    delay = 0,
  }) {
    const t = this._now() + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startHz, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endHz, 40), t + duration);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.1);

    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.15);
  }

  _playSparkle(stagger, peak, count) {
    const t0 = this._now();
    for (let i = 0; i < count; i++) {
      const t = t0 + i * stagger;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900 + i * 180 + Math.random() * 120, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }
}
