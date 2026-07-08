import config, { getMusicEndTime, getMusicStartTime } from "../config.js";
import BirthdayAudio from "./BirthdayAudio.js";
import ParticleSfx from "./ParticleSfx.js";

export default class AudioDirector {
  constructor() {
    this.ready = false;
    this.musicStarted = false;
    this.musicEnded = false;
    this.elapsed = 0;
    this.musicStartAt = getMusicStartTime(config);
    this.musicEndAt = getMusicEndTime(config);

    this.birthday = new BirthdayAudio(config.assets.birthday, {
      loop: config.timeline.audio.loop,
    });
    this.sfx = new ParticleSfx({ volume: config.timeline.audio.sfxVolume ?? 0.32 });
  }

  async start() {
    if (this.ready) return;
    this.ready = true;

    await this.sfx.unlock();
    this.sfx.playAppear();
    await this._syncMusic();
  }

  async ensurePlaying() {
    if (!this.ready) {
      await this.start();
      return;
    }

    await this.sfx.unlock();

    if (!this.musicEnded && this.elapsed >= this.musicStartAt && !this.musicStarted) {
      await this._syncMusic();
    }
  }

  update(elapsed) {
    this.elapsed = elapsed;
    if (!this.ready || this.musicEnded) return;

    if (!this.musicStarted && elapsed >= this.musicStartAt) {
      void this._syncMusic();
    }

    if (this.musicStarted && elapsed >= this.musicEndAt) {
      this.musicEnded = true;
      this.birthday.fadeOut(1.5);
    }
  }

  async _syncMusic() {
    if (this.musicEnded || this.elapsed >= this.musicEndAt) return;

    const offset = Math.max(0, this.elapsed - this.musicStartAt);
    const ok = await this.birthday.playFrom(offset);
    if (ok) {
      this.musicStarted = true;
    }
  }

  onPhase(phase) {
    if (!this.ready) return;

    if (phase === "intro") return;

    if (phase.endsWith("Scatter")) {
      this.sfx.playScatter();
      return;
    }

    switch (phase) {
      case "seal":
      case "weiwei":
      case "cat":
        this.sfx.playGather();
        break;
      case "text":
        this.sfx.playTypewriter({
          chars: config.textTypewriter?.charCount ?? 4,
          duration: config.timeline.phases.text.morph,
        });
        break;
      case "finale":
        this.sfx.playCelebrate();
        break;
      default:
        break;
    }
  }
}
