import "./style.css";
import Experience from "./core/Experience.js";
import { canUseWebGL } from "./utils/qualityProfile.js";
import {
  createOverlay,
  setOverlayMessage,
  showOverlayError,
} from "./utils/overlay.js";

const overlay = createOverlay();

if (!canUseWebGL()) {
  showOverlayError(
    overlay,
    "当前浏览器不支持 WebGL",
    "Android 请用 Chrome 打开；微信内请选择「在浏览器中打开」"
  );
} else {
  try {
    new Experience({ overlay });
  } catch (error) {
    console.error("[main] failed to start experience", error);
    showOverlayError(
      overlay,
      "页面加载失败",
      "请检查网络后刷新；微信内请用浏览器打开"
    );
  }
}
