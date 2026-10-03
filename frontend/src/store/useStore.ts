import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Asset,
  Folder,
  ScriptData,
  ScriptLineMatch,
  FootageSegment,
  ClipItem,
  EditorLayer,
  AiSuggestion,
  EditorHistoryItem,
  PlatformVariant,
  WorkflowCard,
  WorkflowColumn,
  PerformanceRecord,
} from '../types';
import { SAMPLE_INSIGHTS_RECORDS } from '../services/mockAiService';
import { PLATFORM_SPECS } from '../config/platforms';

interface AppState {
  // Assets slice
  assets: Asset[];
  folders: Folder[];
  selectedAssetId: string | null;
  deletedAssetBackup: Asset | null;
  addAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  undoDeleteAsset: () => void;
  updateAssetTags: (id: string, tags: string[]) => void;
  renameAsset: (id: string, newName: string) => void;
  moveAssetToFolder: (assetId: string, folderId: string | undefined) => void;
  createFolder: (name: string) => void;
  deleteFolder: (folderId: string) => void;
  setSelectedAssetId: (id: string | null) => void;
  loadSampleAssets: () => void;
  clearSampleAssets: () => void;

  // Scripts slice
  script: ScriptData;
  setScriptField: <K extends keyof ScriptData>(field: K, value: ScriptData[K]) => void;
  pinHook: (hookId: string) => void;
  updateHookText: (hookId: string, newText: string) => void;
  updateSection: (sectionId: string, content: string) => void;
  reorderSections: (newSections: ScriptData['sections']) => void;

  // Footage slice
  footageSegments: FootageSegment[];
  scriptLineMatches: ScriptLineMatch[];
  setScriptLineMatches: (matches: ScriptLineMatch[]) => void;
  reassignMatch: (lineId: string, segmentId: string) => void;

  // Clips slice
  clips: ClipItem[];
  setClips: (clips: ClipItem[]) => void;
  updateClipTimes: (clipId: string, startTime: number, endTime: number) => void;
  acceptClip: (clipId: string) => void;
  rejectClip: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;

  // Editor slice
  activeClipId: string | null;
  editorLayers: EditorLayer[];
  aiSuggestions: AiSuggestion[];
  editorHistory: EditorHistoryItem[];
  setActiveClipId: (clipId: string | null) => void;
  applyAiSuggestion: (suggestionId: string) => void;
  dismissAiSuggestion: (suggestionId: string) => void;
  convertLayerToManual: (layerId: string) => void;
  updateLayerContent: (layerId: string, content: string) => void;
  revertHistoryItem: (historyId: string) => void;

  // Platforms slice
  selectedPlatformId: string;
  platformVariants: Record<string, PlatformVariant>;
  setSelectedPlatformId: (platformId: string) => void;
  updatePlatformVariant: (platformId: string, updates: Partial<PlatformVariant>) => void;
  queueVariantToWorkflow: (platformId: string) => void;

  // Workflow slice
  workflowCards: WorkflowCard[];
  moveWorkflowCard: (cardId: string, targetColumn: WorkflowColumn) => void;
  addWorkflowCard: (title: string, column: WorkflowColumn, platform: string) => void;
  updateWorkflowCard: (cardId: string, updates: Partial<WorkflowCard>) => void;
  deleteWorkflowCard: (cardId: string) => void;

  // Insights slice
  insightsRecords: PerformanceRecord[];
  isSampleInsights: boolean;
  loadSampleInsights: () => void;
  clearInsightsData: () => void;
  importInsightsData: (records: PerformanceRecord[]) => void;

  // Global reset
  resetAllData: () => void;

  // Backend state
  backendProjectId: number | null;
  setBackendProjectId: (id: number) => void;
  backendJobId: number | null;
  setBackendJobId: (id: number | null) => void;
  jobStatus: string | null;
  jobProgress: number;
  setJobState: (status: string, progress: number) => void;
}

