import * as THREE from "three";
import CosmicScene from "../scenes/CosmicScene.js";
import Timeline from "./Timeline.js";
import ShowDirector from "./ShowDirector.js";
import AudioDirector from "../audio/AudioDirector.js";
import config from "../config.js";
import { getQualityProfile } from "../utils/qualityProfile.js";
import { hideOverlay, setOverlayMessage, showOverlayError } from "../utils/overlay.js";

export default class Experience {
  constructor({ overlay } = {}) {
    this.overlay = overlay;
    this.quality = getQualityProfile();
    this.clock = new THREE.Clock();

    if (!this._initRenderer()) return;

    this._initScene();

    this.audio = new AudioDirector();
    void this.audio.start();
    this._setupAudioFallback();

    this.cosmicScene = new CosmicScene({
      starCount: this.quality.starCount,
    });
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
      quality: this.quality,
      onReady: () => {
        hideOverlay(this.overlay);
      },
      onError: () => {
        showOverlayError(
          this.overlay,
          "资源加载失败",
          "请检查网络后刷新；图片较大，WiFi 下更稳定"
        );
      },
    });
    this.showDirector.updateVisibilityProfile();

    window.addEventListener("resize", () => this.resize());
    this.animate();
  }

  _setupAudioFallback() {
    const unlock = () => {
      hideOverlay(this.overlay);
      void this.audio.ensurePlaying();
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  _initRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: this.quality.antialias,
        alpha: false,
        powerPreference: "default",
        stencil: false,
      });
    } catch (error) {
      console.error("[Experience] WebGLRenderer init failed", error);
      showOverlayError(
        this.overlay,
        "无法启动 3D 渲染",
        "Android 请用 Chrome；微信内请「在浏览器中打开」"
      );
      return false;
    }

    const gl = this.renderer.getContext();
    if (!gl) {
      showOverlayError(
        this.overlay,
        "WebGL 不可用",
        "请更新浏览器，或换 Chrome 打开"
      );
      return false;
    }

    const dpr = Math.min(
      window.devicePixelRatio,
      this.quality.maxPixelRatio
    );
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020208, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const app = document.getElementById("app") ?? document.body;
    app.appendChild(this.renderer.domElement);

    setOverlayMessage(
      this.overlay,
      "加载中…",
      this.quality.tier === "android"
        ? "正在优化 Android 显示，请稍候"
        : "首次打开需加载图片和音乐"
    );

    return true;
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

    if (!this.renderer || !this.showDirector) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.timeline.update(delta);

    const elapsed = this.timeline.elapsed;

    this.cosmicScene.update(delta);
    this.showDirector.update(elapsed, delta);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.renderer || !this.camera) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(
      window.devicePixelRatio,
      this.quality.maxPixelRatio
    );

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);

    this.showDirector?.updateVisibilityProfile();
  }
}
