const SCALE = 2.8;

function toWorld(x, y, width, height) {
  return {
    x: (x / width - 0.5) * SCALE,
    y: -(y / height - 0.5) * SCALE,
  };
}

function readPixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function isVisible(pixel, threshold = 48) {
  return pixel.a >= threshold && (pixel.r + pixel.g + pixel.b) / 3 > 16;
}

function pickEven(count, candidates) {
  const points = [];
  const len = candidates.length;

  if (len === 0) {
    for (let i = 0; i < count; i++) {
      points.push({ x: 0, y: 0, z: 0, color: [0.85, 0.9, 1.0] });
    }
    return points;
  }

  const step = len / count;
  for (let i = 0; i < count; i++) {
    const c = candidates[Math.min(len - 1, Math.floor(i * step))];
    points.push({
      x: c.x,
      y: c.y,
      z: 0,
      color: c.color,
    });
  }

  return points;
}

function pickUniform(count, candidates, jitter = 0.0012) {
  const points = [];
  const len = candidates.length;

  if (len === 0) {
    for (let i = 0; i < count; i++) {
      points.push({ x: 0, y: 0, z: 0, color: [0.85, 0.9, 1.0] });
    }
    return points;
  }

  for (let i = 0; i < count; i++) {
    const c = candidates[Math.floor(Math.random() * len)];
    points.push({
      x: c.x + (Math.random() - 0.5) * jitter,
      y: c.y + (Math.random() - 0.5) * jitter,
      z: (Math.random() - 0.5) * 0.02,
      color: c.color,
    });
  }

  return points;
}

export function sampleFillFromCanvas(ctx, width, height, count) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const candidates = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = readPixel(data, width, x, y);
      if (!isVisible(pixel)) continue;
      const brightness = (pixel.r + pixel.g + pixel.b) / 3 / 255;
      if (brightness < 0.06) continue;
      const world = toWorld(x, y, width, height);
      candidates.push({
        x: world.x,
        y: world.y,
        color: [pixel.r / 255, pixel.g / 255, pixel.b / 255],
      });
    }
  }

  return pickUniform(count, candidates);
}

/** 高清采样：均匀取点、无抖动，尽量还原图片像素 */
export function sampleFillSharpFromCanvas(ctx, width, height, count) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const candidates = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = readPixel(data, width, x, y);
      if (!isVisible(pixel, 40)) continue;
      const brightness = (pixel.r + pixel.g + pixel.b) / 3 / 255;
      if (brightness < 0.05) continue;
      const world = toWorld(x, y, width, height);
      candidates.push({
        x: world.x,
        y: world.y,
        color: [pixel.r / 255, pixel.g / 255, pixel.b / 255],
      });
    }
  }

  return pickEven(count, candidates);
}

/** 文字专用：像素直接映射到屏幕视口，避免二次缩放变糊 */
export function sampleFillDirectToView(
  ctx,
  width,
  height,
  count,
  viewWidth,
  viewHeight,
  padding = 0.98,
  offsetX = 0,
  offsetY = 0
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const candidates = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = readPixel(data, width, x, y);
      if (!isVisible(pixel, 36)) continue;
      const brightness = (pixel.r + pixel.g + pixel.b) / 3 / 255;
      if (brightness < 0.04) continue;
      candidates.push({
        x: (x / width - 0.5) * viewWidth * padding + offsetX,
        y: -(y / height - 0.5) * viewHeight * padding + offsetY,
        color: [pixel.r / 255, pixel.g / 255, pixel.b / 255],
      });
    }
  }

  if (candidates.length <= count) {
    return candidates.map((c) => ({ ...c, z: 0 }));
  }

  return pickEven(count, candidates);
}

export function sampleOutlineFromCanvas(ctx, width, height, count) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const candidates = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = readPixel(data, width, x, y);
      if (!isVisible(pixel)) continue;
      const neighbors = [
        readPixel(data, width, x - 1, y),
        readPixel(data, width, x + 1, y),
        readPixel(data, width, x, y - 1),
        readPixel(data, width, x, y + 1),
      ];
      if (!neighbors.some((n) => !isVisible(n))) continue;
      const world = toWorld(x, y, width, height);
      candidates.push({
        x: world.x,
        y: world.y,
        color: [pixel.r / 255, pixel.g / 255, pixel.b / 255],
      });
    }
  }

  if (candidates.length < count * 0.05) {
    return sampleFillFromCanvas(ctx, width, height, count);
  }

  return pickUniform(count, candidates, 0.001);
}

export function fitPointsToView(points, viewWidth, viewHeight, padding = 0.96) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = Math.min((viewWidth * padding) / w, (viewHeight * padding) / h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return points.map((p) => ({
    x: (p.x - cx) * scale,
    y: (p.y - cy) * scale,
    z: p.z ?? 0,
    color: p.color,
  }));
}

export function layoutFinaleRow(seal, weiwei, cat, options = {}) {
  const {
    rowWidth = 3.6,
    rowHeight = 2.05,
    gap = 0.05,
    padding = 0.94,
  } = options;

  const shapes = [seal, weiwei, cat];
  const slotCount = shapes.length;
  const slotWidth = (rowWidth - gap * (slotCount - 1)) / slotCount;

  const fitted = shapes.map((pts) =>
    fitPointsToView(pts, slotWidth, rowHeight, padding)
  );

  let cursor = -rowWidth / 2 + slotWidth / 2;
  return fitted.map((points) => {
    const placed = points.map((p) => ({
      x: p.x + cursor,
      y: p.y,
      z: p.z ?? 0,
      color: p.color,
    }));
    cursor += slotWidth + gap;
    return placed;
  });
}
