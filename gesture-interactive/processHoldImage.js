import { loadImage } from "./loadImage.js";

const WATERMARK = {
  xStart: 0.68,
  yStart: 0.88,
};

function removeBottomRightWatermark(ctx, width, height) {
  const x0 = Math.floor(width * WATERMARK.xStart);
  const y0 = Math.floor(height * WATERMARK.yStart);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let y = y0; y < height; y++) {
    for (let x = x0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function makeDarkBackgroundTransparent(
  ctx,
  width,
  height,
  { threshold = 25, softness = 45 } = {}
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const bright = Math.max(r, g, b);

    let alpha = 255;
    if (bright <= threshold) {
      alpha = 0;
    } else if (bright < threshold + softness) {
      alpha = Math.round(((bright - threshold) / softness) * 255);
    }

    data[i + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);
}

function cropToVisibleBounds(canvas, paddingPx = 12) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 32) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return { canvas, ctx, width, height };
  }

  minX = Math.max(0, minX - paddingPx);
  minY = Math.max(0, minY - paddingPx);
  maxX = Math.min(width - 1, maxX + paddingPx);
  maxY = Math.min(height - 1, maxY + paddingPx);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;

  const cropCtx = cropped.getContext("2d", { willReadFrequently: true });
  cropCtx.imageSmoothingEnabled = false;
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return { canvas: cropped, ctx: cropCtx, width: cropW, height: cropH };
}

export async function loadProcessedHoldImage(
  url,
  {
    removeWatermark = false,
    transparentBackground = true,
    cropToContent = false,
    bgThreshold = 25,
    bgSoftness = 45,
  } = {}
) {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  if (transparentBackground) {
    makeDarkBackgroundTransparent(ctx, canvas.width, canvas.height, {
      threshold: bgThreshold,
      softness: bgSoftness,
    });
  }

  if (removeWatermark) {
    removeBottomRightWatermark(ctx, canvas.width, canvas.height);
  }

  if (cropToContent) {
    return cropToVisibleBounds(canvas);
  }

  return { canvas, ctx, width: canvas.width, height: canvas.height };
}

export function loadProcessedTextImage(url) {
  return loadProcessedHoldImage(url, {
    removeWatermark: true,
    transparentBackground: true,
    cropToContent: true,
    bgThreshold: 72,
    bgSoftness: 55,
  });
}

export function loadProcessedCatImage(url) {
  return loadProcessedHoldImage(url, {
    removeWatermark: false,
    transparentBackground: true,
    bgThreshold: 26,
    bgSoftness: 50,
  });
}
