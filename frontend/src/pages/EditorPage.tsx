import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { TrackType } from '../types';
import { submitClipEdits } from '../services/api';
import {
  Play,
  Pause,
  SkipBack,
  Scissors,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  X,
  History,
  ArrowRight,
  Info,
} from 'lucide-react';

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    editorLayers,
    aiSuggestions,
    editorHistory,
    applyAiSuggestion,
    dismissAiSuggestion,
    convertLayerToManual,
    updateLayerContent,
    revertHistoryItem,
    activeClipId,
  } = useStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState<number>(4.2);
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('lyr_c1');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const TRACKS: TrackType[] = ['Video', 'Captions', 'Audio', 'Overlays'];

  const selectedLayer = editorLayers.find((l) => l.id === selectedLayerId);

  const handleExportToPlatforms = async () => {
    try {
      const numericId = parseInt(activeClipId?.replace(/\D/g, '') || '0');
      if (numericId > 0) {
        const operations = editorLayers.map(l => ({
          type: l.isAiGenerated ? 'ai_suggestion' : 'manual',
          track: l.trackId,
          action: l.title,
          payload: l.content,
          start_time: l.startTime,
          duration: l.duration
        }));
        await submitClipEdits(numericId, operations);
      }
    } catch (err) {
      console.error('Failed to submit clip edits', err);
    }
    navigate('/platforms');
  };

  return (
    <PageShell
      title="AI-Assisted Editor"
      description="Refine timeline tracks with editable AI layers. Convert any AI recommendation into a manual track to retain complete editorial control."
      stepNumber={5}
      nextPageTitle="Platforms"
      nextPagePath="/platforms"
      carryOverText="Refined 9:16 cut with 4 active tracks carries over to Platforms for multi-format adaptation."
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2 rounded-md bg-secondary border border-border text-muted-foreground hover:text-white"
              title="Keyboard shortcuts"
            >
              <Info className="w-4 h-4" />
            </button>
            {showShortcuts && (
              <div className="absolute right-0 top-11 w-64 p-3 rounded-lg bg-black/95 border border-border text-xs z-50 shadow-2xl space-y-2">
                <span className="font-semibold text-white block pb-1 border-b border-border">
                  Keyboard Shortcuts
                </span>
                <div className="flex justify-between text-muted-foreground">
                  <span>Space</span>
                  <span className="font-mono text-white">Play / Pause</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>S</span>
                  <span className="font-mono text-white">Split at playhead</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Del / Backspace</span>
                  <span className="font-mono text-white">Delete layer</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cmd + Z</span>
                  <span className="font-mono text-white">Undo change</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportToPlatforms}
            className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
          >
            <span>Export to Platforms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      {/* TOP WORKSPACE: Preview Player Canvas + AI Suggestions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start">
        {/* VIDEO PREVIEW CANVAS */}
        <div className="lg:col-span-2 hairline-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Canvas Preview (9:16 Vertical)
              </span>
            </div>
            <span className="font-mono text-xs text-white">
              00:{playheadTime.toFixed(1)} / 00:32.4
            </span>
          </div>

          {/* Canvas Box */}
          <div className="w-full h-80 rounded-md bg-black border border-border flex items-center justify-center relative overflow-hidden">
            {/* Background talking head representation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-secondary/70">
              <span className="text-xs font-mono text-muted-foreground mb-1">
                Visual Track: A-Roll Main Shot
              </span>
              <h3 className="font-display text-2xl text-white max-w-sm">
                Why do video creators spend 14 hours editing a single video?
              </h3>
            </div>

            {/* Overlays / Captions Active Preview */}
            <div className="absolute bottom-12 inset-x-6 text-center z-20">
              {editorLayers
                .filter((l) => l.trackId === 'Captions')
                .map((l) => (
                  <div
                    key={l.id}
                    className={`inline-block px-3 py-1.5 rounded-md text-xs font-semibold backdrop-blur-md ${
                      l.isAiGenerated
                        ? 'border border-signal bg-black/80 text-signal shadow-lg'
                        : 'border border-white/30 bg-black/80 text-white'
                    }`}
                  >
                    {l.isAiGenerated && (
                      <span className="mr-1.5 px-1 py-0.2 rounded-sm bg-signal text-black text-[9px] font-mono font-bold">
                        AI
                      </span>
                    )}
                    "{l.content}"
                  </div>
                ))}
            </div>

            {/* Title card overlay representation */}
            {editorLayers.some((l) => l.trackId === 'Overlays' && l.startTime <= playheadTime && playheadTime <= l.startTime + l.duration) && (
              <div className="absolute top-8 px-4 py-1.5 rounded-md bg-signal text-black font-bold text-xs uppercase tracking-wider shadow-xl z-20">
                THE 14-HOUR BOTTLENECK
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlayheadTime(0)}
                className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-white"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-md bg-white text-black font-semibold text-xs flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  // Simulate timeline split
                  alert(`Split timeline cut at 00:${playheadTime.toFixed(1)}`);
                }}
                className="px-2.5 py-1.5 rounded-md bg-secondary border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1"
              >
                <Scissors className="w-3 h-3" />
                <span>Split (S)</span>
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <button
                type="button"
                onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                className="p-1 rounded-md hover:bg-white/10"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span>{Math.round(timelineZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setTimelineZoom(Math.min(2, timelineZoom + 0.25))}
                className="p-1 rounded-md hover:bg-white/10"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI SUGGESTIONS PANEL */}
        <div className="hairline-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-signal" />
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                AI Suggestions
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {aiSuggestions.filter((s) => !s.applied).length} pending
            </span>
          </div>

          <div className="space-y-3">
            {aiSuggestions.map((sugg) => (
              <div
                key={sugg.id}
                className={`p-3 rounded-md border text-xs space-y-2 transition-all ${
                  sugg.applied
                    ? 'border-ok/40 bg-ok/5 opacity-80'
                    : 'border-border bg-secondary/70 hover:border-white/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white">{sugg.title}</span>
                  {sugg.applied ? (
                    <span className="px-1.5 py-0.5 rounded bg-ok/20 text-ok font-mono text-[10px]">
                      Applied
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyAiSuggestion(sugg.id)}
                        className="px-2 py-1 rounded bg-white text-black font-semibold text-[11px] hover:scale-105 transition-transform"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissAiSuggestion(sugg.id)}
                        className="p-1 rounded text-muted-foreground hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {sugg.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MULTI-TRACK TIMELINE */}
      <div className="hairline-card p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <span className="text-xs uppercase tracking-wider text-signal font-semibold">
              Multi-Track Sequence
            </span>
            <h3 className="font-display text-2xl text-white mt-0.5">
              Timeline Editor
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Amber border denotes active AI layer
          </span>
        </div>

        {/* Tracks List */}
        <div className="space-y-3 pt-2">
          {TRACKS.map((track) => {
            const trackLayers = editorLayers.filter((l) => l.trackId === track);

            return (
              <div key={track} className="grid grid-cols-12 gap-3 items-center">
                {/* Track Header Label */}
                <div className="col-span-2 text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-signal" />
                  <span className="truncate">{track}</span>
                </div>

                {/* Track Content Timeline Block */}
                <div className="col-span-10 h-14 bg-secondary/80 border border-border/80 rounded-md p-1.5 flex items-center gap-2 relative overflow-hidden">
                  {trackLayers.map((layer) => {
                    const isSelected = selectedLayerId === layer.id;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`h-full px-3 rounded-md flex items-center justify-between text-xs cursor-pointer transition-all border ${
                          isSelected
                            ? 'ring-1 ring-white'
                            : ''
                        } ${
                          layer.isAiGenerated
                            ? 'border-signal bg-signal/15 text-white'
                            : 'border-border bg-white/5 text-muted-foreground hover:text-white'
                        }`}
                        style={{ width: `${Math.max(40, layer.duration * 6 * timelineZoom)}px` }}
                      >
                        <div className="truncate pr-1">
                          <span className="font-semibold block truncate text-[11px]">
                            {layer.title}
                          </span>
                          <span className="text-[10px] opacity-75 truncate block">
                            {layer.content}
                          </span>
                        </div>

                        {layer.isAiGenerated && (
                          <span className="px-1 py-0.2 rounded-sm bg-signal text-black font-mono font-bold text-[9px] flex-shrink-0">
                            AI
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Playhead Track */}
        <div className="relative w-full h-6 bg-secondary/40 rounded-md border border-border flex items-center px-2">
          <input
            type="range"
            min="0"
            max="32.4"
            step="0.1"
            value={playheadTime}
            onChange={(e) => setPlayheadTime(parseFloat(e.target.value))}
            className="w-full opacity-0 absolute inset-0 cursor-ew-resize"
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${(playheadTime / 32.4) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-signal rounded-sm -translate-x-[4px] -translate-y-1 shadow-sm" />
          </div>
        </div>
      </div>

      {/* INSPECTOR & AUDIT HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Layer Inspector (Convert to manual & edit) */}
        {selectedLayer ? (
          <div className="hairline-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Layer Inspector: {selectedLayer.trackId}
              </span>
              {selectedLayer.isAiGenerated ? (
                <span className="px-2 py-0.5 rounded-md bg-signal text-black font-mono text-[10px] font-bold">
                  AI Generated
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px]">
                  Manual Track
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Layer Content / Text
                </label>
                <textarea
                  rows={2}
                  value={selectedLayer.content}
                  onChange={(e) => updateLayerContent(selectedLayer.id, e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                {selectedLayer.isAiGenerated && (
                  <button
                    type="button"
                    onClick={() => convertLayerToManual(selectedLayer.id)}
                    className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Convert to manual
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {selectedLayer.isAiGenerated
                    ? 'Detaches the AI marker and enables direct timeline editing.'
                    : 'This layer is in manual mode.'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hairline-card p-8 text-center text-xs text-muted-foreground">
            Select a timeline layer above to inspect properties.
          </div>
        )}

        {/* Change History with Author & Revert */}
        <div className="hairline-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-signal" />
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Timeline Edit History
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {editorHistory.length} actions logged
            </span>
          </div>

          <div className="space-y-2">
            {editorHistory.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-md bg-secondary/60 border border-border flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        item.author === 'AI'
                          ? 'bg-signal text-black'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.author}
                    </span>
                    <span className="text-white truncate">{item.action}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Time: {item.timestamp}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => revertHistoryItem(item.id)}
                  className="px-2 py-1 rounded bg-white/5 border border-border text-[11px] text-muted-foreground hover:text-white hover:bg-white/10"
                >
                  Revert
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};
