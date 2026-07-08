import * as THREE from "three";
import config from "../config.js";

function createStarField(count, radius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.35 + Math.random() * 0.65);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const tint = 0.65 + Math.random() * 0.35;
    color.setRGB(0.75 * tint, 0.82 * tint, 1 * tint);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export default class CosmicScene {
  constructor({ starCount } = {}) {
    this.group = new THREE.Group();
    this.elapsed = 0;

    const { stars } = config.phase1;
    this.stars = createStarField(starCount ?? stars.count, stars.radius);
    this.group.add(this.stars);
  }

  update(delta) {
    this.elapsed += delta;
    this.stars.rotation.y += delta * 0.003;
  }

  setFade(fade) {
    const opacity = Math.max(0, Math.min(1, fade));
    this.stars.material.opacity = 0.9 * opacity;
    this.group.visible = opacity > 0.01;
  }
}
