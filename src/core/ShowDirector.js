import config, { getPhaseAtTime } from "../config.js";
import {
  loadShapePoints,
  loadShapePointsFromCanvas,
} from "../shapes/loadShapePoints.js";
import {
  loadProcessedTextImage,
  loadProcessedCatImage,
} from "../utils/processHoldImage.js";
import ParticleSystem from "./ParticleSystem.js";
import Fireworks from "../scenes/Fireworks.js";
import { easeInOutCubic, lerp } from "../utils/easing.js";
import { boostPointColors } from "../utils/boostPointColors.js";

export default class ShowDirector {
  constructor({ scene, camera, timeline, cosmicScene }) {
    this.scene = scene;
    this.camera = camera;
    this.timeline = timeline;
    this.cosmicScene = cosmicScene;

    this.ready = false;
    this.handledPhases = new Set();
    this.inFinale = false;
    this.finaleCameraZ = config.phase1.camera.endZ;

    const { particleCount, particleSize } = config;

    this.mainParticles = new ParticleSystem(particleCount, { size: particleSize });
    this.mainParticles.setOpacity(0);

    this.fireworks = new Fireworks(6000);

    this.scene.add(this.fireworks.group);
    this.scene.add(this.mainParticles.group);

    this._loadAssets();
  }

  handlePhase(phase) {
    if (!this.ready) {
      this.pendingPhases ??= new Set();
      this.pendingPhases.add(phase);
      return;
    }
    this._onPhaseChange(phase);
  }

  async _loadAssets() {
    try {
      const { assets, particleCount, quality, textView, catView, groupView } =
        config;
      const sampleMax = quality.sampleMaxSize;

      const [seal, weiwei, catProcessed, textProcessed, group] =
        await Promise.all([
          loadShapePoints(assets.seal, particleCount, "outline", {
            sampleMaxSize: sampleMax,
          }),
          loadShapePoints(assets.weiwei, particleCount, "fill", {
            sampleMaxSize: sampleMax,
          }),
          loadProcessedCatImage(assets.cat),
          loadProcessedTextImage(assets.text),
          loadShapePoints(assets.group, particleCount, "fill", {
            sampleMaxSize: sampleMax,
            useNative: true,
            fitView: groupView,
          }),
        ]);

      const textRaw = loadShapePointsFromCanvas(
        textProcessed.ctx,
        textProcessed.width,
        textProcessed.height,
        particleCount,
        "fill",
        { fitView: textView }
      );

      const cat = loadShapePointsFromCanvas(
        catProcessed.ctx,
        catProcessed.width,
        catProcessed.height,
        particleCount,
        "fill",
        { fitView: catView }
      );

      this.sealPoints = seal;
      this.weiweiPoints = weiwei;
      this.catPoints = cat;
      this.textPoints = textRaw;
      this.groupPoints = boostPointColors(group, {
        gain: config.groupVisual.sampleGain,
        lift: config.groupVisual.sampleLift,
      });

      this.ready = true;
      this._flushPendingPhases();

      const elapsed = this.timeline.elapsed;
      const phase = getPhaseAtTime(config, elapsed);
      if (!this.handledPhases.has(phase)) {
        this._onPhaseChange(phase);
      }

      this._syncToElapsed(elapsed);
      console.info("[ShowDirector] assets loaded");
    } catch (error) {
      console.error("[ShowDirector] failed to load assets", error);
    }
  }

  _flushPendingPhases() {
    if (!this.pendingPhases?.size) return;
    const ordered = [...this.pendingPhases].sort(
      (a, b) =>
        config.timeline.phases[a].start - config.timeline.phases[b].start
    );
    for (const phase of ordered) {
      this._onPhaseChange(phase);
    }
    this.pendingPhases.clear();
  }

  _hideAllSharpLayers() {
    this.mainParticles.setOpacity(1);
  }

  _setTextParticleMode() {
    const tv = config.textVisual;
    this.mainParticles.resetEnhancements();
    this.mainParticles.setSharpRender(false);
    this.mainParticles.setColorBoost(tv.colorBoost, tv.colorLift);
    if (tv.additive) this.mainParticles.setAdditiveBlend(true);
    this.mainParticles.setSize(tv.particleSize ?? config.textParticleSize);
    this.mainParticles.setTextFlowOptions({
      intensity: tv.flowIntensity,
      wave: tv.wave,
      colorPulse: tv.colorPulse,
    });
    this.mainParticles.setOpacity(1);
  }

