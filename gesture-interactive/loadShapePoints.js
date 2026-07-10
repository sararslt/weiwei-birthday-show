import { loadImage, drawImageToCanvas } from "./loadImage.js";
import {
  sampleFillFromCanvas,
  sampleFillSharpFromCanvas,
  sampleFillDirectToView,
  sampleOutlineFromCanvas,
} from "./sampleCanvas.js";

function layoutPoints(points, { scale = 1, offsetX = 0, offsetY = 0 } = {}) {
  return points.map((p) => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
    z: p.z ?? 0,
    color: p.color,
  }));
}

export async function loadShapePoints(
  url,
  count,
  mode = "fill",
  layout = {}
) {
  const { sampleMaxSize, useNative, fitView, ...restLayout } = layout;
  const img = await loadImage(url);
  const { ctx, width, height } = drawImageToCanvas(img, sampleMaxSize ?? 4096, {
    useNative: useNative ?? mode === "fill-sharp",
  });

  let sample;
  if (fitView) {
    sample = sampleFillDirectToView(
      ctx,
      width,
      height,
      count,
      fitView.width,
      fitView.height,
      fitView.padding ?? 0.98,
      fitView.offsetX ?? 0,
      fitView.offsetY ?? 0
    );
  } else if (mode === "fill-sharp") {
    sample = sampleFillSharpFromCanvas(ctx, width, height, count);
  } else if (mode === "outline") {
    sample = sampleOutlineFromCanvas(ctx, width, height, count);
  } else {
    sample = sampleFillFromCanvas(ctx, width, height, count);
  }

  return layoutPoints(sample, restLayout);
}

export function loadShapePointsFromCanvas(
  ctx,
  width,
  height,
  count,
  mode = "fill",
  layout = {}
) {
  const { fitView, ...restLayout } = layout;

  let sample;
  if (fitView) {
    sample = sampleFillDirectToView(
      ctx,
      width,
      height,
      count,
      fitView.width,
      fitView.height,
      fitView.padding ?? 0.98,
      fitView.offsetX ?? 0,
      fitView.offsetY ?? 0
    );
  } else if (mode === "fill-sharp") {
    sample = sampleFillSharpFromCanvas(ctx, width, height, count);
  } else if (mode === "outline") {
    sample = sampleOutlineFromCanvas(ctx, width, height, count);
  } else {
    sample = sampleFillFromCanvas(ctx, width, height, count);
  }

  return layoutPoints(sample, restLayout);
}
