import * as THREE from "three";
import CosmicScene from "../scenes/CosmicScene.js";
import Timeline from "./Timeline.js";
import ShowDirector from "./ShowDirector.js";
import AudioDirector from "../audio/AudioDirector.js";
import config from "../config.js";

export default class Experience {
  constructor() {
    this.clock = new THREE.Clock();

    this._initRenderer();
    this._initScene();

    this.audio = new AudioDirector();
    void this.audio.start();
    this._setupAudioFallback();

    this.cosmicScene = new CosmicScene();
    this.scene.add(this.cosmicScene.group);

    this.timeline = new Timeline({
      audio: this.audio,
      onPhaseChange: (phase) => {
        this.showDirector?.handlePhase(phase);
      },
    });

    this.showDirector = new ShowDirector({
      scene: this.scene,
      camera: this.camera,
      timeline: this.timeline,
      cosmicScene: this.cosmicScene,
    });

    window.addEventListener("resize", () => this.resize());
    this.animate();
  }

  _setupAudioFallback() {
    const unlock = () => {
      void this.audio.ensurePlaying();
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });

    const dpr = Math.min(window.devicePixelRatio, config.quality.maxPixelRatio);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020208, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020208);

    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 0, config.phase1.camera.startZ);
    this.camera.lookAt(...config.phase1.camera.lookAt);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.timeline.update(delta);

    const elapsed = this.timeline.elapsed;

    this.cosmicScene.update(delta);

    this.showDirector.update(elapsed, delta);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, config.quality.maxPixelRatio);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
  }
}
