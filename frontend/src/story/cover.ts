export const VIDEO_W = 1280, VIDEO_H = 720;
export function cover(cw: number, ch: number, fx = 0.5, fy = 0.5) { const s = Math.max(cw / VIDEO_W, ch / VIDEO_H); return { s, dx: (cw - VIDEO_W*s) * fx, dy: (ch - VIDEO_H*s) * fy }; }
export const toCanvas = (c: ReturnType<typeof cover>, x: number, y: number): [number, number] => [c.dx + x*c.s, c.dy + y*c.s];