  _finishTextReveal() {
    this.mainParticles.hold();
    this.mainParticles.resumeTextFlow();
  }

  _ensureFireworks(boost = 1, { textPhase = false } = {}) {
    this.fireworks.ensureRunning();
    this.fireworks.setBurstBoost(boost);

    if (textPhase) {
      const fw = config.textVisual?.fireworks ?? {};
      this.fireworks.setPresentation({
        z: fw.z ?? -3.6,
        size: fw.size ?? 0.1,
        spread: fw.spread ?? 1.25,
        edgeBias: fw.edgeBias ?? true,
        opacity: fw.opacity ?? 1,
      });
      return;
    }

    this.fireworks.setPresentation({
      z: -4.2,
      size: 0.075,
      spread: 1,
      edgeBias: false,
      opacity: 0.95,
    });
  }

  _applyTextTypewriterHold(points, morphStart, morphDuration, elapsed) {
    this._ensureFireworks(config.textVisual?.fireworksBoost ?? 1.45, {
      textPhase: true,
    });
    this.mainParticles.group.visible = true;
    this.mainParticles.setOpacity(1);

    const morphEnd = morphStart + morphDuration;
    if (elapsed >= morphEnd) {
      this.mainParticles.setBaseShapeWithColors(points);
      this._finishTextReveal();
      return;
    }

    if (elapsed >= morphStart) {
      this.mainParticles.syncTypewriterAt(
        points,
        morphDuration,
        elapsed - morphStart
      );
    }
  }

  _applyParticleHold(points, morphEnd, elapsed) {
    this.mainParticles.group.visible = true;
    this.mainParticles.setOpacity(1);
    this.mainParticles.setBaseShapeWithColors(points);
    if (elapsed >= morphEnd) {
      this.mainParticles.hold();
      this.mainParticles.resumeFlow();
    }
  }

  _syncToElapsed(elapsed) {
    const phases = config.timeline.phases;

    if (elapsed >= phases.text.start) {
      this.inFinale = true;
      this._ensureFireworks(config.textVisual?.fireworksBoost ?? 1.45, {
      textPhase: true,
    });
      this._setTextParticleMode();
      this._applyTextTypewriterHold(
        this.textPoints,
        phases.text.start,
        phases.text.morph,
        elapsed
      );
      return;
    }

    if (elapsed >= phases.finale.start) {
      this.inFinale = true;
      this._ensureFireworks(1);
      this.finaleCameraZ = config.finaleLayout.cameraZ;
      this._hideAllSharpLayers();
      this._setGroupParticleMode();
      this.mainParticles.group.visible = true;
      this.mainParticles.setOpacity(1);

      const morphEnd = phases.finale.start + phases.finale.morph;
      if (elapsed >= morphEnd) {
        this.mainParticles.setBaseShapeWithColors(this.groupPoints);
        this.mainParticles.hold();
        this.mainParticles.resumeFlow();
      }
      return;
    }

    if (elapsed >= phases.cat.start) {
      this.inFinale = false;
      this._setSoftParticleMode();
      this._applyParticleHold(
        this.catPoints,
        phases.cat.start + phases.cat.morph,
        elapsed
      );
    } else if (elapsed >= phases.weiwei.start) {
      this._hideAllSharpLayers();
      this._setDetailMode(false);
      this.mainParticles.group.visible = true;
      this.mainParticles.setOpacity(1);
      this.mainParticles.setBaseShapeWithColors(this.weiweiPoints);
      this.mainParticles.hold();
      this.mainParticles.resumeFlow();
    } else if (elapsed >= phases.seal.start) {
      this._hideAllSharpLayers();
      this._setDetailMode(false);
      this.mainParticles.group.visible = true;
      this.mainParticles.setOpacity(1);
      this.mainParticles.setBaseShapeWithColors(this.sealPoints);
      this.mainParticles.hold();
      this.mainParticles.resumeFlow();
    }
  }

  _setSoftParticleMode() {
    this.mainParticles.resetEnhancements();
    this._setDetailMode(false, config.particleSize);
  }

  _setGroupParticleMode() {
    const g = config.groupVisual;
    this.mainParticles.resetEnhancements();
    this.mainParticles.setSharpRender(false);
    this.mainParticles.setColorBoost(g.colorBoost, g.colorLift);
    this.mainParticles.setAdditiveBlend(true);
    this.mainParticles.setSize(g.particleSize);
    this.mainParticles.setOpacity(1);
  }