const INITIAL_FOLDERS: Folder[] = [
  { id: 'f_raw', name: 'Raw Footage' },
  { id: 'f_broll', name: 'B-Roll Shots' },
  { id: 'f_audio', name: 'Audio Tracks' },
];

const INITIAL_SCRIPT: ScriptData = {
  topic: 'Content Production Bottlenecks',
  audience: 'Independent Video Creators',
  tone: 'Direct',
  platform: 'YouTube Shorts',
  targetLength: '45 seconds',
  hooks: [
    {
      id: 'hk_1',
      text: 'Why do most video creators spend 14 hours editing a single 60-second video?',
      technique: 'question',
      isPinned: true,
    },
    {
      id: 'hk_2',
      text: 'Editing raw footage used to take four apps. Now it happens in one timeline.',
      technique: 'contrast',
    },
    {
      id: 'hk_3',
      text: '3 steps to turn one script into five platform-ready clips without manual re-exporting.',
      technique: 'number',
    },
  ],
  pinnedHookId: 'hk_1',
  sections: [
    {
      id: 'sec_1',
      type: 'Hook',
      content: 'Why do most video creators spend 14 hours editing a single 60-second video?',
    },
    {
      id: 'sec_2',
      type: 'Body',
      content: 'Your script already contains the cut points for your video. When you map spoken sentences to video segments, you eliminate manual scrub work. Each section becomes a clean candidate clip.',
    },
    {
      id: 'sec_3',
      type: 'Call to action',
      content: 'Follow this process on your next shoot and keep every cut editable in your timeline.',
    },
  ],
  supportingContent: {
    titles: [
      'Stop Spending 14 Hours per Video: Content Operations Guide',
      'How to Map Scripts to Video Cuts in One Workspace',
    ],
    description: 'Walkthrough of modern creator operations: script to cut timeline.',
    tags: ['creators', 'videoediting', 'production', 'timeline'],
  },
};

const INITIAL_SEGMENTS: FootageSegment[] = [
  {
    id: 'seg_1',
    startTime: 2.1,
    endTime: 9.4,
    label: 'Hook delivery: Why do creators spend 14 hours',
    transcript: 'Why do most video creators spend 14 hours editing a single 60-second video?',
    matchedLineId: 'line_0',
  },
  {
    id: 'seg_2',
    startTime: 10.2,
    endTime: 21.0,
    label: 'Script mapping demonstration at monitor',
    transcript: 'Your script already contains the cut points for your video.',
    matchedLineId: 'line_1',
  },
  {
    id: 'seg_3',
    startTime: 21.5,
    endTime: 36.8,
    label: 'Timeline scrub and cut visualization',
    transcript: 'When you map spoken sentences to video segments, you eliminate manual scrub work.',
    matchedLineId: 'line_2',
  },
  {
    id: 'seg_4',
    startTime: 37.2,
    endTime: 44.0,
    label: 'Call to action wrap-up looking into camera',
    transcript: 'Follow this process on your next shoot and keep every cut editable in your timeline.',
    matchedLineId: 'line_3',
  },
];

const INITIAL_MATCHES: ScriptLineMatch[] = [
  {
    lineId: 'line_0',
    text: 'Why do most video creators spend 14 hours editing a single 60-second video?',
    segmentId: 'seg_1',
    status: 'matched',
  },
  {
    lineId: 'line_1',
    text: 'Your script already contains the cut points for your video.',
    segmentId: 'seg_2',
    status: 'matched',
  },
  {
    lineId: 'line_2',
    text: 'When you map spoken sentences to video segments, you eliminate manual scrub work.',
    segmentId: 'seg_3',
    status: 'weak',
  },
  {
    lineId: 'line_3',
    text: 'Follow this process on your next shoot and keep every cut editable in your timeline.',
    segmentId: 'seg_4',
    status: 'matched',
  },
  {
    lineId: 'line_4',
    text: 'Subscribe for the next studio walkthrough and gear breakdown.',
    status: 'missing',
  },
];

