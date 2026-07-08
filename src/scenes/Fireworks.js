import * as THREE from "three";

const COLORS = [
  [1.0, 0.35, 0.45],
  [1.0, 0.75, 0.2],
  [0.45, 0.85, 1.0],
  [0.55, 1.0, 0.55],
  [0.95, 0.5, 1.0],
  [1.0, 1.0, 0.85],
];

export default class Fireworks {
  constructor(count = 5000) {
    this.count = count;
    this.active = false;
    this.time = 0;
    this.nextBurst = 0;
    this.burstBoost = 1;
    this.spread = 1;
    this.edgeBias = false;
    this.baseSize = 0.075;

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.maxLife = new Float32Array(count);

    this.group = new THREE.Group();
    this.group.position.z = -3.8;
    this._buildPoints();
    this.group.add(this.points);
    this.group.visible = false;
  }

  _buildPoints() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);

    this.material = new THREE.PointsMaterial({
      size: this.baseSize,
      map: new THREE.CanvasTexture(canvas),
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      fog: false,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.renderOrder = 0;
    this.points.frustumCulled = false;
  }

  start() {
    this.active = true;
    this.group.visible = true;
    this.time = 0;
    this.nextBurst = 0;
    this._spawnBurst(12);
  }

  ensureRunning() {
    if (!this.active) {
      this.start();
      return;
    }
    this.group.visible = true;
  }

  setBurstBoost(boost = 1) {
    this.burstBoost = Math.max(0.5, boost);
  }

  setPresentation({ z, size, spread, edgeBias, opacity } = {}) {
    if (z != null) this.group.position.z = z;
    if (size != null) {
      this.baseSize = size;
      this.material.size = size;
    }
    if (spread != null) this.spread = spread;
    if (edgeBias != null) this.edgeBias = edgeBias;
    if (opacity != null) this.material.opacity = opacity;
  }

  _spawnBurst(n) {
    for (let b = 0; b < n; b++) {
      const i = Math.floor(Math.random() * this.count);
      const i3 = i * 3;
      let cx = (Math.random() - 0.5) * 14 * this.spread;
      let cy = (Math.random() - 0.5) * 8 * this.spread + 1;

      if (this.edgeBias && Math.random() > 0.3) {
        cx = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 4.5);
        cy = (Math.random() - 0.5) * 9 * this.spread;
      }

      const c = COLORS[Math.floor(Math.random() * COLORS.length)];

      this.positions[i3] = cx;
      this.positions[i3 + 1] = cy;
      this.positions[i3 + 2] = (Math.random() - 0.5) * 3;

      const speed = 0.8 + Math.random() * 1.6;
      const angle = Math.random() * Math.PI * 2;
      this.velocities[i3] = Math.cos(angle) * speed;
      this.velocities[i3 + 1] = Math.sin(angle) * speed;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.6;

      this.life[i] = 0;
      this.maxLife[i] = 0.8 + Math.random() * 1.4;

      this.colors[i3] = c[0];
      this.colors[i3 + 1] = c[1];
      this.colors[i3 + 2] = c[2];
    }
  }

  update(dt) {
    if (!this.active) return;

    this.time += dt;
    if (this.time >= this.nextBurst) {
      const n = Math.floor((8 + Math.random() * 6) * this.burstBoost);
      this._spawnBurst(n);
      this.nextBurst =
        this.time + (0.35 + Math.random() * 0.45) / this.burstBoost;
    }

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.life[i] += dt;

      if (this.life[i] > this.maxLife[i]) {
        this.positions[i3 + 1] = -99;
        continue;
      }

      this.velocities[i3 + 1] -= 0.018 * dt * 60;
      this.velocities[i3] *= 0.985;
      this.velocities[i3 + 1] *= 0.985;
      this.velocities[i3 + 2] *= 0.985;

      this.positions[i3] += this.velocities[i3] * dt;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;

      const fade = 1 - this.life[i] / this.maxLife[i];
      this.colors[i3] *= 0.996;
      this.colors[i3 + 1] *= 0.996;
      this.colors[i3 + 2] *= 0.996;
      if (fade < 0.3) {
        this.colors[i3] *= fade;
        this.colors[i3 + 1] *= fade;
        this.colors[i3 + 2] *= fade;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}
