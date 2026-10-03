/**
 * Platform specifications and safe zone configurations.
 * 
 * DEVELOPER NOTICE:
 * Platform specifications, including maximum duration, character limits,
 * and safe zone margins, change frequently over time.
 * Verify these values against each platform's official developer and creator
 * documentation before relying on them in production deployments.
 */

export interface PlatformSpec {
  id: string;
  name: string;
  aspectRatioLabel: string;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
  maxDurationSeconds: number;
  maxCaptionLength: number;
  safeZones: {
    topPercent: number;
    bottomPercent: number;
    leftPercent: number;
    rightPercent: number;
    comment: string;
  };
  defaultHashtags: string[];
}

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  youtube_shorts: {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    aspectRatioLabel: '9:16',
    aspectRatioWidth: 9,
    aspectRatioHeight: 16,
    maxDurationSeconds: 180,
    maxCaptionLength: 100,
    safeZones: {
      topPercent: 8,
      bottomPercent: 24,
      leftPercent: 5,
      rightPercent: 18,
      comment: 'Right side controls and bottom title overlay',
    },
    defaultHashtags: ['#Shorts', '#CreatorOps', '#VideoProduction'],
  },
  instagram_reels: {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    aspectRatioLabel: '9:16',
    aspectRatioWidth: 9,
    aspectRatioHeight: 16,
    maxDurationSeconds: 90,
    maxCaptionLength: 2200,
    safeZones: {
      topPercent: 10,
      bottomPercent: 22,
      leftPercent: 6,
      rightPercent: 16,
      comment: 'Audio icon top right, caption and like drawer at bottom',
    },
    defaultHashtags: ['#reels', '#contentcreator', '#videoedit'],
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatioLabel: '9:16',
    aspectRatioWidth: 9,
    aspectRatioHeight: 16,
    maxDurationSeconds: 600,
    maxCaptionLength: 4000,
    safeZones: {
      topPercent: 12,
      bottomPercent: 25,
      leftPercent: 6,
      rightPercent: 18,
      comment: 'Bottom caption area and right interactive action bar',
    },
    defaultHashtags: ['#fyp', '#creators', '#workflow'],
  },
  linkedin_video: {
    id: 'linkedin_video',
    name: 'LinkedIn',
    aspectRatioLabel: '1:1',
    aspectRatioWidth: 1,
    aspectRatioHeight: 1,
    maxDurationSeconds: 600,
    maxCaptionLength: 3000,
    safeZones: {
      topPercent: 6,
      bottomPercent: 10,
      leftPercent: 6,
      rightPercent: 6,
      comment: 'Square format centered, standard player controls at bottom',
    },
    defaultHashtags: ['#operations', '#contentstrategy', '#productivity'],
  },
  youtube_longform: {
    id: 'youtube_longform',
    name: 'YouTube Long-form',
    aspectRatioLabel: '16:9',
    aspectRatioWidth: 16,
    aspectRatioHeight: 9,
    maxDurationSeconds: 43200,
    maxCaptionLength: 5000,
    safeZones: {
      topPercent: 5,
      bottomPercent: 12,
      leftPercent: 5,
      rightPercent: 5,
      comment: '16:9 landscape canvas with standard bottom scrubber overlay',
    },
    defaultHashtags: ['#DeepDive', '#Tutorial', '#ProductionPipeline'],
  },
};
