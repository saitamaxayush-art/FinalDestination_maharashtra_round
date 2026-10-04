import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/shared/PageShell';
import { VideoPlayer } from '../components/shared/VideoPlayer';
import { useStore } from '../store/useStore';
import { detectClips } from '../services/mockAiService';
import {
  Scissors,
  Check,
  X,
  Copy,
  Play,
  Sparkles,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export const ClipsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    script,
    clips,
    assets,
    setClips,
    updateClipTimes,
    acceptClip,
    rejectClip,
    duplicateClip,
    selectedAssetId,
  } = useStore();

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStep, setDetectionStep] = useState<string>('');
  const [playheadTime, setPlayheadTime] = useState<number>(24.0);

  // Staged progress detection
  const handleFindClips = async () => {
    setIsDetecting(true);
    setDetectionStep('Reading audio transcript...');
    await new Promise((r) => setTimeout(r, 600));

    setDetectionStep('Scoring spoken emphasis and hook alignment...');
    await new Promise((r) => setTimeout(r, 700));

    setDetectionStep('Cutting candidate short-form boundaries...');
    const pinnedHook = script.hooks.find((h) => h.id === script.pinnedHookId);
    const newClips = await detectClips(selectedAssetId || assets[0]?.id || 'sample_asset_1', pinnedHook?.text);

    setClips(newClips);
    setIsDetecting(false);
    setDetectionStep('');
  };

  const acceptedCount = clips.filter((c) => c.status === 'accepted').length;

  return (
    <PageShell
      title="Automated Clip Generation"
      description="Long-form source → candidate moments → accepted clip → open in Editor. Extract high-retention 9:16 vertical cuts from long-form footage with trim boundary controls."
      stepNumber={4}
      nextPageTitle="Editor"
      nextPagePath="/editor"
      nextPageCtaLabel="Open Accepted Clip in Editor"
      carryOverText={`${acceptedCount} accepted clips ready to open in the multi-track timeline Editor.`}
      actions={
        <button
          type="button"
          onClick={handleFindClips}
          disabled={isDetecting}
          className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDetecting ? detectionStep : 'Find clips'}</span>
        </button>
      }
    >
      {/* LONG-FORM TIMELINE WITH SCRUBBER & CANVAS WAVEFORM */}
      <div className="hairline-card p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <span className="text-xs uppercase tracking-wider text-signal font-semibold">
              Master Video Timeline
            </span>
            <h3 className="font-display text-2xl text-white mt-0.5">
              interview_raw_01.mp4
            </h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Current Scrubber: 00:{playheadTime.toFixed(1)} / 03:04.0
          </span>
        </div>

        {/* Scrubber track & Waveform visualization */}
        <div className="relative w-full h-24 bg-black/60 rounded-md border border-border/80 overflow-hidden flex flex-col justify-end p-2 select-none">
          {/* Waveform bars */}
          <div className="w-full h-16 flex items-end justify-between gap-1 opacity-70">
            {[
              20, 45, 60, 85, 30, 70, 95, 40, 60, 80, 50, 90, 75, 35, 60, 85,
              40, 90, 65, 30, 80, 95, 45, 70, 85, 40, 60, 90, 55, 75, 40, 85,
              50, 95, 70, 35, 60, 85, 45, 90, 65, 30, 75, 95, 50, 80, 60, 40,
            ].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-signal/60 hover:bg-signal transition-colors rounded-sm"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>

          {/* Interactive playhead slider */}
          <input
            type="range"
            min="0"
            max="184"
            step="0.5"
            value={playheadTime}
            onChange={(e) => setPlayheadTime(parseFloat(e.target.value))}
            className="absolute inset-x-0 bottom-0 opacity-0 cursor-ew-resize h-full w-full"
          />

          {/* Vertical Playhead Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${(playheadTime / 184) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-signal rounded-sm -translate-x-[4px] shadow-sm" />
          </div>
        </div>

        {/* Clip candidates spans overlay */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>00:00.0</span>
          <span>01:30.0</span>
          <span>03:04.0</span>
        </div>
      </div>

      {/* CLIPS RESULTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-signal font-semibold">
              Candidate Clips
            </span>
            <h3 className="font-display text-3xl text-white mt-0.5">
              Extracted 9:16 Cuts ({clips.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('/editor')}
            className="px-4 py-2 rounded-md bg-signal text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
          >
            <span>Open accepted in Editor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {clips.length === 0 ? (
          <div className="hairline-card p-12 text-center space-y-3">
            <Scissors className="w-8 h-8 text-signal mx-auto opacity-70" />
            <h4 className="font-display text-2xl text-white">No clips extracted yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Press "Find clips" to trigger audio transcript scoring and short-form boundary detection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => {
              const isAccepted = clip.status === 'accepted';
              const isRejected = clip.status === 'rejected';

              return (
                <div
                  key={clip.id}
                  className={`hairline-card p-5 space-y-4 border transition-all ${
                    isAccepted
                      ? 'border-signal bg-secondary'
                      : isRejected
                      ? 'opacity-40 border-border'
                      : 'border-border bg-secondary/60'
                  }`}
                >
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-xl text-white tracking-tight">
                        {clip.title}
                      </h4>
                      <span className="text-[11px] font-mono text-signal">
                        {clip.aspectRatio} &bull; {clip.duration}s
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => acceptClip(clip.id)}
                        className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isAccepted
                            ? 'bg-ok text-black font-bold'
                            : 'bg-white/10 text-white hover:bg-ok/20 hover:text-ok'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateClip(clip.id)}
                        className="p-1.5 rounded-md bg-white/5 text-muted-foreground hover:text-white"
                        title="Duplicate clip"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectClip(clip.id)}
                        className="p-1.5 rounded-md bg-white/5 text-muted-foreground hover:text-warn"
                        title="Reject clip"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 9:16 Video Preview Frame */}
                  <div className="w-full aspect-[9/16] max-h-64 mx-auto rounded-md bg-black border border-border flex flex-col justify-between relative overflow-hidden">
                    <VideoPlayer 
                      src={(() => {
                        const a = assets.find(a => a.id === clip.sourceAssetId);
                        return a?.backendUrl || a?.url;
                      })()}
                      className="absolute inset-0"
                      controls={true}
                    />
                    
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/80 z-10 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded bg-black/60">
                        IN 00:{clip.startTime.toFixed(1)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black/60">
                        OUT 00:{clip.endTime.toFixed(1)}
                      </span>
                    </div>

                    {clip.suggestedHook && (
                      <div className="z-10 p-2 rounded bg-black/80 border border-white/20 text-[11px] text-white leading-tight">
                        <span className="text-[9px] uppercase font-mono text-signal block mb-0.5">
                          Suggested Hook
                        </span>
                        "{clip.suggestedHook}"
                      </div>
                    )}
                  </div>

                  {/* Plain Sentence Reason */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                      Selection rationale
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {clip.reason}
                    </p>
                  </div>

                  {/* Trim boundary controls */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-signal" />
                        <span>Trim Boundaries</span>
                      </span>
                      <span className="font-mono text-[11px]">
                        00:{clip.startTime.toFixed(1)} - 00:{clip.endTime.toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          Start point (s)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={clip.startTime}
                          onChange={(e) =>
                            updateClipTimes(
                              clip.id,
                              parseFloat(e.target.value) || 0,
                              clip.endTime
                            )
                          }
                          className="w-full px-2 py-1 text-xs rounded-md bg-secondary border border-border text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">
                          End point (s)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={clip.endTime}
                          onChange={(e) =>
                            updateClipTimes(
                              clip.id,
                              clip.startTime,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-xs rounded-md bg-secondary border border-border text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};
