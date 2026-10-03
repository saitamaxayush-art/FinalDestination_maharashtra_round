import { clamp, easeInOutCubic } from '../lib/math';

export const N = 8, STEP = 360 / N;
export const ringRadius = (cardW: number) => cardW / (2 * Math.tan(Math.PI / N)) + 40;
export const stepFn = (x: number) => { const i = Math.floor(x), f = x - i; return i + easeInOutCubic(clamp((f - 0.2) / 0.6)); };
export const angleAt = (t: number) => STEP * stepFn((N - 1) * clamp(t));
export const angDist = (card: number, angle: number) => Math.abs((((card * STEP - angle) % 360) + 540) % 360 - 180);
const K: [number, number, number][] = [[0, 1, 0], [45, 0.5, 1], [90, 0.16, 3], [135, 0, 3]];
export function look(d: number) { for (let i = 1; i < K.length; i++) if (d <= K[i][0]) { const t = (d - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return { opacity: K[i - 1][1] + (K[i][1] - K[i - 1][1]) * t, blur: K[i - 1][2] + (K[i][2] - K[i - 1][2]) * t }; } return { opacity: 0, blur: 3 }; }
export const pForCard = (i: number, a = 0.66, b = 0.88) => a + (b - a) * (i / (N - 1));
