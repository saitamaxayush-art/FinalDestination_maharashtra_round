export type AssetType = 'video' | 'audio' | 'image';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: number;
  duration?: number;
  resolution?: string;
  url: string;
  folderId?: string;
  tags: string[];
  createdAt: string;
  isSample?: boolean;
  thumbnail?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export type HookTechnique = 'question' | 'contrast' | 'number' | 'story' | 'direct claim';

export interface HookVariant {
  id: string;
  text: string;
  technique: HookTechnique;
  isPinned?: boolean;
}

export interface ScriptSection {
  id: string;
  type: 'Hook' | 'Body' | 'Call to action';
  content: string;
}

export interface ScriptData {
  topic: string;
  audience: string;
  tone: 'Direct' | 'Casual' | 'Technical' | 'Energetic';
  platform: string;
  targetLength: string;
  hooks: HookVariant[];
  pinnedHookId?: string;
  sections: ScriptSection[];
  supportingContent?: {
    titles: string[];
    description: string;
    tags: string[];
  };
}

export type MatchStatus = 'matched' | 'weak' | 'missing';

export interface ScriptLineMatch {
  lineId: string;
  text: string;
  segmentId?: string;
  status: MatchStatus;
}

export interface FootageSegment {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  transcript: string;
  matchedLineId?: string;
}

export interface ClipItem {
  id: string;
  title: string;
  sourceAssetId: string;
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
  suggestedHook?: string;
  status: 'candidate' | 'accepted' | 'rejected';
  aspectRatio: string;
}

export type TrackType = 'Video' | 'Captions' | 'Audio' | 'Overlays';

export interface EditorLayer {
  id: string;
  trackId: TrackType;
  title: string;
  startTime: number;
  duration: number;
  isAiGenerated: boolean;
  aiSuggestionType?: string;
  content: string;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'remove_silences' | 'add_captions' | 'punch_in' | 'hook_title' | 'normalize_audio';
  applied: boolean;
}

export interface EditorHistoryItem {
  id: string;
  action: string;
  author: 'AI' | 'You';
  timestamp: string;
}

export interface PlatformVariant {
  platformId: string;
  title: string;
  caption: string;
  hashtags: string[];
  cropX: number;
  cropY: number;
  cropScale: number;
  isQueued: boolean;
}

export type WorkflowColumn =
  | 'Idea'
  | 'Script'
  | 'Record'
  | 'Edit'
  | 'Review'
  | 'Scheduled'
  | 'Published';

export interface WorkflowCard {
  id: string;
  title: string;
  column: WorkflowColumn;
  platform: string;
  dueDate: string;
  checklist: { id: string; text: string; done: boolean }[];
  notes: string;
  relatedType?: 'script' | 'clip' | 'editor';
  activityLog: { id: string; action: string; date: string }[];
}

export interface PerformanceRecord {
  id: string;
  date: string;
  title: string;
  platform: string;
  hookTechnique: HookTechnique;
  durationSeconds: number;
  views: number;
}
