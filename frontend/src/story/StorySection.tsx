import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  STORY_CONFIG,
  easeInOutCubic,
  lerp,
  clamp,
  VideoCaption,
  CaptionPosition,
} from './story.config';
import { Pt, quadToMatrix3d } from './homography';
import {
  mapQuadToScreen,
  scaleQuadAround,
  getQuadCenter,
  lerpQuad,
  DEFAULT_SCREEN_QUAD,
} from './quad';
import { FrameLoader } from './frameLoader';
import { StoryCalibration } from './StoryCalibration';

export const StorySection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const posterImgRef = useRef<HTMLImageElement | null>(null);

  // Calibration dev state
  const isDev = import.meta.env.DEV;
  const isCalibrate =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('calibrate') === '1';
  const [calibratedQuad, setCalibratedQuad] = useState<Pt[]>(DEFAULT_SCREEN_QUAD);

  // Loading progress
  const [loadPercent, setLoadPercent] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Current display progress and chapter
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);
  const [captionData, setCaptionData] = useState<{
    title: string;
    description: string;
    subline?: string;
    opacity: number;
    translateY: number;
    position: CaptionPosition;
    route?: string;
  }>({
    title: STORY_CONFIG.partACaptions[0].title,
    description: STORY_CONFIG.partACaptions[0].description,
    opacity: 1,
    translateY: 0,
    position: STORY_CONFIG.partACaptions[0].position,
  });

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  // References for animation loop
  const frameLoaderRef = useRef<FrameLoader | null>(null);
  const targetPRef = useRef<number>(0);
  const displayPRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastPRef = useRef<number>(0);
  const lastDrawnPRef = useRef<number>(-999);
  const rafIdRef = useRef<number | null>(null);
  const lastChapterRef = useRef<number>(-1);

  // Layout dimensions cached on resize to eliminate layout thrashing
  const layoutRef = useRef<{
    width: number;
    height: number;
    dpr: number;
    iframeW: number;
    iframeH: number;
    Z1: number;
  }>({
    width: 1280,
    height: 720,
    dpr: 1,
    iframeW: 1280,
    iframeH: 720,
    Z1: 1.8,
  });

  // Preload poster image for instant zero-latency visual
  useEffect(() => {
    const poster = new Image();
    poster.src = '/story/poster.webp';
    posterImgRef.current = poster;
  }, []);

  // Set high-resolution Canvas Dimensions immediately
  const applyCanvasDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const iframeW = clamp(w, STORY_CONFIG.iframe.minWidth, STORY_CONFIG.iframe.maxWidth);
    const iframeH = Math.round((iframeW * h) / w);

    // Calculate unzoomed screen quad width to compute Z1 (screen fills ~90% viewport width)
    const baseScreenQuad = mapQuadToScreen(
      calibratedQuad,
      w,
      h,
      STORY_CONFIG.crop,
      STORY_CONFIG.bleedPx
    );
    const quadW = Math.hypot(
      baseScreenQuad[1][0] - baseScreenQuad[0][0],
      baseScreenQuad[1][1] - baseScreenQuad[0][1]
    );
    const Z1 = quadW > 0 ? (STORY_CONFIG.targetScreenQuadViewportWidthRatio * w) / quadW : 1.8;

    layoutRef.current = {
      width: w,
      height: h,
      dpr,
      iframeW,
      iframeH,
      Z1: clamp(Z1, 1.2, 3.2),
    };

    if (canvasRef.current) {
      canvasRef.current.width = Math.round(w * dpr);
      canvasRef.current.height = Math.round(h * dpr);
    }
  }, [calibratedQuad]);

  // Reduced motion detection
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Initialize FrameLoader
  useEffect(() => {
    const loader = new FrameLoader({
      totalFrames: STORY_CONFIG.timeline.frameEnd,
      isMobile,
      onProgress: (loaded, total) => {
        const pct = Math.round((loaded / total) * 100);
        setLoadPercent(pct);
        if (loaded >= total) {
          setIsLoaded(true);
        }
      },
    });
    frameLoaderRef.current = loader;

    return () => {
      loader.destroy();
      frameLoaderRef.current = null;
    };
  }, [isMobile]);

  // Immediate mount initialization & Resize listener
  useEffect(() => {
    applyCanvasDimensions();
    const handleResize = () => {
      applyCanvasDimensions();
      setIsMobile(window.innerWidth < 768);
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [applyCanvasDimensions]);

  // Scroll past story helper
  const handleSkipStory = () => {
    if (!containerRef.current) return;
    const targetScroll = containerRef.current.offsetTop + containerRef.current.offsetHeight;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Scroll to chapter helper
  const scrollToP = (targetP: number) => {
    if (!containerRef.current) return;
    const startY = containerRef.current.offsetTop;
    const totalDist = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = startY + totalDist * targetP;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // Setup GSAP ScrollTrigger pinning and scrub
  useEffect(() => {
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    const pinWrap = pinWrapRef.current;
    if (!container || !pinWrap) return;

    gsap.registerPlugin(ScrollTrigger);

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      pin: pinWrap,
      anticipatePin: 1,
      scrub: true,
      onUpdate: (self) => {
        if (!isCalibrate) {
          targetPRef.current = self.progress;
        }
      },
    });

    if (isCalibrate) {
      targetPRef.current = STORY_CONFIG.timeline.partAEnd; // Freeze at handoff plate (0.42)
    }

    return () => {
      st.kill();
    };
  }, [prefersReducedMotion, isCalibrate]);

  // Main Render and RAF Loop (Pure Function of P)
  useEffect(() => {
    if (prefersReducedMotion) return;

    let running = true;

    const renderLoop = (now: number) => {
      if (!running) return;

      const dt = lastTimeRef.current === 0 ? 0.016 : Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Display progress smoothing: P += (target - P) * (1 - Math.exp(-dt * damping))
      const target = isCalibrate ? STORY_CONFIG.timeline.partAEnd : targetPRef.current;
      const smoothingFactor = 1 - Math.exp(-dt * STORY_CONFIG.progressSmoothingDamping);
      displayPRef.current += (target - displayPRef.current) * smoothingFactor;
      const P = displayPRef.current;

      // Scroll velocity for motion coupling blur
      const dP = Math.abs(P - lastPRef.current);
      velocityRef.current = dt > 0 ? dP / dt : 0;
      lastPRef.current = P;

      // Prioritize frame loading around current frame
      const frameFloat =
        P <= STORY_CONFIG.timeline.partAEnd
          ? lerp(
              STORY_CONFIG.timeline.frameStart,
              STORY_CONFIG.timeline.frameHandoff,
              P / STORY_CONFIG.timeline.partAEnd
            )
          : P <= STORY_CONFIG.timeline.partB1End
          ? lerp(
              STORY_CONFIG.timeline.frameHandoff,
              STORY_CONFIG.timeline.frameEnd,
              (P - STORY_CONFIG.timeline.partB1Start) /
                (STORY_CONFIG.timeline.partB1End - STORY_CONFIG.timeline.partB1Start)
            )
          : STORY_CONFIG.timeline.frameEnd;

      frameLoaderRef.current?.prioritizeAround(frameFloat);

      const { width: W, height: H, dpr, iframeW, iframeH, Z1 } = layoutRef.current;

      // Calculate World Zoom, Plate Blur, and Quads
      let worldZoom = 1.0;
      let plateBlur = 0.0;
      let iframeOpacity = 0.0;
      let flattenT = 0.0;

      if (P < STORY_CONFIG.timeline.partB1Start) {
        // Part A: Video Scrub
        worldZoom = 1.0;
        plateBlur = 0.0;
        iframeOpacity = 0.0;
        flattenT = 0.0;
      } else if (P < STORY_CONFIG.timeline.partB1End) {
        // Part B1: Open and Zoom
        const tB1 =
          (P - STORY_CONFIG.timeline.partB1Start) /
          (STORY_CONFIG.timeline.partB1End - STORY_CONFIG.timeline.partB1Start);
        const zoomEased = easeInOutCubic(tB1);
        worldZoom = lerp(1.0, Z1, zoomEased);
        plateBlur = lerp(0.0, STORY_CONFIG.timeline.plateBlurMax, zoomEased);

        // Cross-dissolve website layer from 0 to 1 between 0.42 and 0.46
        if (P <= STORY_CONFIG.timeline.websiteDissolveStart) {
          iframeOpacity = 0.0;
        } else if (P >= STORY_CONFIG.timeline.websiteDissolveEnd) {
          iframeOpacity = 1.0;
        } else {
          iframeOpacity =
            (P - STORY_CONFIG.timeline.websiteDissolveStart) /
            (STORY_CONFIG.timeline.websiteDissolveEnd - STORY_CONFIG.timeline.websiteDissolveStart);
        }
        flattenT = 0.0;
      } else if (P < STORY_CONFIG.timeline.partB2End) {
        // Part B2: Flatten
        const tB2 =
          (P - STORY_CONFIG.timeline.partB2Start) /
          (STORY_CONFIG.timeline.partB2End - STORY_CONFIG.timeline.partB2Start);
        flattenT = easeInOutCubic(tB2);
        worldZoom = lerp(Z1, Z1 * 1.35, tB2);
        plateBlur = STORY_CONFIG.timeline.plateBlurMax;
        iframeOpacity = 1.0;
      } else {
        // Part C: Tour
        flattenT = 1.0;
        worldZoom = Z1 * 1.35;
        plateBlur = STORY_CONFIG.timeline.plateBlurMax;
        iframeOpacity = 1.0;
      }

      // Handheld life: organic sine drift only during hold, scaled by (1 - flattenT)
      const handheldScale = (1 - flattenT) * (P >= STORY_CONFIG.timeline.partAEnd ? 1 : 0);
      const handheldX =
        Math.sin(now * STORY_CONFIG.realism.handheldSpeed) *
        STORY_CONFIG.realism.handheldAmplitudePx *
        handheldScale;
      const handheldY =
        Math.cos(now * STORY_CONFIG.realism.handheldSpeed * 0.8) *
        STORY_CONFIG.realism.handheldAmplitudePx *
        handheldScale;

      // Base perspective screen quad in screen coordinates
      const baseScreenQuad = mapQuadToScreen(
        calibratedQuad,
        W,
        H,
        STORY_CONFIG.crop,
        STORY_CONFIG.bleedPx
      );
      const quadCenter = getQuadCenter(baseScreenQuad);

      // World transformed screen quad
      const worldQuad = scaleQuadAround(baseScreenQuad, quadCenter, worldZoom).map(
        ([x, y]): Pt => [x + handheldX, y + handheldY]
      );

      // Viewport rectangle quad for flat state
      const viewportQuad: Pt[] = [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H],
      ];

      // Current interpolated screen quad
      const currentScreenQuad = lerpQuad(worldQuad, viewportQuad, flattenT);

      // -------------------------------------------------------------
      // 1. RENDER CANVAS (Plate Layer with High Precision & Smoothing)
      // -------------------------------------------------------------
      const canvas = canvasRef.current;
      if (canvas && P < 0.65) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Keep canvas buffer synchronized with physical screen pixels
          const expectedBufferW = Math.round(W * dpr);
          const expectedBufferH = Math.round(H * dpr);
          if (canvas.width !== expectedBufferW || canvas.height !== expectedBufferH) {
            canvas.width = expectedBufferW;
            canvas.height = expectedBufferH;
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, W, H);

          // Plate fading out during flatten
          const plateAlpha = P >= 0.52 ? Math.max(0, 1 - (P - 0.52) / 0.1) : 1.0;
          ctx.globalAlpha = plateAlpha;

          // Apply world zoom + handheld drift around quad center
          ctx.save();
          ctx.translate(quadCenter[0] + handheldX, quadCenter[1] + handheldY);
          ctx.scale(worldZoom, worldZoom);
          ctx.translate(-quadCenter[0], -quadCenter[1]);

          // Explicitly set or reset blur filter
          ctx.filter = plateBlur > 0.05 ? `blur(${plateBlur.toFixed(2)}px)` : 'none';

          // Maximum quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Cover fit calculation (or contain fit on mobile)
          const mobile = W < 768;
          const s = mobile
            ? Math.min(W / 854, H / 480)
            : Math.max(W / 1280, H / 720) * STORY_CONFIG.crop;
          const vWidth = mobile ? 854 : 1280;
          const vHeight = mobile ? 480 : 720;
          const dw = vWidth * s;
          const dh = vHeight * s;
          const dx = (W - dw) / 2;
          const dy = (H - dh) / 2;

          // Frame blending: floor at full alpha, ceil at fract alpha
          const fFloor = Math.floor(frameFloat);
          const fFract = frameFloat - fFloor;
          const imgFloor = frameLoaderRef.current?.getFrame(fFloor);
          const imgCeil = frameLoaderRef.current?.getFrame(fFloor + 1);

          // Draw floor frame (or poster if loading)
          if (imgFloor && imgFloor.complete && imgFloor.naturalWidth > 0) {
            ctx.drawImage(imgFloor, dx, dy, dw, dh);
          } else if (posterImgRef.current && posterImgRef.current.complete && posterImgRef.current.naturalWidth > 0) {
            ctx.drawImage(posterImgRef.current, dx, dy, dw, dh);
          }

          // Blend ceil frame on top
          if (imgCeil && imgCeil.complete && imgCeil.naturalWidth > 0 && fFract > 0.005) {
            ctx.globalAlpha = plateAlpha * fFract;
            ctx.drawImage(imgCeil, dx, dy, dw, dh);
          }

          ctx.restore(); // restore zoom & blur
          ctx.restore(); // restore dpr scale
        }
      }

      // -------------------------------------------------------------
      // 2. RENDER IFRAME WRAPPER (Perspective Homography & Realism)
      // -------------------------------------------------------------
      const iframeWrapper = iframeWrapperRef.current;
      if (iframeWrapper) {
        iframeWrapper.style.opacity = iframeOpacity.toFixed(3);

        if (P >= STORY_CONFIG.timeline.partB2End) {
          // Flatten complete: transform none for ultra-crisp text rendering
          iframeWrapper.style.transform = 'none';
          iframeWrapper.style.borderRadius = '0px';
          iframeWrapper.style.width = '100vw';
          iframeWrapper.style.height = '100vh';
          iframeWrapper.style.filter = 'none';
          iframeWrapper.style.pointerEvents = 'none';
        } else if (iframeOpacity > 0.005) {
          // In perspective / zooming / flattening stage
          const matrix3d = quadToMatrix3d(iframeW, iframeH, currentScreenQuad);
          iframeWrapper.style.transform = matrix3d;
          iframeWrapper.style.borderRadius = `${(STORY_CONFIG.iframe.borderRadius * (1 - flattenT)).toFixed(1)}px`;
          iframeWrapper.style.width = `${iframeW}px`;
          iframeWrapper.style.height = `${iframeH}px`;
          iframeWrapper.style.pointerEvents = 'none';

          // Realism 1: Screen Tone
          const brightness = lerp(STORY_CONFIG.realism.initialBrightness, 1.0, flattenT);
          const contrast = lerp(STORY_CONFIG.realism.initialContrast, 1.0, flattenT);
          const saturate = lerp(STORY_CONFIG.realism.initialSaturate, 1.0, flattenT);

          // Realism 4 & 5: Edge softness & Motion coupling blur
          const edgeBlur = STORY_CONFIG.realism.edgeSoftnessBlurPx * (1 - flattenT);
          const motionBlur = Math.min(
            STORY_CONFIG.realism.maxMotionBlurPx,
            velocityRef.current * STORY_CONFIG.realism.motionBlurFactor
          );
          const totalBlur = (edgeBlur + motionBlur).toFixed(2);

          iframeWrapper.style.filter = `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(3)}) blur(${totalBlur}px)`;
        }
      }

      // -------------------------------------------------------------
      // 3. CAPTIONS & CHAPTER DISPATCH (Dynamic Corner Positioning)
      // -------------------------------------------------------------
      if (P < STORY_CONFIG.timeline.partAEnd) {
        // Part A Captions
        let activeCap: VideoCaption = STORY_CONFIG.partACaptions[0];
        for (const cap of STORY_CONFIG.partACaptions) {
          if (P >= cap.startP && P <= cap.endP) {
            activeCap = cap;
            break;
          }
        }
        const capDuration = activeCap.endP - activeCap.startP;
        const overlap = capDuration * 0.12;
        const pInCap = P - activeCap.startP;

        let capOpacity = 1.0;
        let capY = 0;
        if (pInCap < overlap) {
          const t = pInCap / overlap;
          capOpacity = t;
          capY = (1 - t) * 12;
        } else if (pInCap > capDuration - overlap) {
          const t = (activeCap.endP - P) / overlap;
          capOpacity = Math.max(0, t);
          capY = (1 - t) * -12;
        }

        setCaptionData({
          title: activeCap.title,
          description: activeCap.description,
          position: activeCap.position,
          opacity: capOpacity,
          translateY: capY,
        });
        setActiveChapterIndex(-1);
      } else if (P < STORY_CONFIG.timeline.partB2End) {
        // Part B Caption
        const bDuration = STORY_CONFIG.timeline.partB2End - STORY_CONFIG.timeline.partB1Start;
        const pInB = P - STORY_CONFIG.timeline.partB1Start;
        const overlap = bDuration * 0.12;
        let capOpacity = 1.0;
        let capY = 0;
        if (pInB < overlap) {
          const t = pInB / overlap;
          capOpacity = t;
          capY = (1 - t) * 12;
        } else if (pInB > bDuration - overlap) {
          const t = (STORY_CONFIG.timeline.partB2End - P) / overlap;
          capOpacity = Math.max(0, t);
          capY = (1 - t) * -12;
        }

        setCaptionData({
          title: STORY_CONFIG.partBCaption.title,
          description: STORY_CONFIG.partBCaption.description,
          position: STORY_CONFIG.partBCaption.position,
          opacity: capOpacity,
          translateY: capY,
        });
        setActiveChapterIndex(-1);
      } else {
        // Part C Tour Chapters
        const tourDuration = STORY_CONFIG.timeline.partCEnd - STORY_CONFIG.timeline.partCStart;
        const chapterCount = STORY_CONFIG.tourChapters.length;
        const chapterLength = tourDuration / chapterCount;
        const chapterIdx = Math.min(
          chapterCount - 1,
          Math.max(0, Math.floor((P - STORY_CONFIG.timeline.partCStart) / chapterLength))
        );

        const chapter = STORY_CONFIG.tourChapters[chapterIdx];
        const pInChap = P - chapter.startP;
        const overlap = (chapter.endP - chapter.startP) * 0.12;
        let capOpacity = 1.0;
        let capY = 0;
        if (pInChap < overlap) {
          const t = pInChap / overlap;
          capOpacity = t;
          capY = (1 - t) * 12;
        } else if (pInChap > (chapter.endP - chapter.startP) - overlap) {
          const t = (chapter.endP - P) / overlap;
          capOpacity = Math.max(0, t);
          capY = (1 - t) * -12;
        }

        setCaptionData({
          title: chapter.title,
          description: chapter.description,
          position: chapter.position,
          route: chapter.route,
          opacity: capOpacity,
          translateY: capY,
        });
        setActiveChapterIndex(chapterIdx);

        // Dispatch postMessage when crossing chapter boundaries
        if (chapterIdx !== lastChapterRef.current) {
          lastChapterRef.current = chapterIdx;
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'story:go', route: chapter.route, play: true },
            '*'
          );
        }
      }

      // If scrolling backward before Part C, reset tour
      if (P < STORY_CONFIG.timeline.partCStart && lastChapterRef.current !== -1) {
        lastChapterRef.current = -1;
        iframeRef.current?.contentWindow?.postMessage({ type: 'story:reset' }, '*');
      }

      lastDrawnPRef.current = P;
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      running = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [prefersReducedMotion, isCalibrate, calibratedQuad]);

  // Helper for dynamic caption positioning classes
  const getCaptionPositionClasses = (pos: CaptionPosition) => {
    switch (pos) {
      case 'top-left':
        return 'top-16 left-6 md:top-20 md:left-12 items-start text-left';
      case 'top-right':
        return 'top-16 right-6 md:top-20 md:right-16 items-end text-right';
      case 'bottom-right':
        return 'bottom-8 right-6 md:bottom-12 md:right-16 items-end text-right';
      case 'bottom-center':
        return 'bottom-8 left-1/2 -translate-x-1/2 md:bottom-12 items-center text-center';
      case 'bottom-left':
      default:
        return 'bottom-8 left-6 md:bottom-12 md:left-12 items-start text-left';
    }
  };

  // Reduced motion alternative view
  if (prefersReducedMotion) {
    return (
      <section
        role="region"
        aria-label="Cinematic product tour"
        className="w-full py-24 px-6 bg-background border-t border-border"
      >
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-signal font-semibold">
                Product Story
              </span>
              <h2 className="font-display text-4xl text-white mt-2 font-normal">
                From raw footage to published clip.
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSkipStory}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-white px-3 py-1.5 rounded-md border border-white/10"
            >
              Skip story
            </button>
          </div>

          {/* 4 Stills Stacked */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { f: 1, title: '01 Record', desc: 'Raw camera ingest & script ingestion' },
              { f: 60, title: '02 Ingest', desc: 'Tag, search and catalog assets' },
              { f: 130, title: '03 Understand', desc: 'AI script-to-footage alignment' },
              { f: 193, title: '04 Cut', desc: 'Intelligent short clip generation' },
            ].map((still) => (
              <div
                key={still.f}
                className="bg-card border border-border rounded-lg overflow-hidden flex flex-col"
              >
                <img
                  src={`/story/desktop/f_${String(still.f).padStart(3, '0')}.webp`}
                  alt={still.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-4 space-y-1">
                  <h3 className="font-display text-xl text-white font-normal">{still.title}</h3>
                  <p className="text-xs text-muted-foreground">{still.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Framed Embed of App */}
          <div className="border border-border rounded-lg overflow-hidden bg-black/60 shadow-2xl">
            <div className="px-4 py-3 bg-secondary/60 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Interactive Workspace</span>
              <span>creatorai.app</span>
            </div>
            <iframe
              title="CreatorAi interactive workspace tour"
              src="/assets?embed=1"
              className="w-full h-[650px] border-none"
            />
          </div>

          {/* 8 Feature Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STORY_CONFIG.tourChapters.map((chap) => (
              <a
                key={chap.id}
                href={chap.route}
                className="p-3 rounded-md bg-secondary/40 border border-border hover:border-white/30 text-xs text-white transition-colors"
              >
                <div className="font-semibold">{chap.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{chap.description}</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      role="region"
      aria-label="Cinematic product tour"
      style={{ height: `${STORY_CONFIG.pinnedHeightVh}vh` }}
      className="relative w-full bg-background z-20"
    >
      {/* Fallback No-JS View */}
      <noscript>
        <div className="w-full py-16 px-6 text-center text-white bg-background">
          <img
            src="/story/poster.webp"
            alt="CreatorAi Studio"
            className="max-w-2xl mx-auto rounded-lg mb-6"
          />
          <h2 className="text-3xl font-display">From script to published clip.</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Experience the automated creator workflow.
          </p>
          <a
            href="/assets"
            className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-md"
          >
            Open workspace
          </a>
        </div>
      </noscript>

      {/* Pinned Viewport Container (GSAP handles fixed pin; no conflicting sticky) */}
      <div
        ref={pinWrapRef}
        className="w-full h-screen overflow-hidden bg-background relative flex items-center justify-center select-none"
      >
        {/* Top 1px White Loading Line (disappears when 100% loaded) */}
        {!isLoaded && (
          <div
            className="absolute top-0 left-0 h-[1px] bg-white z-50 transition-all duration-300 pointer-events-none"
            style={{ width: `${loadPercent}%` }}
          />
        )}

        {/* Skip Story Button (First focusable element) */}
        <button
          type="button"
          onClick={handleSkipStory}
          className="absolute top-6 right-6 z-40 text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10"
        >
          Skip story
        </button>

        {/* Static Film Grain Overlay (SVG feTurbulence, subtle 0.03 opacity) */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ opacity: STORY_CONFIG.realism.grainOpacity }}
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <filter id="story-film-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#story-film-grain)" />
          </svg>
        </div>

        {/* Canvas 2D Video Plate Renderer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block z-0 pointer-events-none"
        />

        {/* Screen-space Perspective Iframe Layer */}
        <div
          ref={iframeWrapperRef}
          className="absolute top-0 left-0 origin-top-left overflow-hidden z-20 shadow-2xl will-change-transform"
          style={{
            opacity: 0,
            transformOrigin: '0 0',
          }}
        >
          {/* Realism 3: Laptop Display Notch (scales away with flatten) */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-black z-30 pointer-events-none rounded-b-md"
            style={{
              width: `${STORY_CONFIG.realism.notchWidthPercent}%`,
              height: `${STORY_CONFIG.realism.notchHeightPercent}%`,
            }}
          />

          {/* Realism 2: Diagonal White Glare Reflection */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 70%)',
            }}
          />

          {/* Embedded Real Application */}
          <iframe
            ref={iframeRef}
            title="CreatorAi interactive workspace tour"
            src="/assets?embed=1"
            className="w-full h-full border-none bg-background"
          />
        </div>

        {/* ===================== CAPTIONS OVERLAY (Dynamic Corner Placement) ===================== */}
        <div
          className={`absolute z-30 max-w-md transition-all duration-500 ease-out flex flex-col ${getCaptionPositionClasses(
            captionData.position
          )}`}
          style={{
            opacity: captionData.opacity,
            transform: `translateY(${captionData.translateY}px)`,
          }}
        >
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-5 shadow-2xl space-y-2">
            <h3 className="font-display text-3xl sm:text-4xl text-white font-normal leading-tight">
              {captionData.title}
            </h3>
            <p className="font-sans text-sm text-gray-300 leading-relaxed">
              {captionData.description}
            </p>
            {captionData.route && (
              <div className="pt-2">
                <a
                  href={captionData.route}
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md border border-white/20 hover:border-white/50 text-white bg-white/5 transition-colors"
                >
                  Open this page
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT CHAPTER INDICATOR RAIL ===================== */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center space-y-2.5">
          {STORY_CONFIG.tourChapters.map((chap, idx) => {
            const isActive = activeChapterIndex === idx;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => scrollToP(chap.startP + 0.005)}
                title={chap.name}
                className="group relative flex items-center justify-end py-1"
              >
                {/* Tooltip on hover */}
                <span className="hidden group-hover:block absolute right-6 px-2 py-1 rounded-md bg-black/90 text-white text-[10px] whitespace-nowrap border border-white/10">
                  {chap.name}
                </span>
                {/* Rectangular Tick (Never dots) */}
                <div
                  className={`w-3.5 h-[3px] rounded-[1px] transition-all duration-200 ${
                    isActive
                      ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                      : 'bg-white/30 hover:bg-white/70'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* DEV Calibration Mode Tool Overlay (?calibrate=1) */}
        {isDev && isCalibrate && (
          <StoryCalibration
            quad={calibratedQuad}
            onChange={setCalibratedQuad}
            viewportWidth={viewportSize.w}
            viewportHeight={viewportSize.h}
            crop={STORY_CONFIG.crop}
          />
        )}
      </div>
    </section>
  );
};
