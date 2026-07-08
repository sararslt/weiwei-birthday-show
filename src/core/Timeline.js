import config, { getPhaseAtTime } from "../config.js";

export default class Timeline {
  constructor({ audio, onPhaseChange } = {}) {
    this.elapsed = 0;
    this.running = true;
    this.currentPhase = "intro";
    this.audio = audio;
    this.onPhaseChange = onPhaseChange;

    queueMicrotask(() => {
      this.onPhaseChange?.(this.currentPhase, this.elapsed);
    });
  }

  update(delta) {
    if (!this.running) return;

    this.elapsed += delta;

    const phase = getPhaseAtTime(config, this.elapsed);
    if (phase !== this.currentPhase) {
      this.currentPhase = phase;
      this.audio?.onPhase(phase);
      this.onPhaseChange?.(phase, this.elapsed);
    }

    this.audio?.update(this.elapsed);
  }

  getLocalTime(phaseId) {
    const phase = config.timeline.phases[phaseId];
    if (!phase) return 0;
    return Math.max(this.elapsed - phase.start, 0);
  }
}
