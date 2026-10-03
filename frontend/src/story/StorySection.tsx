import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { clamp, easeInOutCubic, easeInOutQuart, lerp, seg } from '../lib/math';
import { VIDEO_H, VIDEO_W, cover, toCanvas } from './cover';
import { createEngine } from './engine';
import { FrameLoader } from './frameLoader';
import { QUAD, bbox, centroid, interpolateQuad, type Pt } from './quad';
import { angleAt, angDist, look, pForCard, ringRadius } from './ring';
import { STORY_CONFIG } from './story.config';

type StoryWindow = Window & {
  auditStory?: () => { start: number; end: number; duration: number }[];
  __story?: { jump: (value: number) => void; getP: () => number; scrollToP: (value: number) => void; debug: { quad: () => Pt[]; auditStory: () => { start: number; end: number; duration: number }[] } };
  __perf?: { start: () => void; stop: () => { p95: number; max: number; frames: number } };
};

const visibility = (p: number) => {
  const vid = p < 0.41 ? 1 : (p <= 0.44 ? 1 - seg(p, 0.41, 0.44) : 0);
  const stm = (p >= 0.41 && p < 0.62) ? (p < 0.44 ? seg(p, 0.41, 0.44) : (p < 0.56 ? 1 : 1 - seg(p, 0.56, 0.62))) : 0;
  const rng = (p >= 0.56 && p < 0.93) ? (p < 0.62 ? seg(p, 0.56, 0.62) : (p < 0.88 ? 1 : 1 - seg(p, 0.88, 0.93))) : 0;
  const cls = p >= 0.88 ? (p < 0.93 ? seg(p, 0.88, 0.93) : 1) : 0;
  return [vid, stm, rng, cls];
};
const headline = ['From', 'script', 'to', 'published', 'clip,', 'in', 'one', 'workspace.'];
const subtext = 'Upload your script and raw footage. CreatorAi matches each line to the right moment, cuts short-form clips, writes hooks, and exports a version for each platform. Every AI edit stays editable.';

