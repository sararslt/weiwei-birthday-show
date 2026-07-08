export function getVisibilityProfile() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const shortEdge = Math.min(window.innerWidth, window.innerHeight);
  const isSmallPhone = shortEdge <= 430;
  const isMobile = shortEdge <= 768 || isAndroid;

  if (isSmallPhone || (isAndroid && shortEdge <= 480)) {
    return {
      tier: "smallPhone",
      particleMul: 2.1,
      cameraMul: 0.66,
      colorBoostAdd: 0.5,
      colorLiftAdd: 0.11,
      softColorBoost: 1.9,
      additive: true,
      fov: 50,
      textColorPulseMul: 0.5,
    };
  }

  if (isMobile) {
    return {
      tier: "mobile",
      particleMul: 1.65,
      cameraMul: 0.78,
      colorBoostAdd: 0.32,
      colorLiftAdd: 0.08,
      softColorBoost: 1.72,
      additive: true,
      fov: 46,
      textColorPulseMul: 0.65,
    };
  }

  return {
    tier: "desktop",
    particleMul: 1.2,
    cameraMul: 0.9,
    colorBoostAdd: 0.15,
    colorLiftAdd: 0.04,
    softColorBoost: 1.62,
    additive: false,
    fov: 42,
    textColorPulseMul: 0.85,
  };
}
