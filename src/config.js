const base = import.meta.env.BASE_URL;

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
      /** 最后：生日快乐文字（打字机效果） */
      text: { start: 27.8, morph: 2.8, hold: 5 },
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
    seal: `${base}seal.png`,
    weiwei: `${base}weiwei.png`,
    cat: `${base}cat.png`,
    text: `${base}text.png`,
    group: `${base}group.png`,
    birthday: `${base}birthday.mp3`,
  },

  particleCount: 200000,
  particleSize: 0.0024,
  /** cat/text 汇聚：与 weiwei 同款柔和光晕粒子（旧版见 git tag effects-backup） */
  textParticleSize: 0.0026,
  catParticleSize: 0.0036,
  groupParticleSize: 0.0045,
  /** 合影：更亮、对比更强，暗屏也能看清 */
  groupVisual: {
    particleSize: 0.0045,
    colorBoost: 2.05,
    colorLift: 0.16,
    sampleGain: 1.35,
    sampleLift: 0.12,
    starFade: 0.05,
  },
  /** 文字：透明背景 + 柔和粒子（与 cat 同款） */
  textView: {
    width: 4.2,
    height: 2.9,
    padding: 0.98,
    offsetX: 0,
    offsetY: 0.2,
  },
  /** 文字：透明背景 + 柔和粒子，打字完成后持续动态光效 */
  textVisual: {
    particleSize: 0.0028,
    colorBoost: 1.45,
    colorLift: 0.06,
    additive: true,
    flowIntensity: 0.014,
    wave: 0.0055,
    colorPulse: 0.26,
    fireworksBoost: 1.45,
    fireworks: {
      z: -3.6,
      size: 0.1,
      spread: 1.25,
      edgeBias: true,
      opacity: 1,
    },
  },
  /** 打字机：从左到右逐字显现 */
  textTypewriter: {
    charCount: 4,
  },
  /** 猫+蛋糕：透明背景 + 柔和粒子 */
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