const INITIAL_EDITOR_LAYERS: EditorLayer[] = [
  {
    id: 'lyr_v1',
    trackId: 'Video',
    title: 'A-Roll Talking Head Main',
    startTime: 0,
    duration: 32.4,
    isAiGenerated: false,
    content: 'raw_take_cut_01',
  },
  {
    id: 'lyr_c1',
    trackId: 'Captions',
    title: 'Word-Synced Captions',
    startTime: 0.5,
    duration: 31.0,
    isAiGenerated: true,
    aiSuggestionType: 'add_captions',
    content: 'Why do most video creators spend 14 hours editing a single video?',
  },
  {
    id: 'lyr_a1',
    trackId: 'Audio',
    title: 'Dialogue Leveled -14 LUFS',
    startTime: 0,
    duration: 32.4,
    isAiGenerated: true,
    aiSuggestionType: 'normalize_audio',
    content: 'Voice Track Cleaned',
  },
  {
    id: 'lyr_o1',
    trackId: 'Overlays',
    title: 'Hook Title Card',
    startTime: 0,
    duration: 2.8,
    isAiGenerated: true,
    aiSuggestionType: 'hook_title',
    content: 'THE 14-HOUR BOTTLENECK',
  },
];

const INITIAL_VARIANTS: Record<string, PlatformVariant> = Object.keys(PLATFORM_SPECS).reduce((acc, key) => {
  acc[key] = {
    platformId: key,
    title: 'From Script to Cut Video: Content Operations',
    caption: 'How to map your script directly to video cuts without hours of scrubbing.',
    hashtags: PLATFORM_SPECS[key].defaultHashtags,
    cropX: 50,
    cropY: 50,
    cropScale: 1,
    isQueued: key === 'youtube_shorts',
  };
  return acc;
}, {} as Record<string, PlatformVariant>);

