import {
  HookVariant,
  ScriptSection,
  ScriptLineMatch,
  ClipItem,
  AiSuggestion,
  PlatformVariant,
  PerformanceRecord,
} from '../types';

/**
 * Simulates a realistic network delay for async operations.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Service function: generateHooks
 * Simulates an API endpoint that generates hook variants based on topic and audience.
 * 
 * JSDoc API Contract:
 * POST /api/v1/scripts/generate-hooks
 * Request: { topic: string, audience: string, tone: string }
 * Response: { variants: Array<{ id: string, text: string, technique: HookTechnique }> }
 */
export async function generateHooks(
  topic: string,
  audience: string,
  _tone: string
): Promise<HookVariant[]> {
  await delay(600);

  const cleanTopic = topic.trim() || 'Content Production Workflow';
  const cleanAudience = audience.trim() || 'Video Creators';

  return [
    {
      id: 'hook_1',
      text: `Why do most ${cleanAudience.toLowerCase()} spend 14 hours editing a single 60-second video?`,
      technique: 'question',
    },
    {
      id: 'hook_2',
      text: `Editing raw footage used to take four apps. Now it happens in one timeline.`,
      technique: 'contrast',
    },
    {
      id: 'hook_3',
      text: `3 steps to turn one script into five platform-ready clips without manual re-exporting.`,
      technique: 'number',
    },
    {
      id: 'hook_4',
      text: `Last month I threw out my entire editing workflow for ${cleanTopic.toLowerCase()}. Here is what replaced it.`,
      technique: 'story',
    },
    {
      id: 'hook_5',
      text: `Your script already contains the cut points for your video. You just need to map them.`,
      technique: 'direct claim',
    },
    {
      id: 'hook_6',
      text: `If you are still scrubbing through hours of raw b-roll by eye, stop doing that.`,
      technique: 'question',
    },
  ];
}

/**
 * Service function: generateScript
 * Simulates an API endpoint that formats full script sections and supporting assets.
 * 
 * JSDoc API Contract:
 * POST /api/v1/scripts/builder
 * Request: { topic: string, hookText: string, tone: string }
 * Response: {
 *   sections: Array<{ id: string, type: 'Hook' | 'Body' | 'Call to action', content: string }>,
 *   supportingContent: { titles: string[], description: string, tags: string[] }
 * }
 */
export async function generateScript(
  topic: string,
  hookText: string,
  _tone: string
): Promise<{
  sections: ScriptSection[];
  supportingContent: { titles: string[]; description: string; tags: string[] };
}> {
  await delay(700);

  const cleanTopic = topic.trim() || 'Content Operations';

  return {
    sections: [
      {
        id: 'sec_1',
        type: 'Hook',
        content: hookText || 'Your script already contains the cut points for your video.',
      },
      {
        id: 'sec_2',
        type: 'Body',
        content: `Start by recording your talk track with standard audio levels. Once imported, the transcript syncs directly with the visual track. You can verify every cut in the inspector before committing the edit.`,
      },
      {
        id: 'sec_3',
        type: 'Call to action',
        content: `Test this workflow on your next project and let me know your thoughts in the comments.`,
      },
    ],
    supportingContent: {
      titles: [
        `${cleanTopic}: Full Production Walkthrough`,
        `How to Map Scripts to Raw Footage Fast`,
        `Fix Your Editing Pipeline in 3 Steps`,
      ],
      description: `In this video we walk through script mapping, clip extraction, and multi-platform aspect ratio adaptation.`,
      tags: ['contentoperations', 'videoediting', 'creators', 'timeline', 'production'],
    },
  };
}

/**
 * Service function: matchScriptToFootage
 * Simulates audio/visual speech alignment between script lines and video timeline segments.
 * 
 * JSDoc API Contract:
 * POST /api/v1/footage/match
 * Request: { assetId: string, lines: Array<{ lineId: string, text: string }> }
 * Response: { matches: Array<{ lineId: string, segmentId?: string, status: 'matched' | 'weak' | 'missing' }> }
 */
