export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2);
export const easeInOutQuart = (x: number) => (x < 0.5 ? 8*x**4 : 1 - Math.pow(-2*x + 2, 4) / 2);