  _setDetailMode(enabled, size = config.particleSize) {
    this.mainParticles.setSharpRender(enabled);
    this.mainParticles.setSize(size);
  }

  _onPhaseChange(phase) {
    if (!this.ready || this.handledPhases.has(phase)) return;
    this.handledPhases.add(phase);

    const phases = config.timeline.phases;

    switch (phase) {
      case "intro":
        break;
      case "seal":
        this._hideAllSharpLayers();
        this._setDetailMode(false);
        this._appearShape(this.sealPoints, phases.seal.morph);
        break;
      case "sealScatter":
        this.mainParticles.startExplode({ autoMorph: false });
        break;
      case "weiwei":
        this._setDetailMode(false);
        this.mainParticles.morphTo(this.weiweiPoints, phases.weiwei.morph, () => {
          this.mainParticles.hold();
          this.mainParticles.resumeFlow();
        });
        break;
      case "weiweiScatter":
        this.mainParticles.startExplode({ autoMorph: false });
        break;
      case "cat":
        this._hideAllSharpLayers();
        this._setSoftParticleMode();
        this.mainParticles.setOpacity(1);
        this.mainParticles.morphTo(this.catPoints, phases.cat.morph, () => {
          this.mainParticles.hold();
          this.mainParticles.resumeFlow();
        });
        break;
      case "finale":
        this._hideAllSharpLayers();
        this.inFinale = true;
        this.finaleCameraZ = config.finaleLayout.cameraZ;
        this._setGroupParticleMode();
        this.mainParticles.setOpacity(1);
        this.mainParticles.morphTo(this.groupPoints, phases.finale.morph, () => {
          this.mainParticles.hold();
          this.mainParticles.resumeFlow();
        });
        this.fireworks.start();
        this.fireworks.setBurstBoost(1);
        break;
      case "text":
        this._hideAllSharpLayers();
        this.inFinale = true;
        this._ensureFireworks(config.textVisual?.fireworksBoost ?? 1.45, {
      textPhase: true,
    });
        this._setTextParticleMode();
        this.mainParticles.morphToTypewriter(
          this.textPoints,
          phases.text.morph,
          () => this._finishTextReveal()
        );
        break;
      default:
        break;
    }
  }

  _appearShape(points, duration) {
    this.mainParticles.setRandomPositions(12);
    this.mainParticles.setOpacity(1);
    this.mainParticles.group.visible = true;
    this.mainParticles.morphTo(points, duration, () => {
      this.mainParticles.hold();
      this.mainParticles.resumeFlow();
    });
  }

  update(elapsed, delta) {
    this._updateCamera(elapsed);

    const phases = config.timeline.phases;
    let starFade = Math.max(0.12, 1 - elapsed / 3);
    const textEnd =
      phases.text.start + phases.text.morph + phases.text.hold;
    if (elapsed >= phases.finale.start && elapsed < textEnd) {
      starFade = Math.min(starFade, config.groupVisual.starFade);
    }
    this.cosmicScene.setFade(starFade);

    if (elapsed >= config.timeline.phases.seal.start) {
      this.mainParticles.update(delta);
    }

    if (
      elapsed >= phases.text.start ||
      this.inFinale ||
      elapsed >= phases.finale.start
    ) {
      const boost =
        elapsed >= phases.text.start
          ? config.textVisual?.fireworksBoost ?? 1.45
          : 1;
      const textPhase = elapsed >= phases.text.start;
      this.fireworks.setBurstBoost(boost);
      if (textPhase) {
        const fw = config.textVisual?.fireworks ?? {};
        this.fireworks.setPresentation({
          z: fw.z ?? -3.6,
          size: fw.size ?? 0.1,
          spread: fw.spread ?? 1.25,
          edgeBias: fw.edgeBias ?? true,
          opacity: fw.opacity ?? 1,
        });
      }
      this.fireworks.update(delta);
    }
  }

  _updateCamera(elapsed) {
    const { camera: cam } = config.phase1;
    const introT = easeInOutCubic(Math.min(elapsed / 2, 1));
    let targetZ = lerp(cam.startZ, cam.endZ, introT);

    if (this.inFinale) {
      const finaleStart = config.timeline.phases.finale.start;
      const pullBack = easeInOutCubic(
        Math.min(Math.max((elapsed - finaleStart) / 0.8, 0), 1)
      );
      targetZ = lerp(cam.endZ, this.finaleCameraZ, pullBack);
    }

    this.camera.position.z = targetZ;
    this.camera.lookAt(...cam.lookAt);
  }
}
