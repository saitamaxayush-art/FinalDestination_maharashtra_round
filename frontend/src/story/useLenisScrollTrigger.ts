import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let activeLenis: Lenis | null = null;
export const getLenis = () => activeLenis;

export function useLenisScrollTrigger(enabled = true) {
  const ref = useRef<Lenis | null>(null);
  useEffect(() => {
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
    let raf = 0;
    const loop = (time: number) => { if (!document.hidden) lenis.raf(time); raf = requestAnimationFrame(loop); };
    activeLenis = lenis; ref.current = lenis; raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); ref.current = null; if (activeLenis === lenis) activeLenis = null; };
  }, [enabled]);
  return ref;
}