export async function matchScriptToFootage(
  lines: string[]
): Promise<ScriptLineMatch[]> {
  await delay(800);

  return lines.map((text, idx) => {
    if (idx === 0) {
      return { lineId: `line_${idx}`, text, segmentId: 'seg_1', status: 'matched' };
    }
    if (idx === 1) {
      return { lineId: `line_${idx}`, text, segmentId: 'seg_2', status: 'matched' };
    }
    if (idx === 2) {
      return { lineId: `line_${idx}`, text, segmentId: 'seg_3', status: 'weak' };
    }
    if (idx === 3) {
      return { lineId: `line_${idx}`, text, segmentId: 'seg_4', status: 'matched' };
    }
    return { lineId: `line_${idx}`, text, status: 'missing' };
  });
}

/**
 * Service function: detectClips
 * Simulates extraction of short-form candidate clips from a master long-form video.
 * 
 * JSDoc API Contract:
 * POST /api/v1/clips/detect
 * Request: { assetId: string, minDuration: number, maxDuration: number }
 * Response: { clips: Array<ClipItem> }
 */
export async function detectClips(
  assetId: string,
  suggestedHook?: string
): Promise<ClipItem[]> {
  await delay(900);

  return [
    {
      id: 'clip_01',
      title: 'The 14-Hour Bottleneck',
      sourceAssetId: assetId,
      startTime: 12.4,
      endTime: 44.8,
      duration: 32.4,
      reason: 'Spoken emphasis spike and fast explanation of the editing bottleneck.',
      suggestedHook: suggestedHook || 'Why do most video creators spend 14 hours editing a single clip?',
      status: 'candidate',
      aspectRatio: '9:16',
    },
    {
      id: 'clip_02',
      title: 'Transcript Alignment Demo',
      sourceAssetId: assetId,
      startTime: 68.0,
      endTime: 98.5,
      duration: 30.5,
      reason: 'Clear visual demonstration of script line alignment to timeline segments.',
      suggestedHook: 'Your script already contains the cut points for your video.',
      status: 'candidate',
      aspectRatio: '9:16',
    },
    {
      id: 'clip_03',
      title: 'Platform Safe Zones Explained',
      sourceAssetId: assetId,
      startTime: 122.2,
      endTime: 164.0,
      duration: 41.8,
      reason: 'Structured checklist of safe zone margins across Shorts and TikTok.',
      suggestedHook: '3 steps to turn one script into five platform-ready clips.',
      status: 'candidate',
      aspectRatio: '9:16',
    },
  ];
}

/**
 * Service function: suggestEdits
 * Simulates intelligent timeline enhancements and suggestions for video projects.
 * 
 * JSDoc API Contract:
 * POST /api/v1/editor/suggest
 * Request: { clipId: string, tracks: TrackData }
 * Response: { suggestions: Array<AiSuggestion> }
 */
export async function suggestEdits(): Promise<AiSuggestion[]> {
  await delay(500);

  return [
    {
      id: 'sugg_1',
      title: 'Remove 3 silent pauses',
      description: 'Cuts 4.2 seconds of silence between speech sentences.',
      type: 'remove_silences',
      applied: false,
    },
    {
      id: 'sugg_2',
      title: 'Add synced animated captions',
      description: 'Creates word-by-word timed subtitle blocks on Captions track.',
      type: 'add_captions',
      applied: false,
    },
    {
      id: 'sugg_3',
      title: 'Punch-in zoom on key statement',
      description: 'Applies 1.15x scale keyframe at 00:08.5 to reinforce hook.',
      type: 'punch_in',
      applied: false,
    },
    {
      id: 'sugg_4',
      title: 'Add opening title card',
      description: 'Inserts clean typography title on Overlays track for 2.5s.',
      type: 'hook_title',
      applied: false,
    },
    {
      id: 'sugg_5',
      title: 'Normalize dialogue loudness',
      description: 'Levels dialogue peaks to minus 14 LUFS target.',
      type: 'normalize_audio',
      applied: false,
    },
  ];
}

/**
 * Service function: adaptForPlatform
 * Simulates multi-platform copy generation, hashtag selection, and frame reframing.
 * 
 * JSDoc API Contract:
 * POST /api/v1/platforms/adapt
 * Request: { clipTitle: string, platforms: string[] }
 * Response: { variants: Record<string, PlatformVariant> }
 */
