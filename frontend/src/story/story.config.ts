import { DEFAULT_SCREEN_QUAD } from './quad';

export type CaptionAnchor = 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right' | 'bottom-center';

export interface StoryCaption {
  id: string;
  stepNumber: string;
  title: string;
  sentence: string;
  startP: number;
  endP: number;
  anchor: CaptionAnchor;
}

export interface PipelineCardData {
  id: string;
  module: string;
  stepNumber: string;
  name: string;
  input: string;
  whatHappens: string;
  output: string;
  youStayInControl: string;
}

// Derived timing constants from 48 FPS source
export const FPS = 48;
export const TOTAL_FRAMES = 408;
export const HANDOFF_FRAME = Math.round(8.0 * FPS) + 1; // Frame 385 (8.0s)
export const LAST_FRAME = 408; // Frame 408 (8.5s)

export const COVER_FOCUS = { x: 0.5, y: 0.5 };

export const SMOOTHING = {
  lenisLerp: 0.075,
  followerDamping: 8.0,
  inertiaLimit: 0.004,
};

export const STORY_CONFIG = {
  // Pinned scroll container length (Step 2: 1800vh)
  pinnedHeightVh: 1800,
  height: '1800vh',

  // Lenis configuration
  lenis: {
    lerp: SMOOTHING.lenisLerp,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    syncTouch: false,
    touchMultiplier: 1.4,
  },

  smoothing: SMOOTHING,

  coverFocus: COVER_FOCUS,

  fps: FPS,
  totalFrames: TOTAL_FRAMES,
  handoffFrame: HANDOFF_FRAME,
  lastFrame: LAST_FRAME,

  // New Story Timeline (Step 2)
  timeline: {
    // Part A: Video Scrub (P 0.00 to 0.36)
    partAStart: 0.00,
    partAEnd: 0.36,

    // Part B: Push in & screen powers off to black (P 0.36 to 0.44)
    partBStart: 0.36,
    partBEnd: 0.44,
    quadFadeStart: 0.38,
    quadFadeEnd: 0.41,

    // Part C: Statement on black (P 0.44 to 0.56)
    partCStart: 0.44,
    partCEnd: 0.56,
    headlineRevealStart: 0.44,
    headlineRevealEnd: 0.52,
    subtextFadeStart: 0.52,
    subtextFadeEnd: 0.56,

    // Part D: Aperture opening (P 0.56 to 0.62)
    partDStart: 0.56,
    partDEnd: 0.62,

    // Part E: Revolving Pipeline Ring (P 0.60 to 0.90)
    drumIntroStart: 0.60,
    drumIntroEnd: 0.66,
    drumRotateStart: 0.66,
    drumRotateEnd: 0.88,
    drumRecedeStart: 0.88,
    drumRecedeEnd: 0.93,

    // Part F: Closing beat with login (P 0.90 to 1.00)
    closingStart: 0.90,
    closingInteractiveStart: 0.93,
    closingEnd: 1.00,
  },

  initialVideoQuad: DEFAULT_SCREEN_QUAD,
  bleedPx: 2,

  realism: {
    maxGlareOpacity: 0.05,
    edgeSoftnessBlurPx: 0.4,
    handheldAmplitudePx: 1.5,
    plateGrainOpacity: 0.04,
  },

  // Captions for Part A (0.00 to 0.36)
  captions: [
    {
      id: 'record',
      stepNumber: '01',
      title: 'Record',
      sentence: 'You shoot hours of raw footage and write a script for it. CreatorAi starts there.',
      startP: 0.00,
      endP: 0.09,
      anchor: 'bottom-left',
    },
    {
      id: 'ingest',
      stepNumber: '02',
      title: 'Ingest',
      sentence: 'Footage, images and audio go into one library. Tag them, search them, and find them again.',
      startP: 0.09,
      endP: 0.18,
      anchor: 'bottom-left',
    },
    {
      id: 'understand',
      stepNumber: '03',
      title: 'Understand',
      sentence: 'Each line of your script is matched to the moment in the footage where you say it. Lines with no footage are flagged.',
      startP: 0.18,
      endP: 0.27,
      anchor: 'bottom-left',
    },
    {
      id: 'cut',
      stepNumber: '04',
      title: 'Cut',
      sentence: 'Long recordings become short clips. Each clip shows why it was picked and carries a hook you can edit.',
      startP: 0.27,
      endP: 0.36,
      anchor: 'top-left',
    },
  ] as StoryCaption[],

  // 8 Revolving Pipeline Cards (Step 3)
  pipelineCards: [
    {
      id: 'assets',
      module: 'assets',
      stepNumber: '01',
      name: 'Assets',
      input: 'Video, image and audio files you upload.',
      whatHappens:
        'Each file is added to one library. Thumbnails and waveforms are generated in your browser, and you add tags and folders.',
      output: 'A searchable library that every later step reads from.',
      youStayInControl: 'Rename, retag, move or delete any file at any time.',
    },
    {
      id: 'scripts',
      module: 'scripts',
      stepNumber: '02',
      name: 'Scripts and hooks',
      input: 'A topic, audience, tone, platform and target length.',
      whatHappens:
        'The generator writes hook options, each labeled with the technique it uses, and a script split into hook, body and call to action.',
      output: 'One pinned script, plus titles, a description and tags.',
      youStayInControl: 'Edit every line, reorder sections and regenerate any hook.',
    },
    {
      id: 'footage',
      module: 'footage',
      stepNumber: '03',
      name: 'Footage match',
      input: 'The pinned script and a video from your library.',
      whatHappens:
        'Each script line is compared with the footage and marked Matched, Weak match or No footage found.',
      output:
        'A map from script lines to moments in the video, and a list of lines that still need footage.',
      youStayInControl: 'Reassign any match by hand.',
    },
    {
      id: 'clips',
      module: 'clips',
      stepNumber: '04',
      name: 'Clips',
      input: 'The matched footage.',
      whatHappens:
        'Segments are scored and cut into short clips. Each clip records why it was picked and carries a suggested hook.',
      output: 'A set of clips with in and out points.',
      youStayInControl: 'Trim, accept, reject and reorder every clip.',
    },
    {
      id: 'editor',
      module: 'editor',
      stepNumber: '05',
      name: 'Editor',
      input: 'The clips you accepted.',
      whatHappens:
        'Suggested edits such as silence removal, captions, punch-ins and a title card are applied as separate layers marked AI.',
      output: 'An edited timeline.',
      youStayInControl:
        'Change any AI layer by hand, convert it to manual, or revert a single change from the history list.',
    },
    {
      id: 'platforms',
      module: 'platforms',
      stepNumber: '06',
      name: 'Platforms',
      input: 'The edited clip.',
      whatHappens:
        'The clip is reframed for each platform with safe zones, and a title and caption are written for each one.',
      output: 'One variant per platform.',
      youStayInControl: 'Move the crop window and edit every title and caption.',
    },
    {
      id: 'workflow',
      module: 'workflow',
      stepNumber: '07',
      name: 'Workflow',
      input: 'Scripts, clips and platform variants.',
      whatHappens:
        'Each item becomes a card on a board that runs from idea to published, with a calendar for scheduled posts.',
      output: 'A production plan you can follow.',
      youStayInControl: 'Move cards and change dates freely.',
    },
    {
      id: 'insights',
      module: 'insights',
      stepNumber: '08',
      name: 'Insights',
      input: 'A performance CSV that you import.',
      whatHappens:
        'Charts and plain-language observations are calculated from your own data. Nothing is shown if the data cannot support it.',
      output: 'What to repeat and what to drop.',
      youStayInControl: 'Clear or replace the data at any time.',
    },
  ] as PipelineCardData[],
};

// Pure math & easing utilities
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

export function fract(x: number): number {
  return x - Math.floor(x);
}

// Drum rotation step function: 20% dwell on each card and smooth glide
export function drumStepFn(x: number): number {
  const f = Math.floor(x);
  const fr = fract(x);
  const glide = easeInOutCubic(clamp((fr - 0.2) / 0.6, 0, 1));
  return f + glide;
}
