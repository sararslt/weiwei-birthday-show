export function getQualityProfile() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const shortEdge = Math.min(window.innerWidth, window.innerHeight);

  if (isAndroid) {
    return {
      tier: "android",
      particleCount: 55000,
      starCount: 4500,
      fireworkCount: 2200,
      maxPixelRatio: 1.25,
      antialias: false,
      sampleMaxSize: 2048,
    };
  }

  if (shortEdge <= 768) {
    return {
      tier: "mobile",
      particleCount: 85000,
      starCount: 7000,
      fireworkCount: 3500,
      maxPixelRatio: 1.5,
      antialias: false,
      sampleMaxSize: 3072,
    };
  }

  return {
    tier: "desktop",
    particleCount: 200000,
    starCount: 15000,
    fireworkCount: 6000,
    maxPixelRatio: 2,
    antialias: true,
    sampleMaxSize: 4096,
  };
}

export function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}