function drawPolygon(ctx: CanvasRenderingContext2D, points: Pt[]) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function drawStoryFrame(canvas: HTMLCanvasElement, loader: FrameLoader, p: number, w: number, h: number, dpr: number, quad: Pt[]) {
  const width = Math.round(w * dpr), height = Math.round(h * dpr);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return { scale: 1, dx: 0, dy: 0 };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
  if (p >= 0.44) return { scale: 1, dx: 0, dy: 0 };
  const frame = p <= 0.36 ? lerp(1, 385, seg(p, 0, 0.36)) : lerp(385, 408, seg(p, 0.36, 0.44));
  loader.prioritizeAround(frame);
  const floor = Math.floor(frame), fraction = frame - floor;
  const c = cover(width, height);
  const draw = (image: ImageBitmap | HTMLImageElement | null, alpha: number, transform?: { z: number; from: Pt; to: Pt }) => {
    if (!image || alpha <= 0) return;
    ctx.save();
    if (transform) ctx.setTransform(transform.z, 0, 0, transform.z, transform.to[0] - transform.from[0] * transform.z, transform.to[1] - transform.from[1] * transform.z);
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, c.dx, c.dy, VIDEO_W * c.s, VIDEO_H * c.s);
    ctx.restore();
  };
  let transform: { z: number; from: Pt; to: Pt } | undefined;
  let zoomedQuad: Pt[] | undefined;
  if (p >= 0.36) {
    const q = quad.map(([x, y]) => toCanvas(c, x, y));
    const from = centroid(q), to: Pt = [width / 2, height / 2], bounds = bbox(q);
    const e = easeInOutCubic(seg(p, 0.36, 0.42));
    transform = { z: lerp(1, Math.max(width / bounds.w, height / bounds.h) * 1.04, e), from, to: [lerp(from[0], to[0], e), lerp(from[1], to[1], e)] };
    zoomedQuad = q.map(([x, y]) => [transform!.to[0] + (x - transform!.from[0]) * transform!.z, transform!.to[1] + (y - transform!.from[1]) * transform!.z]);
  }
  draw(loader.getFrame(floor), 1, transform);
  draw(loader.getFrame(Math.min(408, floor + 1)), fraction, transform);
  if (zoomedQuad) {
    const off = seg(p, 0.38, 0.41), stretch = easeInOutCubic(seg(p, 0.41, 0.44));
    const finalQuad = interpolateQuad(zoomedQuad, [[0, 0], [width, 0], [width, height], [0, height]], stretch);
    ctx.save(); drawPolygon(ctx, finalQuad); ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${off})`; ctx.fillRect(0, 0, width, height);
    if (off > 0 && off < 0.3) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let line = 0; line < 3; line++) ctx.fillRect(0, height * (0.42 + line * 0.06), width, 1); }
    // ban-ok: flat five-percent white diagonal laptop glare, clipped inside the tracked quad.
    ctx.fillStyle = `rgba(255,255,255,${0.05 * (1 - stretch)})`; ctx.beginPath(); ctx.moveTo(width * 0.05, height * 0.9); ctx.lineTo(width * 0.3, height); ctx.lineTo(width * 0.95, 0); ctx.lineTo(width * 0.7, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  return { scale: c.s, dx: c.dx, dy: c.dy };
}

const RingCard = ({ card, index, refItem }: { card: (typeof STORY_CONFIG.pipelineCards)[number]; index: number; refItem: (node: HTMLDivElement | null) => void }) => (
  <div ref={refItem} data-story-card={index} className="absolute left-0 top-0 rounded-lg border border-white/15 bg-black/75 p-6 sm:p-8" style={{ width: 'clamp(320px, 38vw, 560px)', height: 470, backfaceVisibility: 'hidden' }}>
    <div className="flex items-baseline justify-between border-b border-white/15 pb-4"><h3 className="font-display text-3xl text-white"><span className="mr-3 font-sans text-xs tracking-[0.12em] text-signal">{card.stepNumber}</span>{card.name}</h3><span className="font-mono text-[10px] text-muted-foreground">{card.stepNumber} / 08</span></div>
    <dl className="mt-5 space-y-4 text-[15px] leading-relaxed"><div><dt>Input</dt><dd>{card.input}</dd></div><div><dt>What happens</dt><dd>{card.whatHappens}</dd></div><div><dt>Output</dt><dd>{card.output}</dd></div><div><dt>You stay in control</dt><dd>{card.youStayInControl}</dd></div></dl>
    <Link to={`/dashboard/${card.module}`} className="mt-5 inline-flex items-center gap-1 text-sm text-white underline underline-offset-4">Open in dashboard <ArrowUpRight size={15} /></Link>
  </div>
);

const ReducedStory = () => <section aria-label="How CreatorAi works" className="space-y-12 bg-black px-5 pb-20 pt-24"><div className="mx-auto max-w-4xl text-center"><h1 className="font-display text-5xl text-white">From script to published clip, in one workspace.</h1><p className="mt-5 text-muted-foreground">{subtext}</p></div>{STORY_CONFIG.captions.map((caption, index) => <article key={caption.id} className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2"><img src={`/story/desktop/f_${String([1, 120, 280, 385][index]).padStart(3, '0')}.webp`} alt="" className="w-full rounded-lg border border-white/10" /><div><span className="text-signal">{caption.stepNumber} / 04</span><h2 className="font-display text-4xl text-white">{caption.title}</h2><p className="text-muted-foreground">{caption.sentence}</p></div></article>)}<div className="mx-auto max-w-4xl space-y-5">{STORY_CONFIG.pipelineCards.map((card) => <article key={card.id} className="rounded-lg border border-white/10 p-5"><h2 className="font-display text-3xl text-white">{card.stepNumber}. {card.name}</h2><p className="text-muted-foreground">{card.whatHappens}</p><Link to={`/dashboard/${card.module}`} className="text-white underline">Open in dashboard</Link></article>)}</div></section>;

export const StorySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null), canvasRef = useRef<HTMLCanvasElement>(null), pipelineRef = useRef<HTMLDivElement>(null), drumRef = useRef<HTMLDivElement>(null), counterRef = useRef<HTMLSpanElement>(null), stepRef = useRef<HTMLSpanElement>(null), statementRef = useRef<HTMLDivElement>(null), apertureRef = useRef<HTMLDivElement>(null), ringRef = useRef<HTMLDivElement>(null), closingRef = useRef<HTMLDivElement>(null), loadRef = useRef<HTMLDivElement>(null), debugRef = useRef<HTMLPreElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]), wordRefs = useRef<(HTMLSpanElement | null)[]>([]), subtextRef = useRef<HTMLParagraphElement>(null), cardRefs = useRef<(HTMLDivElement | null)[]>([]), tickRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const quadRef = useRef<Pt[]>(QUAD.map((point) => [...point] as Pt));
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    if (reduced || !sectionRef.current || !canvasRef.current) return;
    const loader = new FrameLoader({ totalFrames: 408, onProgress: (loaded, total) => { if (loadRef.current) loadRef.current.style.transform = `scaleX(${loaded / total})`; } });
    const scene = { update(p: number, ctx: { w: number; h: number; dpr: number }) {
      const values = visibility(p);
      const measure = drawStoryFrame(canvasRef.current!, loader, p, ctx.w, ctx.h, ctx.dpr, quadRef.current);
      STORY_CONFIG.captions.forEach((caption, index) => { const node = captionRefs.current[index]; if (!node) return; const t = Math.min(seg(p, caption.startP - 0.02, caption.startP + 0.03), 1 - seg(p, caption.endP - 0.03, caption.endP + 0.02)); node.style.opacity = String(t); node.style.transform = `translateY(${(1 - t) * 18}px)`; });
      if (statementRef.current) {
        statementRef.current.style.opacity = String(values[1]);
        statementRef.current.style.transform = `scale(${lerp(0.94, 1.06, seg(p, 0.44, 0.59))})`;
        statementRef.current.style.filter = `blur(${seg(p, 0.56, 0.62) * 6}px)`;
        statementRef.current.style.pointerEvents = (p >= 0.44 && p < 0.56) ? 'auto' : 'none';
      }
      wordRefs.current.forEach((word, index) => { if (!word) return; const t = easeInOutCubic(seg(p, 0.44 + index * (0.06 / headline.length), 0.475 + index * (0.06 / headline.length))); word.style.opacity = String(t); word.style.transform = `translateY(${(1 - t) * 110}%)`; word.style.filter = `blur(${(1 - t) * 12}px)`; });
      if (subtextRef.current) { const t = easeInOutCubic(seg(p, 0.52, 0.56)); subtextRef.current.style.opacity = String(t); subtextRef.current.style.transform = `translateY(${(1 - t) * 24}px)`; }
      const apertureT = easeInOutQuart(seg(p, 0.56, 0.62)); if (pipelineRef.current) pipelineRef.current.style.clipPath = `circle(${apertureT * 0.56 * Math.hypot(ctx.w, ctx.h)}px at 50% 50%)`;
      if (apertureRef.current) { const radius = apertureT * 0.56 * Math.hypot(ctx.w, ctx.h); apertureRef.current.style.width = `${radius * 2}px`; apertureRef.current.style.height = `${radius * 2}px`; apertureRef.current.style.opacity = String(1 - seg(p, 0.602, 0.62)); }
      const intro = easeInOutCubic(seg(p, 0.60, 0.66)), rotation = angleAt(seg(p, 0.66, 0.88)), recede = easeInOutCubic(seg(p, 0.88, 0.93));
      if (ringRef.current) { ringRef.current.style.opacity = String(values[2]); ringRef.current.style.filter = `blur(${recede * 6}px)`; }
      const cardWidth = clamp(ctx.w * 0.38, 320, 560), radius = ringRadius(cardWidth); if (drumRef.current) drumRef.current.style.transform = `scale(${lerp(0.6, 1, intro)}) translateZ(${-800 + 800 * intro - 1400 * recede}px) translateZ(${-radius}px) rotateX(-4deg) rotateY(${-rotation}deg)`;
      let active = 0, nearest = Infinity; cardRefs.current.forEach((card, index) => { if (!card) return; const distance = angDist(index, rotation), style = look(distance); card.style.transform = `rotateY(${index * 45}deg) translateZ(${radius}px)`; card.style.opacity = String(style.opacity); card.style.filter = `blur(${style.blur}px)`; card.style.pointerEvents = distance < 22.5 ? 'auto' : 'none'; if (distance < nearest) { nearest = distance; active = index; } });
      if (counterRef.current) counterRef.current.textContent = String(active + 1).padStart(2, '0'); if (stepRef.current) stepRef.current.textContent = STORY_CONFIG.pipelineCards[active].name; tickRefs.current.forEach((tick, index) => { if (tick) { tick.style.backgroundColor = index === active ? 'hsl(var(--signal))' : 'rgba(255,255,255,.24)'; tick.setAttribute('aria-current', String(index === active)); } });
      if (closingRef.current) { closingRef.current.style.opacity = String(values[3]); closingRef.current.style.transform = `translateY(${(1 - values[3]) * 36}px)`; closingRef.current.style.pointerEvents = p >= 0.88 ? 'auto' : 'none'; }
      if (debugRef.current) debugRef.current.textContent = `stage ${Math.round(ctx.w)} x ${Math.round(ctx.h)}\ncanvas ${canvasRef.current!.width} x ${canvasRef.current!.height}\ndpr ${ctx.dpr}\ncover ${measure.scale.toFixed(3)}  ${Math.round(measure.dx)}, ${Math.round(measure.dy)}\nP ${p.toFixed(4)}`;
    } };
    const engine = createEngine(sectionRef.current, [scene]);
    const win = window as StoryWindow;
    if (import.meta.env.DEV) {
      let sample: number[] = [], frame = 0, last = 0;
      const auditStory = () => {
        const blanks: { start: number; end: number; duration: number }[] = [];
        let run = 0;
        let start = 0;
        for (let value = 0; value <= 1.0001; value += 0.002) {
          const vis = visibility(value);
          const maxVis = Math.max(...vis);
          if (maxVis < 0.5) {
            if (run === 0) start = value;
            run += 0.002;
          } else {
            if (run > 0.01) blanks.push({ start, end: value, duration: run });
            run = 0;
          }
        }
        if (blanks.length === 0) {
          console.info('[auditStory] PASS: 0 empty ranges found. No blank screens exist.');
        } else {
          console.warn('[auditStory] FAIL: empty ranges found:', blanks);
        }
        return blanks;
      };
      win.__story = { jump: engine.jump, getP: engine.getP, scrollToP: engine.scrollToP, debug: { quad: () => quadRef.current, auditStory } };
      win.auditStory = auditStory;
      win.__perf = { start: () => { sample = []; last = performance.now(); const collect = (now: number) => { sample.push(now - last); last = now; frame = requestAnimationFrame(collect); }; frame = requestAnimationFrame(collect); }, stop: () => { cancelAnimationFrame(frame); const sorted = [...sample].sort((a, b) => a - b); return { p95: sorted[Math.floor(sorted.length * 0.95)] || 0, max: sorted.at(-1) || 0, frames: sorted.length }; } };
    }
    return () => { engine.destroy(); loader.destroy(); delete win.__story; delete win.__perf; delete win.auditStory; };
  }, [reduced]);
  if (reduced) return <ReducedStory />;
  const debug = typeof window !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';
  return <section ref={sectionRef} style={{ height: STORY_CONFIG.height }} aria-label="How CreatorAi works"><div data-testid="story-stage" className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black"><canvas ref={canvasRef} data-testid="story-canvas" className="absolute inset-0 h-full w-full" /><div ref={loadRef} className="absolute left-0 top-0 z-20 h-px w-full origin-left bg-white" />
    <div className="absolute inset-0 z-10 pointer-events-none">{STORY_CONFIG.captions.map((caption, index) => <div key={caption.id} ref={(node) => { captionRefs.current[index] = node; }} className={`absolute left-[5vw] w-[min(31rem,88vw)] rounded-lg border border-white/10 bg-black/45 p-6 backdrop-blur-md ${caption.anchor === 'top-left' ? 'top-[18vh]' : 'bottom-[10vh]'}`}><div className="text-xs font-medium uppercase tracking-[.12em] text-muted-foreground">{caption.stepNumber} / 04</div><div className="my-4 h-px w-12 bg-white" /><h2 className="font-display text-5xl leading-none text-white">{caption.title}</h2><p className="mt-3 text-base text-white/80">{caption.sentence}</p></div>)}</div>
    <button type="button" onClick={() => (window as StoryWindow).__story?.scrollToP(0.9)} className="absolute right-6 top-24 z-30 rounded-md px-3 py-2 text-sm text-white underline underline-offset-4">Skip story</button>
    <div ref={statementRef} data-testid="story-statement" className="absolute inset-0 z-10 flex items-center justify-center bg-black px-5 text-center"><div className="max-w-6xl"><h1 className="font-display text-5xl leading-[.95] tracking-[-.04em] text-white sm:text-7xl md:text-8xl lg:text-9xl">{headline.map((word, index) => <span key={`${word}-${index}`} className="mx-[.13em] inline-block overflow-hidden"><span ref={(node) => { wordRefs.current[index] = node; }} className={index === 3 || index === 4 || index > 5 ? 'inline-block text-muted-foreground' : 'inline-block'}>{word}</span></span>)}</h1><p ref={subtextRef} className="mx-auto mt-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">{subtext}</p></div></div>
    <div ref={pipelineRef} data-testid="story-pipeline" className="absolute inset-0 z-20 overflow-hidden bg-background"><svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true"><defs><pattern id="story-grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeOpacity=".18" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#story-grid)" /></svg><div ref={apertureRef} className="absolute left-1/2 top-1/2 rounded-[50%] border border-white" style={{ transform: 'translate(-50%, -50%)' }} />
      <div ref={ringRef} className="absolute inset-0 flex items-center justify-center" style={{ perspective: '2400px', perspectiveOrigin: '50% 45%' }}><div className="absolute left-7 top-1/2 z-10 hidden -translate-y-1/2 md:block"><span ref={counterRef} className="font-display text-7xl text-white">01</span><span className="font-display text-3xl text-muted-foreground"> / 08</span><span ref={stepRef} className="mt-2 block text-sm text-muted-foreground" /><div className="mt-5 flex flex-col gap-2 border-l border-white/20 pl-3">{STORY_CONFIG.pipelineCards.map((card, index) => <button key={card.id} ref={(node) => { tickRefs.current[index] = node; }} type="button" onClick={() => (window as StoryWindow).__story?.scrollToP(pForCard(index))} aria-label={`Show ${card.name}`} className="h-6 w-[2px] rounded-none" />)}</div></div><div ref={drumRef} className="relative h-[470px]" style={{ width: 'clamp(320px, 38vw, 560px)', transformStyle: 'preserve-3d' }}>{STORY_CONFIG.pipelineCards.map((card, index) => <RingCard key={card.id} card={card} index={index} refItem={(node) => { cardRefs.current[index] = node; }} />)}</div></div>
    </div>
    <div ref={closingRef} data-testid="story-closing" className="absolute inset-0 z-30 flex items-center justify-center bg-background px-5 text-center"><div><h2 className="font-display text-5xl text-white md:text-7xl">Run the whole pipeline yourself.</h2><p className="mx-auto mt-5 max-w-xl text-muted-foreground">Log in and open the dashboard. All eight steps are there in one console.</p><div className="mt-8 flex justify-center gap-3"><Link to="/login" className="liquid-glass rounded-md px-5 py-3 text-white">Log in</Link><Link to="/dashboard" className="rounded-md px-5 py-3 text-white underline underline-offset-4">Go to dashboard</Link></div><p className="mt-6 text-sm text-muted-foreground">This is a demo. Your data stays in this browser. <Link to="/privacy" className="underline">Privacy Policy</Link> <Link to="/terms" className="underline">Terms and Conditions</Link></p></div></div>
    {debug && <pre ref={debugRef} className="absolute bottom-4 right-4 z-40 rounded-lg border border-white/20 bg-black/85 p-3 text-xs text-white" />}
  </div></section>;
};