export async function adaptForPlatform(
  clipTitle: string,
  platformId: string
): Promise<PlatformVariant> {
  await delay(500);

  const cleanTitle = clipTitle || 'Production Walkthrough';

  if (platformId === 'youtube_shorts') {
    return {
      platformId,
      title: `${cleanTitle} #Shorts`,
      caption: `How to map scripts directly to video cuts. Watch full process.`,
      hashtags: ['#Shorts', '#CreatorOps', '#VideoProduction'],
      cropX: 50,
      cropY: 50,
      cropScale: 1,
      isQueued: false,
    };
  }

  if (platformId === 'instagram_reels') {
    return {
      platformId,
      title: cleanTitle,
      caption: `We tested script-to-footage alignment on 10 raw video files. Here is what we found about saving production time. Details in bio.`,
      hashtags: ['#reels', '#contentcreator', '#videoedit', '#workflow'],
      cropX: 50,
      cropY: 50,
      cropScale: 1,
      isQueued: false,
    };
  }

  if (platformId === 'tiktok') {
    return {
      platformId,
      title: cleanTitle,
      caption: `Stop manual scrubbing through raw footage. Map script lines directly to visual cuts.`,
      hashtags: ['#fyp', '#creators', '#workflow', '#editing'],
      cropX: 50,
      cropY: 50,
      cropScale: 1,
      isQueued: false,
    };
  }

  if (platformId === 'linkedin_video') {
    return {
      platformId,
      title: `${cleanTitle}: Content Operations Case Study`,
      caption: `Efficient content operations require connecting text assets to video timelines. In this short demonstration, we review the three stages of semi-automated clip extraction.`,
      hashtags: ['#operations', '#contentstrategy', '#productivity'],
      cropX: 50,
      cropY: 50,
      cropScale: 1,
      isQueued: false,
    };
  }

  return {
    platformId: 'youtube_longform',
    title: `${cleanTitle}: Complete Step-by-Step Workflow`,
    caption: `Full breakdown of creator operations from script writing to multi-platform publishing. Chapters included below.`,
    hashtags: ['#DeepDive', '#Tutorial', '#ProductionPipeline'],
    cropX: 50,
    cropY: 50,
    cropScale: 1,
    isQueued: false,
  };
}

/**
 * Sample dataset for Insights page.
 */
export const SAMPLE_INSIGHTS_RECORDS: PerformanceRecord[] = [
  { id: 'rec_1', date: '2026-09-01', title: 'Why 14 hours per video', platform: 'YouTube Shorts', hookTechnique: 'question', durationSeconds: 28, views: 42100 },
  { id: 'rec_2', date: '2026-09-03', title: 'One timeline workflow', platform: 'TikTok', hookTechnique: 'contrast', durationSeconds: 24, views: 68400 },
  { id: 'rec_3', date: '2026-09-06', title: '3 steps to 5 clips', platform: 'Instagram Reels', hookTechnique: 'number', durationSeconds: 34, views: 31200 },
  { id: 'rec_4', date: '2026-09-10', title: 'Threw out my editing app', platform: 'TikTok', hookTechnique: 'story', durationSeconds: 42, views: 51800 },
  { id: 'rec_5', date: '2026-09-14', title: 'Your script has cut points', platform: 'LinkedIn', hookTechnique: 'direct claim', durationSeconds: 45, views: 18900 },
  { id: 'rec_6', date: '2026-09-18', title: 'Stop scrubbing raw b-roll', platform: 'YouTube Shorts', hookTechnique: 'question', durationSeconds: 22, views: 59300 },
  { id: 'rec_7', date: '2026-09-22', title: 'Audio peak leveling tutorial', platform: 'Instagram Reels', hookTechnique: 'number', durationSeconds: 31, views: 37400 },
  { id: 'rec_8', date: '2026-09-26', title: 'Safe zone margin guide', platform: 'YouTube Shorts', hookTechnique: 'direct claim', durationSeconds: 26, views: 44800 },
];
