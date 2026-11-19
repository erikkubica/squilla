// Canvas drawing for heatmaps: a blurred density of points coloured from
// blue (few) to red (many), and row bands for scroll reach and attention.

/** blue → cyan → green → yellow → red, alpha rising with intensity. */
export function heatColor(v: number): [number, number, number, number] {
  const x = Math.max(0, Math.min(1, v));
  const stops: [number, number, number, number][] = [
    [0, 40, 90, 255],
    [0.25, 0, 200, 255],
    [0.5, 40, 220, 80],
    [0.75, 255, 220, 0],
    [1, 255, 40, 20],
  ].map(([p, r, g, b]) => [p, r, g, b]) as [number, number, number, number][];
  let i = 1;
  while (i < stops.length - 1 && x > stops[i][0]) i++;
  const [p0, r0, g0, b0] = stops[i - 1];
  const [p1, r1, g1, b1] = stops[i];
  const k = (x - p0) / (p1 - p0 || 1);
  return [r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k, Math.round(70 + 150 * Math.sqrt(x))];
}

/** Draws points (canvas pixels) as a density map. */
export function drawDensity(ctx: CanvasRenderingContext2D, pts: [number, number][], radius: number) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (!pts.length || !width || !height) return;
  // 1) accumulate soft alpha blobs, 2) map the alpha to colours.
  const blob = document.createElement("canvas");
  blob.width = blob.height = radius * 2;
  const b = blob.getContext("2d")!;
  const g = b.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  b.fillStyle = g;
  b.fillRect(0, 0, radius * 2, radius * 2);
  for (const [x, y] of pts) ctx.drawImage(blob, x - radius, y - radius);
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  let max = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > max) max = d[i];
  if (!max) return;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (!a) continue;
    const [r, gg, bb, aa] = heatColor(a / max);
    d[i] = r;
    d[i + 1] = gg;
    d[i + 2] = bb;
    d[i + 3] = aa;
  }
  ctx.putImageData(img, 0, 0);
}

/** One band per row (rows from the top of the canvas): heat colour by value / max; rows with nothing are greyed out. */
export function drawBands(ctx: CanvasRenderingContext2D, values: number[], bin: number, rows: number, max: number) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, -bin, width, height + bin * 2);
  for (let i = 0; i < rows; i++) {
    const v = values[i] ?? 0;
    if (v <= 0 || !max) {
      ctx.fillStyle = "rgba(15,23,42,0.45)";
    } else {
      const [r, g, b] = heatColor(v / max);
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},0.42)`;
    }
    ctx.fillRect(0, i * bin, width, bin + 1);
  }
}
