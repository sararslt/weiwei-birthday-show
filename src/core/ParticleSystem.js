import * as THREE from "three";
import { easeInOutCubic } from "../utils/easing.js";

export const MODES = {
  FLOW: "flow",
  EXPLODE: "explode",
  MORPH: "morph",
  HOLD: "hold",
  DRIFT: "drift",
};

export default class ParticleSystem {
  constructor(count, { size = 0.01, sharp = false } = {}) {
    this.count = count;
    this.mode = MODES.DRIFT;
    this.time = 0;
    this.autoMorphAfterExplode = true;
    this.sharp = sharp;

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.targetPositions = new Float32Array(count * 3);
    this.basePositions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.morphProgress = new Float32Array(count);
    this.morphFrom = new Float32Array(count * 3);

    this.flowIntensity = 0.006;
    this.morphDuration = 2.5;
    this.morphStartTime = 0;
    this.explodeStartTime = 0;
    this.explodeDuration = 1.6;
    this.onMorphComplete = null;
    this.colorBoost = null;
    this.colorLift = 0;
    this.typewriterMode = false;
    this.targetColors = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.flowProfile = "default";
    this.textFlow = {
      intensity: 0.013,
      wave: 0.005,
      colorPulse: 0.24,
    };

    for (let i = 0; i < count; i++) {
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    this.group = new THREE.Group();
    this._buildGeometry(size, sharp);
    this.group.add(this.points);
  }

  _buildGeometry(size, sharp = this.sharp) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

    const texture = sharp ? this._createSharpTexture() : this._createCircularTexture();
    const material = new THREE.PointsMaterial({
      size,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      fog: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.renderOrder = 2;
    this.points.frustumCulled = false;
    this.material = material;
  }

  _createCircularTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  _createSharpTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(10, 10, 12, 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  setSharpRender(sharp) {
    if (this.sharp === sharp) return;
    this.sharp = sharp;
    this.material.map?.dispose();
    this.material.map = sharp
      ? this._createSharpTexture()
      : this._createCircularTexture();
    this.material.needsUpdate = true;
  }

  setOpacity(value) {
    this.material.opacity = value;
  }

  setSize(size) {
    this.material.size = size;
  }

  setColorBoost(boost, lift = 0) {
    this.colorBoost = boost;
    this.colorLift = lift;
  }

  setAdditiveBlend(enabled) {
    this.material.blending = enabled
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    this.material.needsUpdate = true;
  }

  resetEnhancements() {
    this.colorBoost = null;
    this.colorLift = 0;
    this.setAdditiveBlend(false);
    this.flowProfile = "default";
    this.flowIntensity = 0.006;
  }

  setTextFlowOptions({ intensity, wave, colorPulse } = {}) {
    if (intensity != null) this.textFlow.intensity = intensity;
    if (wave != null) this.textFlow.wave = wave;
    if (colorPulse != null) this.textFlow.colorPulse = colorPulse;
  }

  resumeTextFlow() {
    this.baseColors.set(this.colors);
    this.flowProfile = "text";
    this.flowIntensity = this.textFlow.intensity;
    this.mode = MODES.FLOW;
  }

  setRandomPositions(spread = 8) {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * spread;
      this.positions[i3 + 1] = (Math.random() - 0.5) * spread;
      this.positions[i3 + 2] = (Math.random() - 0.5) * spread * 0.4;

      this.basePositions[i3] = this.positions[i3];
      this.basePositions[i3 + 1] = this.positions[i3 + 1];
      this.basePositions[i3 + 2] = this.positions[i3 + 2];

      this._setColor(i, 0.2, 0.45, 0.95);
    }
    this._commitPositions();
    this._commitColors();
  }

  setBaseShapeWithColors(points) {
    this._applyPointsToBase(points);
    this._commitPositions();
    this._commitColors();
  }

  setTargetFromPoints(points) {
    for (let i = 0; i < this.count; i++) {
      const src = points[i % points.length];
      const i3 = i * 3;
      this.targetPositions[i3] = src.x;
      this.targetPositions[i3 + 1] = src.y;
      this.targetPositions[i3 + 2] = src.z ?? 0;
      if (src.color) this._setColorFromSrc(i, src.color);
    }
    this._commitColors();
  }

  morphTo(points, duration = 2.5, onComplete = null) {
    this.typewriterMode = false;
    this.setTargetFromPoints(points);
    this.startMorph(onComplete, duration);
  }

  morphToTypewriter(points, duration = 2.5, onComplete = null) {
    this.typewriterMode = true;
    this.setTargetFromPoints(points);
    this.targetColors.set(this.colors);

    const { delays, perStroke } = this._computeTypewriterTiming(points, duration);
    this.mode = MODES.MORPH;
    this.morphStartTime = this.time;
    this.onMorphComplete = onComplete;
    this.morphDuration = perStroke;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const tx = this.targetPositions[i3];
      const ty = this.targetPositions[i3 + 1];
      const tz = this.targetPositions[i3 + 2];

      this.morphFrom[i3] = tx - 0.06 - Math.random() * 0.03;
      this.morphFrom[i3 + 1] = ty + (Math.random() - 0.5) * 0.015;
      this.morphFrom[i3 + 2] = tz;
      this.morphProgress[i] = delays[i];

      this.positions[i3] = this.morphFrom[i3];
      this.positions[i3 + 1] = this.morphFrom[i3 + 1];
      this.positions[i3 + 2] = this.morphFrom[i3 + 2];
      this._setColor(i, 0, 0, 0);
    }

    this._commitPositions();
    this._commitColors();
  }

  syncTypewriterAt(points, duration, elapsedOffset) {
    this.morphToTypewriter(points, duration, null);
    this.morphStartTime = this.time - elapsedOffset;

    const { totalDuration } = this._computeTypewriterTiming(points, duration);
    if (elapsedOffset >= totalDuration) {
      this.typewriterMode = false;
      this.setBaseShapeWithColors(points);
      this.hold();
      this.resumeTextFlow();
    }
  }

  _computeTypewriterTiming(points, duration) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const perStroke = Math.min(0.16, duration * 0.09);
    const staggerSpan = Math.max(0.5, duration - perStroke);
    const delays = new Float32Array(this.count);

    let maxDelay = 0;
    for (let i = 0; i < this.count; i++) {
      const src = points[i % points.length];
      const nx = (src.x - minX) / xRange;
      const ny = (src.y - minY) / yRange;
      delays[i] = (nx * 0.86 + ny * 0.14) * staggerSpan;
      maxDelay = Math.max(maxDelay, delays[i]);
    }

    return { delays, perStroke, totalDuration: maxDelay + perStroke };
  }

