import { DEFAULT_SCREEN_QUAD } from './quad';

export type CaptionPosition =
  | 'bottom-left'
  | 'top-right'
  | 'bottom-right'
  | 'top-left'
  | 'bottom-center';

export interface TourChapter {
  id: string;
  name: string;
  title: string;
  description: string;
  route: string;
  startP: number;
  endP: number;
  position: CaptionPosition;
}

export interface VideoCaption {
  id: string;
  title: string;
  description: string;
  startP: number;
  endP: number;
  position: CaptionPosition;
}

export const STORY_CONFIG = {
  // Pinned scroll container length
  pinnedHeightVh: 1100,

  // Lenis smooth scroll settings
  lenis: {
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: false,
  },

  // Display progress smoothing: P += (target - P) * (1 - Math.exp(-dt * damping))
  progressSmoothingDamping: 12,

  // Timeline Progress Milestones (0.00 to 1.00)
  timeline: {
    // Part A: Video Scrub
    partAStart: 0.0,
    partAEnd: 0.42,
    frameStart: 1,
    frameHandoff: 193,
    frameEnd: 204,

    // Part B1: Open and Zoom
    partB1Start: 0.42,
    partB1End: 0.52,
    websiteDissolveStart: 0.42,
    websiteDissolveEnd: 0.46,
    plateBlurMax: 2.5, // px of depth of field blur

    // Part B2: Flatten to viewport
    partB2Start: 0.52,
    partB2End: 0.62,

    // Part C: Feature Tour
    partCStart: 0.62,
    partCEnd: 1.0,
  },

  // Target viewport fill for zoomed screen quad (90% width)
  targetScreenQuadViewportWidthRatio: 0.9,

  // Video quad in 1280x720 video coordinates
  initialVideoQuad: DEFAULT_SCREEN_QUAD,
  bleedPx: 2,

  // Optional CROP constant (default 1.0: anchored top-left)
  crop: 1.0,

  // Iframe layout clamping bounds
  iframe: {
    minWidth: 1100,
    maxWidth: 1920,
    borderRadius: 8,
  },

  // Realism layers on the perspective screen
  realism: {
    // Screen Tone filter
    initialBrightness: 0.92,
    initialContrast: 1.04,
    initialSaturate: 0.95,

    // Glare overlay: white linear-gradient diagonal reflection
    maxGlareOpacity: 0.07,

    // Notch dimensions relative to screen
    notchWidthPercent: 9.0, // % of screen width
    notchHeightPercent: 2.2, // % of screen height

    // Edge softness
    edgeSoftnessBlurPx: 0.4,

    // Motion coupling blur (velocity-dependent)
    maxMotionBlurPx: 1.2,
    motionBlurFactor: 0.05,

    // Handheld life (subtle organic camera drift)
    handheldAmplitudePx: 1.5,
    handheldSpeed: 0.0015,

    // Plate film grain
    grainOpacity: 0.03,
  },

  // Captions for Part A by video timestamp with dynamic corner positioning
  partACaptions: [
    {
      id: 'record',
      title: '01 Record',
      description: 'You shoot hours of raw footage and write a script for it. CreatorAi starts there.',
      startP: 0.0,
      endP: 0.09,
      position: 'bottom-left',
    },
    {
      id: 'ingest',
      title: '02 Ingest',
      description: 'Footage, images and audio go into one library. Tag them, search them, and find them again.',
      startP: 0.09,
      endP: 0.19,
      position: 'top-right',
    },
    {
      id: 'understand',
      title: '03 Understand',
      description: 'Each line of your script is matched to the moment in the footage where you say it. Lines with no footage are flagged.',
      startP: 0.19,
      endP: 0.28,
      position: 'bottom-right',
    },
    {
      id: 'cut',
      title: '04 Cut',
      description: 'Long recordings become short clips. Each clip shows why it was picked and carries a hook you can edit.',
      startP: 0.28,
      endP: 0.42,
      position: 'top-left',
    },
  ] as VideoCaption[],

  // Caption for Part B
  partBCaption: {
    title: 'Open the workspace',
    description: 'This is the real app, not a mockup.',
    startP: 0.42,
    endP: 0.62,
    position: 'bottom-center' as CaptionPosition,
  },

  // 8 Chapters for Part C Tour with strategic corner positions
  tourChapters: [
    {
      id: 'assets',
      name: 'Assets',
      title: 'Assets',
      description: 'One library for every video, image and audio file.',
      route: '/assets',
      startP: 0.62,
      endP: 0.6675,
      position: 'top-left',
    },
    {
      id: 'scripts',
      name: 'Scripts and hooks',
      title: 'Scripts and hooks',
      description: 'Write the script, generate hooks, and keep the version you like.',
      route: '/scripts',
      startP: 0.6675,
      endP: 0.715,
      position: 'bottom-left',
    },
    {
      id: 'footage',
      name: 'Footage match',
      title: 'Footage match',
      description: 'See which footage covers which script line, and what is still missing.',
      route: '/footage',
      startP: 0.715,
      endP: 0.7625,
      position: 'top-right',
    },
    {
      id: 'clips',
      name: 'Clips',
      title: 'Clips',
      description: 'Pick, trim and reorder the short clips the matcher found.',
      route: '/clips',
      startP: 0.7625,
      endP: 0.81,
      position: 'bottom-right',
    },
    {
      id: 'editor',
      name: 'Editor',
      title: 'Editor',
      description: 'Apply AI edits as layers. Change any of them by hand.',
      route: '/editor',
      startP: 0.81,
      endP: 0.8575,
      position: 'top-left',
    },
    {
      id: 'platforms',
      name: 'Platforms',
      title: 'Platforms',
      description: 'Reframe one clip for each platform and edit each caption.',
      route: '/platforms',
      startP: 0.8575,
      endP: 0.905,
      position: 'bottom-left',
    },
    {
      id: 'workflow',
      name: 'Workflow',
      title: 'Workflow',
      description: 'Move every piece of content from idea to published on one board.',
      route: '/workflow',
      startP: 0.905,
      endP: 0.9525,
      position: 'top-right',
    },
    {
      id: 'insights',
      name: 'Insights',
      title: 'Insights',
      description: 'Import your performance data and see what your own numbers show.',
      route: '/insights',
      startP: 0.9525,
      endP: 1.0,
      position: 'bottom-right',
    },
  ] as TourChapter[],
};

// easeInOutCubic easing helper
export function easeInOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
