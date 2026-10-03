import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY_CONFIG } from './story.config';

// Register ScrollTrigger plugin with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useLenisScrollTrigger(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check if embed mode or reduced motion
    const searchParams = new URLSearchParams(window.location.search);
    const isEmbed = searchParams.get('embed') === '1';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!enabled || isEmbed || prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: STORY_CONFIG.lenis.lerp,
      smoothWheel: STORY_CONFIG.lenis.smoothWheel,
      syncTouch: STORY_CONFIG.lenis.syncTouch,
    });
    lenisRef.current = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return lenisRef;
}
