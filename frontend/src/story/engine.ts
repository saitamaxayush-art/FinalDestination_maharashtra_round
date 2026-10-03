import { clamp } from '../lib/math';

export interface Ctx { w: number; h: number; dpr: number; vel: number; reduced: boolean }
export interface Scene { update(p: number, ctx: Ctx): void }

export function createEngine(section: HTMLElement, scenes: Scene[], o = { follow: 8, maxStep: 0.004 }) {
  const ctx: Ctx = { w: 0, h: 0, dpr: 1, vel: 0, reduced: false };
  let top = 0, total = 1, target = 0, p = 0, last = performance.now(), raf = 0, lastDrawn = -1;
  let visible = true;
  const measure = () => {
    top = section.getBoundingClientRect().top + window.scrollY;
    total = Math.max(1, section.offsetHeight - window.innerHeight);
    ctx.w = window.innerWidth;
    ctx.h = window.innerHeight;
    ctx.dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  const ro = new ResizeObserver(measure);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting || Math.abs(entry.boundingClientRect.top) < window.innerHeight * 2; }, { rootMargin: '200% 0px' });
  ro.observe(section);
  io.observe(section);
  addEventListener('resize', measure);
  measure();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden && visible) {
      target = clamp((scrollY - top) / total);
      let d = ctx.reduced ? target - p : (target - p) * (1 - Math.exp(-dt * o.follow));
      d = Math.max(-o.maxStep, Math.min(o.maxStep, d));
      p = Math.abs(target - p) < 1e-5 ? target : p + d;
      ctx.vel = d / Math.max(dt, 1e-3);
      if (Math.abs(p - lastDrawn) > 2e-5) {
        scenes.forEach((scene) => scene.update(p, ctx));
        lastDrawn = p;
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const jump = (v: number) => { scrollTo(0, top + clamp(v) * total); p = target = clamp(v); lastDrawn = -1; };
  const scrollToP = (v: number, lenis?: { scrollTo: (target: number, options: { duration: number }) => void }) => lenis ? lenis.scrollTo(top + clamp(v) * total, { duration: 1.4 }) : scrollTo({ top: top + clamp(v) * total, behavior: 'smooth' });
  return { jump, scrollToP, getP: () => p, destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('resize', measure); } };
}