const INITIAL_WORKFLOW_CARDS: WorkflowCard[] = [
  {
    id: 'wf_1',
    title: 'The 14-Hour Bottleneck',
    column: 'Scheduled',
    platform: 'YouTube Shorts',
    dueDate: '2026-10-08',
    checklist: [
      { id: 'c1', text: 'Review caption spelling', done: true },
      { id: 'c2', text: 'Verify 9:16 safe margins', done: true },
      { id: 'c3', text: 'Confirm thumbnail frame', done: true },
    ],
    notes: 'Scheduled for 11:00 AM EST peak creator window.',
    relatedType: 'clip',
    activityLog: [
      { id: 'a1', action: 'Clip generated from master footage', date: '2026-10-01' },
      { id: 'a2', action: 'Exported from Editor to Platforms', date: '2026-10-02' },
      { id: 'a3', action: 'Scheduled in calendar', date: '2026-10-03' },
    ],
  },
  {
    id: 'wf_2',
    title: 'Transcript Alignment Demo',
    column: 'Edit',
    platform: 'Instagram Reels',
    dueDate: '2026-10-10',
    checklist: [
      { id: 'c4', text: 'Detached AI captions for custom styling', done: true },
      { id: 'c5', text: 'Adjust end trim handle', done: false },
    ],
    notes: 'Working in editor with converted manual layers.',
    relatedType: 'editor',
    activityLog: [
      { id: 'a4', action: 'Created from script section', date: '2026-10-02' },
      { id: 'a5', action: 'Opened in Editor', date: '2026-10-03' },
    ],
  },
  {
    id: 'wf_3',
    title: 'Safe Zone Margin Checklist',
    column: 'Record',
    platform: 'TikTok',
    dueDate: '2026-10-14',
    checklist: [
      { id: 'c6', text: 'Record screen screencast of UI margins', done: false },
    ],
    notes: 'B-roll footage planned for recording studio.',
    relatedType: 'script',
    activityLog: [
      { id: 'a6', action: 'Script draft approved', date: '2026-10-03' },
    ],
  },
  {
    id: 'wf_4',
    title: 'One Timeline Studio Workflow',
    column: 'Published',
    platform: 'LinkedIn',
    dueDate: '2026-09-28',
    checklist: [
      { id: 'c7', text: 'Publish post with video', done: true },
    ],
    notes: 'Live on LinkedIn profile. Performing well with creators.',
    relatedType: 'clip',
    activityLog: [
      { id: 'a7', action: 'Published to LinkedIn', date: '2026-09-28' },
    ],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Assets
      assets: [],
      folders: INITIAL_FOLDERS,
      selectedAssetId: null,
      deletedAssetBackup: null,
      
      backendProjectId: null,
      setBackendProjectId: (id) => set({ backendProjectId: id }),
      backendJobId: null,
      setBackendJobId: (id) => set({ backendJobId: id }),
      jobStatus: null,
      jobProgress: 0,
      setJobState: (status, progress) => set({ jobStatus: status, jobProgress: progress }),

      addAsset: (asset) =>
        set((state) => ({ assets: [asset, ...state.assets] })),

      deleteAsset: (id) =>
        set((state) => {
          const target = state.assets.find((a) => a.id === id);
          return {
            assets: state.assets.filter((a) => a.id !== id),
            deletedAssetBackup: target || null,
          };
        }),

      undoDeleteAsset: () =>
        set((state) => {
          if (!state.deletedAssetBackup) return state;
          return {
            assets: [state.deletedAssetBackup, ...state.assets],
            deletedAssetBackup: null,
          };
        }),

      updateAssetTags: (id, tags) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, tags } : a)),
        })),

      renameAsset: (id, newName) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, name: newName } : a)),
        })),

      moveAssetToFolder: (assetId, folderId) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId ? { ...a, folderId } : a
          ),
        })),

      createFolder: (name) =>
        set((state) => ({
          folders: [
            ...state.folders,
            { id: `folder_${Date.now()}`, name: name.trim() },
          ],
        })),

      deleteFolder: (folderId) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          assets: state.assets.map((a) =>
            a.folderId === folderId ? { ...a, folderId: undefined } : a
          ),
        })),

      setSelectedAssetId: (id) => set({ selectedAssetId: id }),

      loadSampleAssets: () => {
        const sampleAssets: Asset[] = [
          {
            id: 'sample_asset_1',
            name: 'interview_raw_01.mp4',
            type: 'video',
            size: 428000000,
            duration: 184,
            resolution: '1920x1080',
            url: '',
            folderId: 'f_raw',
            tags: ['A-Roll', 'Main Interview', '4K'],
            createdAt: '2026-10-02',
            isSample: true,
          },
          {
            id: 'sample_asset_2',
            name: 'broll_timeline_scrub_02.mp4',
            type: 'video',
            size: 145000000,
            duration: 52,
            resolution: '1920x1080',
            url: '',
            folderId: 'f_broll',
            tags: ['B-Roll', 'Screen Recording'],
            createdAt: '2026-10-02',
            isSample: true,
          },
          {
            id: 'sample_asset_3',
            name: 'voiceover_take_02.wav',
            type: 'audio',
            size: 38000000,
            duration: 76,
            url: '',
            folderId: 'f_audio',
            tags: ['Clean Voice', 'Dialogue'],
            createdAt: '2026-10-03',
            isSample: true,
          },
          {
            id: 'sample_asset_4',
            name: 'title_card_reference.png',
            type: 'image',
            size: 3400000,
            resolution: '1920x1080',
            url: '',
            folderId: undefined,
            tags: ['Graphic', 'Title'],
            createdAt: '2026-10-03',
            isSample: true,
          },
        ];
        set({
          assets: sampleAssets,
          selectedAssetId: 'sample_asset_1',
          footageSegments: INITIAL_SEGMENTS,
          scriptLineMatches: INITIAL_MATCHES,
        });
      },

      clearSampleAssets: () =>
        set((state) => ({
          assets: state.assets.filter((a) => !a.isSample),
          selectedAssetId: null,
        })),

      // Scripts
      script: INITIAL_SCRIPT,

      setScriptField: (field, value) =>
        set((state) => ({
          script: { ...state.script, [field]: value },
        })),

      pinHook: (hookId) =>
        set((state) => {
          const selected = state.script.hooks.find((h) => h.id === hookId);
          const updatedHooks = state.script.hooks.map((h) => ({
            ...h,
            isPinned: h.id === hookId,
          }));
          const updatedSections = state.script.sections.map((s) =>
            s.type === 'Hook' && selected ? { ...s, content: selected.text } : s
          );
          return {
            script: {
              ...state.script,
              pinnedHookId: hookId,
              hooks: updatedHooks,
              sections: updatedSections,
            },
          };
        }),

      updateHookText: (hookId, newText) =>
        set((state) => ({
          script: {
            ...state.script,
            hooks: state.script.hooks.map((h) =>
              h.id === hookId ? { ...h, text: newText } : h
            ),
          },
        })),

      updateSection: (sectionId, content) =>
        set((state) => ({
          script: {
            ...state.script,
            sections: state.script.sections.map((s) =>
              s.id === sectionId ? { ...s, content } : s
            ),
          },
        })),

      reorderSections: (newSections) =>
        set((state) => ({
          script: { ...state.script, sections: newSections },
        })),

      // Footage
      footageSegments: INITIAL_SEGMENTS,
      scriptLineMatches: INITIAL_MATCHES,

      setScriptLineMatches: (matches) => set({ scriptLineMatches: matches }),

      reassignMatch: (lineId, segmentId) =>
        set((state) => ({
          scriptLineMatches: state.scriptLineMatches.map((m) =>
            m.lineId === lineId
              ? { ...m, segmentId, status: 'matched' }
              : m
          ),
        })),

      // Clips
      clips: [
        {
          id: 'clip_01',
          title: 'The 14-Hour Bottleneck',
          sourceAssetId: 'sample_asset_1',
          startTime: 12.4,
          endTime: 44.8,
          duration: 32.4,
          reason: 'Spoken emphasis spike and fast explanation of the editing bottleneck.',
          suggestedHook: 'Why do most video creators spend 14 hours editing a single 60-second video?',
          status: 'accepted',
          aspectRatio: '9:16',
        },
        {
          id: 'clip_02',
          title: 'Transcript Alignment Demo',
          sourceAssetId: 'sample_asset_1',
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
          sourceAssetId: 'sample_asset_1',
          startTime: 122.2,
          endTime: 164.0,
          duration: 41.8,
          reason: 'Structured checklist of safe zone margins across Shorts and TikTok.',
          suggestedHook: '3 steps to turn one script into five platform-ready clips without manual re-exporting.',
          status: 'candidate',
          aspectRatio: '9:16',
        },
      ],

      setClips: (clips) => set({ clips }),

      updateClipTimes: (clipId, startTime, endTime) =>
        set((state) => ({
          clips: state.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  startTime,
                  endTime,
                  duration: Math.max(1, Math.round((endTime - startTime) * 10) / 10),
                }
              : c
          ),
        })),

      acceptClip: (clipId) =>
        set((state) => ({
          clips: state.clips.map((c) =>
            c.id === clipId ? { ...c, status: 'accepted' } : c
          ),
          activeClipId: clipId,
        })),

      rejectClip: (clipId) =>
        set((state) => ({
          clips: state.clips.map((c) =>
            c.id === clipId ? { ...c, status: 'rejected' } : c
          ),
        })),

      duplicateClip: (clipId) =>
        set((state) => {
          const target = state.clips.find((c) => c.id === clipId);
          if (!target) return state;
          const clone: ClipItem = {
            ...target,
            id: `clip_${Date.now()}`,
            title: `${target.title} (Copy)`,
            status: 'candidate',
          };
          return { clips: [...state.clips, clone] };
        }),

      // Editor
      activeClipId: 'clip_01',
      editorLayers: INITIAL_EDITOR_LAYERS,
      aiSuggestions: [
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
          applied: true,
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
          applied: true,
        },
        {
          id: 'sugg_5',
          title: 'Normalize dialogue loudness',
          description: 'Levels dialogue peaks to minus 14 LUFS target.',
          type: 'normalize_audio',
          applied: true,
        },
      ],
      editorHistory: [
        { id: 'h1', action: 'Applied AI suggestion: Normalize dialogue loudness', author: 'AI', timestamp: '14:20' },
        { id: 'h2', action: 'Applied AI suggestion: Add opening title card', author: 'AI', timestamp: '14:22' },
        { id: 'h3', action: 'Adjusted in-point by minus 0.8 seconds', author: 'You', timestamp: '14:25' },
      ],

      setActiveClipId: (clipId) => set({ activeClipId: clipId }),

      applyAiSuggestion: (suggestionId) =>
        set((state) => {
          const sugg = state.aiSuggestions.find((s) => s.id === suggestionId);
          if (!sugg || sugg.applied) return state;

          const newLayer: EditorLayer = {
            id: `lyr_${Date.now()}`,
            trackId: sugg.type === 'hook_title' ? 'Overlays' : sugg.type === 'normalize_audio' ? 'Audio' : sugg.type === 'add_captions' ? 'Captions' : 'Video',
            title: sugg.title,
            startTime: 0,
            duration: 10,
            isAiGenerated: true,
            aiSuggestionType: sugg.type,
            content: sugg.description,
          };

          return {
            aiSuggestions: state.aiSuggestions.map((s) =>
              s.id === suggestionId ? { ...s, applied: true } : s
            ),
            editorLayers: [...state.editorLayers, newLayer],
            editorHistory: [
              {
                id: `h_${Date.now()}`,
                action: `Applied AI suggestion: ${sugg.title}`,
                author: 'AI',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
              ...state.editorHistory,
            ],
          };
        }),

      dismissAiSuggestion: (suggestionId) =>
        set((state) => ({
          aiSuggestions: state.aiSuggestions.filter((s) => s.id !== suggestionId),
        })),

      convertLayerToManual: (layerId) =>
        set((state) => ({
          editorLayers: state.editorLayers.map((l) =>
            l.id === layerId ? { ...l, isAiGenerated: false } : l
          ),
          editorHistory: [
            {
              id: `h_${Date.now()}`,
              action: 'Converted AI layer to manual',
              author: 'You',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...state.editorHistory,
          ],
        })),

      updateLayerContent: (layerId, content) =>
        set((state) => ({
          editorLayers: state.editorLayers.map((l) =>
            l.id === layerId ? { ...l, content } : l
          ),
          editorHistory: [
            {
              id: `h_${Date.now()}`,
              action: 'Edited layer text in place',
              author: 'You',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...state.editorHistory,
          ],
        })),

      revertHistoryItem: (historyId) =>
        set((state) => ({
          editorHistory: state.editorHistory.filter((h) => h.id !== historyId),
        })),

      // Platforms
      selectedPlatformId: 'youtube_shorts',
      platformVariants: INITIAL_VARIANTS,

      setSelectedPlatformId: (platformId) => set({ selectedPlatformId: platformId }),

      updatePlatformVariant: (platformId, updates) =>
        set((state) => ({
          platformVariants: {
            ...state.platformVariants,
            [platformId]: {
              ...state.platformVariants[platformId],
              ...updates,
            },
          },
        })),

      queueVariantToWorkflow: (platformId) =>
        set((state) => {
          const variant = state.platformVariants[platformId];
          const spec = PLATFORM_SPECS[platformId];
          const newCard: WorkflowCard = {
            id: `wf_${Date.now()}`,
            title: variant.title,
            column: 'Scheduled',
            platform: spec?.name || platformId,
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            checklist: [
              { id: 'c1', text: 'Verify aspect ratio', done: true },
              { id: 'c2', text: 'Confirm final audio mix', done: true },
            ],
            notes: `Queued from Platforms page. Caption: "${variant.caption.slice(0, 40)}..."`,
            relatedType: 'clip',
            activityLog: [
              {
                id: `act_${Date.now()}`,
                action: `Variant queued for ${spec?.name || platformId}`,
                date: new Date().toISOString().split('T')[0],
              },
            ],
          };

          return {
            platformVariants: {
              ...state.platformVariants,
              [platformId]: { ...variant, isQueued: true },
            },
            workflowCards: [newCard, ...state.workflowCards],
          };
        }),

      // Workflow
      workflowCards: INITIAL_WORKFLOW_CARDS,

      moveWorkflowCard: (cardId, targetColumn) =>
        set((state) => ({
          workflowCards: state.workflowCards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  column: targetColumn,
                  activityLog: [
                    {
                      id: `act_${Date.now()}`,
                      action: `Moved card to ${targetColumn}`,
                      date: new Date().toISOString().split('T')[0],
                    },
                    ...c.activityLog,
                  ],
                }
              : c
          ),
        })),

      addWorkflowCard: (title, column, platform) =>
        set((state) => ({
          workflowCards: [
            {
              id: `wf_${Date.now()}`,
              title: title.trim() || 'Untitled Content Piece',
              column,
              platform: platform || 'YouTube Shorts',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              checklist: [
                { id: 'c1', text: 'Outline key points', done: false },
                { id: 'c2', text: 'Record talking track', done: false },
              ],
              notes: 'Added from workflow board.',
              activityLog: [
                {
                  id: `act_${Date.now()}`,
                  action: `Created in ${column}`,
                  date: new Date().toISOString().split('T')[0],
                },
              ],
            },
            ...state.workflowCards,
          ],
        })),

      updateWorkflowCard: (cardId, updates) =>
        set((state) => ({
          workflowCards: state.workflowCards.map((c) =>
            c.id === cardId ? { ...c, ...updates } : c
          ),
        })),

      deleteWorkflowCard: (cardId) =>
        set((state) => ({
          workflowCards: state.workflowCards.filter((c) => c.id !== cardId),
        })),

      // Insights
      insightsRecords: [],
      isSampleInsights: false,

      loadSampleInsights: () =>
        set({
          insightsRecords: SAMPLE_INSIGHTS_RECORDS,
          isSampleInsights: true,
        }),

      clearInsightsData: () =>
        set({
          insightsRecords: [],
          isSampleInsights: false,
        }),

      importInsightsData: (records) =>
        set({
          insightsRecords: records,
          isSampleInsights: false,
        }),

      // Global Reset
      resetAllData: () => {
        try {
          localStorage.removeItem('creatorai_demo_state');
        } catch {
          // ignore
        }
        set({
          assets: [],
          folders: INITIAL_FOLDERS,
          selectedAssetId: null,
          deletedAssetBackup: null,
          script: INITIAL_SCRIPT,
          footageSegments: INITIAL_SEGMENTS,
          scriptLineMatches: INITIAL_MATCHES,
          clips: [],
          activeClipId: null,
          editorLayers: INITIAL_EDITOR_LAYERS,
          editorHistory: [],
          platformVariants: INITIAL_VARIANTS,
          workflowCards: INITIAL_WORKFLOW_CARDS,
          insightsRecords: [],
          isSampleInsights: false,
        });
      },
    }),
    {
      name: 'creatorai_demo_state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
