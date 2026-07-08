import * as THREE from "three";

export default class SharpImageLayer {
  constructor(source, width, height, offsetX = 0, offsetY = 0) {
    this.group = new THREE.Group();
    this.group.position.set(offsetX, offsetY, 0);

    const texture =
      typeof source === "string"
        ? new THREE.TextureLoader().load(source)
        : new THREE.CanvasTexture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      alphaTest: 0.04,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
    this.mesh.renderOrder = 1;
    this.group.add(this.mesh);
    this.group.visible = false;
  }

  show(opacity = 1) {
    this.group.visible = true;
    this.material.opacity = opacity;
  }

  hide() {
    this.group.visible = false;
    this.material.opacity = 0;
  }

  fadeTo(opacity, duration, onDone) {
    this.group.visible = true;
    const start = this.material.opacity;
    const startTime = performance.now();

    const tick = () => {
      const t = Math.min((performance.now() - startTime) / (duration * 1000), 1);
      this.material.opacity = start + (opacity - start) * t;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    tick();
  }
}
