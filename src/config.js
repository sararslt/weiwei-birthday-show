export default {
  name: "炜炜",

  timeline: {
    morphDuration: 1.8,
    scatterDuration: 1.5,
    holdDuration: 3,
    phases: {
      /** 开场：星空 + 粒子音效，再进入海豹 */
      intro: { start: 0, duration: 1.2 },
      seal: { start: 1.2, morph: 1.8, hold: 3 },
      sealScatter: { start: 6.0, duration: 1.5 },
      /** 散开 → 汇聚炜炜，停留 3s */
      weiwei: { start: 7.5, morph: 1.8, hold: 3 },
      weiweiScatter: { start: 12.3, duration: 1.5 },
      /** 散开 → 汇聚猫+蛋糕，停留 5s */
      cat: { start: 13.8, morph: 1.8, hold: 5 },
      /** 合影：group.png */
      finale: { start: 20.6, morph: 2.2, hold: 5 },
      /** 最后：生日快乐文字 */
      text: { start: 27.8, morph: 1.8, hold: 5 },
    },
    audio: {
      /** 开场粒子音效后再播生日歌 */
      startAt: 1.0,
      loop: false,
      sfxVolume: 0.3,
    },
  },

  phase1: {
    camera: {
      startZ: 8.5,
      endZ: 3.5,
      lookAt: [0, 0, 0],
    },
    stars: {
      count: 15000,
      radius: 55,
    },
  },

  quality: {
    maxPixelRatio: 2,
    sampleMaxSize: 4096,
  },

  assets: {
    seal: "/seal.png",
    weiwei: "/weiwei.png",
    cat: "/cat.png",
    text: "/text.png",
    group: "/group.png",
    birthday: "/birthday.mp3",
  },

  particleCount: 200000,
  particleSize: 0.0024,
  textParticleSize: 0.0026,
  catParticleSize: 0.0036,
  groupParticleSize: 0.0036,
  /** 文字：粒子汇聚 → 原图停留 */
  textView: {
    width: 4.2,
    height: 2.9,
    padding: 0.98,
    offsetX: 0,
    offsetY: 0.2,
  },
  /** 猫+蛋糕：粒子汇聚 → 原图停留 */
  catView: {
    width: 3.0,
    height: 2.8,
    padding: 0.98,
    offsetX: 0,
    offsetY: 0,
  },
  /** 大结局合影铺满屏幕 */
  groupView: { width: 6.2, height: 3.5, padding: 0.96 },
  finaleLayout: {
    cameraZ: 3.65,
  },
};

export function getMusicStartTime(config) {
  return config.timeline.audio.startAt;
}

export function getMusicEndTime(config) {
  const text = config.timeline.phases.text;
  return text.start + text.morph + text.hold;
}

export function getCelebrateTime(config) {
  return config.timeline.phases.finale.start;
}

export function getPhaseAtTime(config, elapsed) {
  const phases = config.timeline.phases;
  let current = "intro";

  for (const [id, phase] of Object.entries(phases)) {
    if (elapsed >= phase.start) {
      current = id;
    }
  }

  return current;
}

export function offsetPoints(points, offsetX, offsetY, scale = 1) {
  return points.map((p) => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
    z: p.z ?? 0,
    color: p.color,
  }));
}
