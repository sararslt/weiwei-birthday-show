export default class BirthdayAudio {
  constructor(url, { loop = false, volume = 1 } = {}) {
    this.url = url;
    this.audio = new Audio(url);
    this.audio.preload = "auto";
    this.audio.autoplay = true;
    this.audio.playsInline = true;
    this.audio.loop = loop;
    this.baseVolume = volume;
    this.audio.volume = volume;
  }

  get isPlaying() {
    return !this.audio.paused;
  }

  async playFrom(offsetSeconds = 0) {
    this.audio.volume = this.baseVolume;

    if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = Math.min(
        Math.max(0, offsetSeconds),
        this.audio.duration - 0.05
      );
    } else {
      this.audio.currentTime = Math.max(0, offsetSeconds);
    }

    try {
      await this.audio.play();
      return true;
    } catch (error) {
      console.warn("Birthday audio playback blocked:", error);
      return false;
    }
  }

  async play() {
    return this.playFrom(0);
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  fadeOut(duration = 1.2) {
    if (this.audio.paused) return Promise.resolve();

    const startVolume = this.audio.volume;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const tick = () => {
        const t = Math.min((performance.now() - startTime) / (duration * 1000), 1);
        this.audio.volume = startVolume * (1 - t);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          this.stop();
          this.audio.volume = this.baseVolume;
          resolve();
        }
      };
      tick();
    });
  }

  get duration() {
    return this.audio.duration || 0;
  }
}
