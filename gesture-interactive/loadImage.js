export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function drawImageToCanvas(img, maxSize = 4096, { useNative = false } = {}) {
  const canvas = document.createElement("canvas");
  let scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

  if (useNative && img.width <= maxSize && img.height <= maxSize) {
    scale = 1;
  }

  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, ctx, width, height };
}
