export function boostPointColors(
  points,
  { gain = 1.25, lift = 0.1 } = {}
) {
  return points.map((p) => {
    if (!p.color) return p;
    const [r, g, b] = p.color;
    return {
      ...p,
      color: [
        Math.min(1, r * gain + lift),
        Math.min(1, g * gain + lift),
        Math.min(1, b * gain + lift),
      ],
    };
  });
}
