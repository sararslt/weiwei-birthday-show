export function createOverlay() {
  const root = document.getElementById("app") ?? document.body;
  const overlay = document.createElement("div");
  overlay.id = "experience-overlay";
  overlay.innerHTML =
    '<p class="experience-overlay__text">加载中…</p><p class="experience-overlay__hint">首次打开需加载图片和音乐，请稍候</p>';
  root.appendChild(overlay);
  return overlay;
}

export function setOverlayMessage(overlay, message, hint = "") {
  if (!overlay) return;
  const text = overlay.querySelector(".experience-overlay__text");
  const hintEl = overlay.querySelector(".experience-overlay__hint");
  if (text) text.textContent = message;
  if (hintEl) hintEl.textContent = hint;
}

export function hideOverlay(overlay) {
  overlay?.classList.add("experience-overlay--hidden");
}

export function showOverlayError(overlay, message) {
  if (!overlay) return;
  overlay.classList.remove("experience-overlay--hidden");
  overlay.classList.add("experience-overlay--error");
  setOverlayMessage(overlay, message, "建议用 Chrome 浏览器打开，或点击屏幕重试");
}
