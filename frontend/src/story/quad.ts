export type Pt = [number, number];
export const QUAD: Pt[] = [[90, 64], [850, 12], [932, 548], [170, 638]];
export const DEFAULT_SCREEN_QUAD = QUAD;
export const centroid = (points: Pt[]): Pt => [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length];
export const bbox = (points: Pt[]) => {
  const xs = points.map((point) => point[0]); const ys = points.map((point) => point[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
export const interpolateQuad = (from: Pt[], to: Pt[], t: number): Pt[] => from.map((point, index) => [point[0] + (to[index][0] - point[0]) * t, point[1] + (to[index][1] - point[1]) * t]);
