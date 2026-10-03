import { Pt } from './homography';

// Screen quad in VIDEO coordinates (1280x720), clockwise from top-left at handoff plate (frame 193)
export const DEFAULT_SCREEN_QUAD: Pt[] = [
  [92, 66],   // Top-Left (TL)
  [848, 14],  // Top-Right (TR)
  [930, 546], // Bottom-Right (BR)
  [172, 636], // Bottom-Left (BL)
];

export const BLEED_PX = 2;

// Calculate geometric center of quad
export function getQuadCenter(q: Pt[]): Pt {
  const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
  const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  return [cx, cy];
}

// Inflate quad outward by bleed px from its center
export function inflateQuad(q: Pt[], bleed = BLEED_PX): Pt[] {
  const [cx, cy] = getQuadCenter(q);
  return q.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * bleed, y + (dy / len) * bleed];
  });
}

// Map video point [x, y] to screen space under cover sizing
export function videoToScreenCover(
  x: number,
  y: number,
  viewportW: number,
  viewportH: number,
  crop = 1.0,
  videoW = 1280,
  videoH = 720
): Pt {
  const s = Math.max(viewportW / videoW, viewportH / videoH) * crop;
  const ox = (viewportW - videoW * s) / 2;
  const oy = (viewportH - videoH * s) / 2;
  return [ox + x * s, oy + y * s];
}

// Map full quad from video coordinates to screen space under cover fit
export function mapQuadToScreen(
  q: Pt[],
  viewportW: number,
  viewportH: number,
  crop = 1.0,
  bleed = BLEED_PX
): Pt[] {
  const inflated = inflateQuad(q, bleed);
  return inflated.map(([x, y]) =>
    videoToScreenCover(x, y, viewportW, viewportH, crop)
  );
}

// Scale quad about a center point by zoom factor
export function scaleQuadAround(q: Pt[], center: Pt, scale: number): Pt[] {
  const [cx, cy] = center;
  return q.map(([x, y]) => [
    cx + (x - cx) * scale,
    cy + (y - cy) * scale,
  ]);
}

// Linear interpolation between two points
export function lerpPoint(p1: Pt, p2: Pt, t: number): Pt {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];
}

// Interpolate four corners of quad Q1 to quad Q2
export function lerpQuad(q1: Pt[], q2: Pt[], t: number): Pt[] {
  return [
    lerpPoint(q1[0], q2[0], t),
    lerpPoint(q1[1], q2[1], t),
    lerpPoint(q1[2], q2[2], t),
    lerpPoint(q1[3], q2[3], t),
  ];
}