  startExplode({ autoMorph = true, onComplete = null } = {}) {
    this.mode = MODES.EXPLODE;
    this.autoMorphAfterExplode = autoMorph;
    this.explodeStartTime = this.time;
    this.onMorphComplete = onComplete;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const x = this.positions[i3];
      const y = this.positions[i3 + 1];
      const z = this.positions[i3 + 2];
      const len = Math.hypot(x, y, z) || 1;
      const speed = 1.5 + Math.random() * 2.5;
      const spread = 0.4 + Math.random() * 0.6;

      this.velocities[i3] = (x / len) * speed * spread + (Math.random() - 0.5);
      this.velocities[i3 + 1] =
        (y / len) * speed * spread + (Math.random() - 0.5);
      this.velocities[i3 + 2] =
        (z / len) * speed * spread + (Math.random() - 0.5) * 0.5;
    }
  }

  startMorph(onComplete, duration) {
    this.typewriterMode = false;
    this.mode = MODES.MORPH;
    this.morphStartTime = this.time;
    this.onMorphComplete = onComplete;
    if (duration) this.morphDuration = duration;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.morphFrom[i3] = this.positions[i3];
      this.morphFrom[i3 + 1] = this.positions[i3 + 1];
      this.morphFrom[i3 + 2] = this.positions[i3 + 2];
      this.morphProgress[i] = Math.random() * 0.35;
    }
  }

  hold() {
    this.mode = MODES.HOLD;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.basePositions[i3] = this.targetPositions[i3];
      this.basePositions[i3 + 1] = this.targetPositions[i3 + 1];
      this.basePositions[i3 + 2] = this.targetPositions[i3 + 2];
    }
  }

  resumeFlow() {
    this.flowProfile = "default";
    this.flowIntensity = 0.006;
    this.mode = MODES.FLOW;
  }

  update(dt) {
    this.time += dt;

    switch (this.mode) {
      case MODES.FLOW:
        this._updateFlow();
        break;
      case MODES.EXPLODE:
        this._updateExplode();
        break;
      case MODES.MORPH:
        this._updateMorph();
        break;
      case MODES.HOLD:
        this._updateHold();
        break;
      case MODES.DRIFT:
        this._updateDrift();
        break;
    }

    this._commitPositions();
  }

  _updateFlow() {
    if (this.flowProfile === "text") {
      this._updateTextFlow();
      return;
    }

    const t = this.time;
    const intensity = this.flowIntensity;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const phase = this.phases[i];
      const bx = this.basePositions[i3];
      const by = this.basePositions[i3 + 1];
      const bz = this.basePositions[i3 + 2];

      this.positions[i3] = bx + Math.sin(t * 1.2 + phase) * intensity;
      this.positions[i3 + 1] = by + Math.sin(t * 0.9 + phase * 0.7) * intensity;
      this.positions[i3 + 2] = bz + Math.cos(t * 1.5 + phase) * intensity * 0.3;
    }
  }

  _updateTextFlow() {
    const t = this.time;
    const { intensity, wave, colorPulse } = this.textFlow;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const phase = this.phases[i];
      const bx = this.basePositions[i3];
      const by = this.basePositions[i3 + 1];
      const bz = this.basePositions[i3 + 2];

      const ripple = Math.sin(t * 1.9 + bx * 2.8 + by * 0.6 + phase * 0.2) * wave;
      const driftX = Math.sin(t * 1.35 + phase) * intensity;
      const driftY = Math.cos(t * 1.05 + phase * 0.65) * intensity * 0.85;

      this.positions[i3] = bx + driftX + ripple;
      this.positions[i3 + 1] = by + driftY + ripple * 0.35;
      this.positions[i3 + 2] =
        bz + Math.sin(t * 1.6 + phase * 1.1) * intensity * 0.45;

      const flicker = 0.72 + 0.28 * Math.sin(t * 3.4 + phase * 1.4);
      const sweep = 0.82 + 0.18 * Math.sin(t * 1.7 + bx * 3.6 - t * 0.35);
      const gain = 1 + colorPulse * (flicker * sweep - 1);

      this.colors[i3] = Math.min(1, this.baseColors[i3] * gain);
      this.colors[i3 + 1] = Math.min(1, this.baseColors[i3 + 1] * gain);
      this.colors[i3 + 2] = Math.min(1, this.baseColors[i3 + 2] * gain);
    }

    this._commitColors();
  }

  _updateDrift() {
    const t = this.time;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const phase = this.phases[i];
      this.positions[i3] = this.basePositions[i3] + Math.sin(t * 0.4 + phase) * 0.01;
      this.positions[i3 + 1] =
        this.basePositions[i3 + 1] + Math.cos(t * 0.35 + phase) * 0.01;
      this.positions[i3 + 2] = this.basePositions[i3 + 2];
    }
  }

  _updateExplode() {
    const elapsed = this.time - this.explodeStartTime;
    const drag = 0.96;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.velocities[i3] *= drag;
      this.velocities[i3 + 1] *= drag;
      this.velocities[i3 + 2] *= drag;

      this.positions[i3] += this.velocities[i3] * 0.016;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * 0.016;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * 0.016;
    }

    if (elapsed > this.explodeDuration) {
      if (this.autoMorphAfterExplode) {
        this.startMorph(this.onMorphComplete);
      } else {
        this.mode = MODES.DRIFT;
        const cb = this.onMorphComplete;
        this.onMorphComplete = null;
        cb?.();
      }
    }
  }

  _updateMorph() {
    const elapsed = this.time - this.morphStartTime;
    let allDone = true;
    let colorsDirty = false;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const delay = this.morphProgress[i];
      const localT = (elapsed - delay) / this.morphDuration;

      if (localT < 0) {
        allDone = false;
        if (this.typewriterMode) {
          this.positions[i3] = this.morphFrom[i3];
          this.positions[i3 + 1] = this.morphFrom[i3 + 1];
          this.positions[i3 + 2] = this.morphFrom[i3 + 2];
          this._setColor(i, 0, 0, 0);
          colorsDirty = true;
        }
        continue;
      }

      const t = easeInOutCubic(Math.min(1, localT));
      if (t < 1) allDone = false;

      this.positions[i3] =
        this.morphFrom[i3] + (this.targetPositions[i3] - this.morphFrom[i3]) * t;
      this.positions[i3 + 1] =
        this.morphFrom[i3 + 1] +
        (this.targetPositions[i3 + 1] - this.morphFrom[i3 + 1]) * t;
      this.positions[i3 + 2] =
        this.morphFrom[i3 + 2] +
        (this.targetPositions[i3 + 2] - this.morphFrom[i3 + 2]) * t;

      if (this.typewriterMode) {
        const colorT = easeInOutCubic(Math.min(1, localT * 3.5));
        this.colors[i3] = this.targetColors[i3] * colorT;
        this.colors[i3 + 1] = this.targetColors[i3 + 1] * colorT;
        this.colors[i3 + 2] = this.targetColors[i3 + 2] * colorT;
        colorsDirty = true;
      }
    }

    if (colorsDirty) this._commitColors();

    if (allDone && this.onMorphComplete) {
      const cb = this.onMorphComplete;
      this.onMorphComplete = null;
      this.typewriterMode = false;
      this.hold();
      cb();
    }
  }

  _updateHold() {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const t = this.time;
      const phase = this.phases[i];

      this.positions[i3] =
        this.targetPositions[i3] + Math.sin(t * 0.5 + phase) * 0.0015;
      this.positions[i3 + 1] =
        this.targetPositions[i3 + 1] + Math.cos(t * 0.4 + phase) * 0.0015;
      this.positions[i3 + 2] = this.targetPositions[i3 + 2];
    }
  }

  _applyPointsToBase(points) {
    for (let i = 0; i < this.count; i++) {
      const src = points[i % points.length];
      const i3 = i * 3;
      this.basePositions[i3] = src.x;
      this.basePositions[i3 + 1] = src.y;
      this.basePositions[i3 + 2] = src.z ?? 0;
      this.positions[i3] = src.x;
      this.positions[i3 + 1] = src.y;
      this.positions[i3 + 2] = src.z ?? 0;
      this.targetPositions[i3] = src.x;
      this.targetPositions[i3 + 1] = src.y;
      this.targetPositions[i3 + 2] = src.z ?? 0;
      if (src.color) this._setColorFromSrc(i, src.color);
    }
  }

  _setColorFromSrc(i, color) {
    const boost = this.colorBoost ?? (this.sharp ? 1.15 : 1.5);
    const lift = this.colorLift;
    this._setColor(
      i,
      Math.min(1, color[0] * boost + lift),
      Math.min(1, color[1] * boost + lift),
      Math.min(1, color[2] * boost + lift)
    );
  }

  _setColor(i, r, g, b) {
    const i3 = i * 3;
    this.colors[i3] = r;
    this.colors[i3 + 1] = g;
    this.colors[i3 + 2] = b;
  }

  _commitPositions() {
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  _commitColors() {
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}
