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
import SharpImageLayer from "../scenes/SharpImageLayer.js";
import Fireworks from "../scenes/Fireworks.js";
import { easeInOutCubic, lerp } from "../utils/easing.js";

function createSharpLayer(asset, view) {
  return new SharpImageLayer(
    asset,
    view.width,
    view.height,
    view.offsetX ?? 0,
    view.offsetY ?? 0
  );
}

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
    this.textSharp = null;

    this.scene.add(this.mainParticles.group);
    this.scene.add(this.fireworks.group);

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
          loadShapePoints(assets.group, particleCount, "fill-sharp", {
            sampleMaxSize: sampleMax,
            useNative: true,
            fitView: groupView,
          }),
        ]);

      this.textSharp = createSharpLayer(textProcessed.canvas, textView);
      this.scene.add(this.textSharp.group);

      const textRaw = loadShapePointsFromCanvas(
        textProcessed.ctx,
        textProcessed.width,
        textProcessed.height,
        particleCount,
        "fill-sharp",
        { fitView: textView }
      );

      const cat = loadShapePointsFromCanvas(
        catProcessed.ctx,
        catProcessed.width,
        catProcessed.height,
        particleCount,
        "fill-sharp",
        { fitView: catView }
      );

      this.sealPoints = seal;
      this.weiweiPoints = weiwei;
      this.catPoints = cat;
      this.textPoints = textRaw;
      this.groupPoints = group;

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
    this.textSharp?.hide();
    this.mainParticles.setOpacity(1);
  }

  _showTextSharp() {
    this.mainParticles.setOpacity(0);
    this.textSharp?.show(1);
  }

  _hideTextSharp() {
    this.textSharp?.hide();
    this.mainParticles.setOpacity(1);
  }

  _applyTextHold(points, morphEnd, elapsed) {
    this.mainParticles.group.visible = true;
    this.mainParticles.setBaseShapeWithColors(points);
    this.mainParticles.hold();
    if (elapsed >= morphEnd) {
      this._showTextSharp();
    } else {
      this._hideTextSharp();
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
      this._setDetailMode(true, config.textParticleSize);
      this._applyTextHold(
        this.textPoints,
        phases.text.start + phases.text.morph,
        elapsed
      );
      return;
    }

    if (elapsed >= phases.finale.start) {
      this.inFinale = true;
      this.finaleCameraZ = config.finaleLayout.cameraZ;
      this._hideAllSharpLayers();
      this._setDetailMode(true, config.groupParticleSize);
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
      this._setDetailMode(true, config.catParticleSize);
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
        this._setDetailMode(true, config.catParticleSize);
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
        this._setDetailMode(true, config.groupParticleSize);
        this.mainParticles.setOpacity(1);
        this.mainParticles.morphTo(this.groupPoints, phases.finale.morph, () => {
          this.mainParticles.hold();
          this.mainParticles.resumeFlow();
        });
        this.fireworks.start();
        break;
      case "text":
        this._hideTextSharp();
        this._setDetailMode(true, config.textParticleSize);
        this.mainParticles.morphTo(this.textPoints, phases.text.morph, () => {
          this.mainParticles.hold();
          this._showTextSharp();
        });
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
    this.cosmicScene.setFade(Math.max(0.12, 1 - elapsed / 3));

    if (elapsed >= config.timeline.phases.seal.start) {
      this.mainParticles.update(delta);
    }

    if (this.inFinale || elapsed >= config.timeline.phases.finale.start) {
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
