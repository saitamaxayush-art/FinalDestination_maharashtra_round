import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, resolveMediaUrl } from '../config';
import { PageShell } from '../components/shared/PageShell';
import { VideoPlayer } from '../components/shared/VideoPlayer';
import { useStore } from '../store/useStore';
import { TrackType } from '../types';
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
    assets,
    clips,
    selectedAssetId,
    applyAiSuggestion,
    dismissAiSuggestion,
    convertLayerToManual,
    updateLayerContent,
    revertHistoryItem,
  } = useStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState<number>(4.2);
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('lyr_c1');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollIntervalRef = useRef<number | NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current as number);
    };
  }, []);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error("Video play failed:", error);
      }
    } else {
      video.pause();
    }
  };

  const TRACKS: TrackType[] = ['Video', 'Captions', 'Audio', 'Overlays'];

  const selectedLayer = editorLayers.find((l) => l.id === selectedLayerId);

  const [isExporting, setIsExporting] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [exportStatusText, setExportStatusText] = useState<string>('Generate/Export Video');

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) return;
    setIsPlanning(true);
    setPlan(null);
    setPlanError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Couldn't understand that edit request.");
      }
      
      if (data.status === 'error' || data.error) {
        setPlanError(data.error || "Couldn't understand that edit request.");
        setPlan(null);
      } else {
        setPlan(data);
      }
    } catch (e: any) {
      console.error("[PLANNER] ERROR", e);
      setPlanError(e.message || "Couldn't understand that edit request.");
    } finally {
      setIsPlanning(false);
    }
  };

  const activeAsset = assets.find(a => a.id === selectedAssetId) || 
                      assets.find(a => a.id === clips.find(c => c.status === 'accepted')?.sourceAssetId) || 
                      assets[0];

  const duration = activeAsset?.duration || 32.4;

  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportStatusText('AI is editing your video...');
    
    try {
      const requestBody: any = { 
        platform_variant_id: 1, 
        prompt: prompt.trim() || undefined 
      };
      
      if (activeAsset?.backendId) {
        requestBody.source_asset_id = activeAsset.backendId;
      }

      const res = await fetch(`${API_BASE_URL}/api/clips/1/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create export job');
      }
      
      const exportId = data.export_id;
      let polls = 0;
      
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current as number);
      
      pollIntervalRef.current = setInterval(async () => {
        polls++;
        if (polls > 60) {
          clearInterval(pollIntervalRef.current as number);
          setIsExporting(false);
          alert("Export is taking longer than expected. Please try again.");
          return;
        }
        
        try {
          const pollRes = await fetch(`${API_BASE_URL}/api/exports/${exportId}`);
          if (!pollRes.ok) return;
          
          const pollData = await pollRes.json();
          const status = pollData.status ? pollData.status.toLowerCase() : "unknown";
          
          if (status === 'completed') {
            clearInterval(pollIntervalRef.current as number);
            setExportStatusText('Done ✓');
            setTimeout(() => {
              setIsExporting(false);
              setExportStatusText('Generate/Export Video');
            }, 1000);
            if (pollData.output_url) {
              setGeneratedVideoUrl(`${API_BASE_URL}${pollData.output_url}?t=${Date.now()}`);
            } else {
              alert("Export completed but no output video URL was returned.");
            }
          } else if (status === 'failed') {
            clearInterval(pollIntervalRef.current as number);
            setIsExporting(false);
            setExportStatusText('Generate/Export Video');
            let errMsg = pollData.error_message || 'Unknown error';
            if (errMsg.length > 200 || errMsg.includes('FFmpeg') || errMsg.includes('Traceback')) {
              if (errMsg.toLowerCase().includes('shorter than')) {
                errMsg = 'Source video is shorter than the requested duration.';
              } else {
                errMsg = 'Video rendering failed. Please check your edit parameters and try again.';
              }
            }
            alert('Export failed: ' + errMsg);
          } else if (status === 'processing') {
            setExportStatusText(pollData.progress >= 50 ? 'Rendering final video...' : 'Applying edits...');
          } else if (status === 'pending') {
            setExportStatusText('AI is editing your video...');
          }
        } catch (e) {
          // Ignore network errors during polling
        }
      }, 1000);
    } catch (e: any) {
      console.error("[EXPORT] ERROR", e);
      let errMsg = e.message || 'Error triggering export';
      if (errMsg.length > 200) errMsg = 'Error triggering export. Please try again.';
      alert(errMsg);
      setIsExporting(false);
      setExportStatusText('Generate/Export Video');
    }
  };

  return (
    <PageShell
      title="AI-Assisted Editor"
      description="Describe the edit you want. AI converts it into a validated edit plan."
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
            onClick={handleExportVideo}
            disabled={isExporting}
            className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{isExporting ? exportStatusText : 'Generate/Export Video'}</span>
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
              00:{playheadTime.toFixed(1)} / 00:{duration.toFixed(1)}
            </span>
          </div>

          {/* Canvas Box */}
          <div className="w-full h-80 rounded-md bg-black border border-border flex items-center justify-center relative overflow-hidden">
            {/* Real Video Player underneath */}
            <VideoPlayer 
              key={generatedVideoUrl || 'default-video'}
              ref={videoRef}
              src={generatedVideoUrl || activeAsset?.backendUrl || activeAsset?.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
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
                onClick={handlePlayPause}
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
          
          {/* AI PROMPT INPUT UI */}
          <div className="mt-6 pt-4 border-t border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-signal" />
              <span className="text-sm font-semibold text-white">✨ What do you want to change?</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell AI how you want to edit your video..."
                className="flex-1 bg-black/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGeneratePlan();
                }}
              />
              <button 
                onClick={handleGeneratePlan}
                disabled={isPlanning || !prompt.trim()}
                className="px-4 py-2 bg-signal/20 text-signal border border-signal/50 rounded-md font-semibold text-sm hover:bg-signal/30 disabled:opacity-50"
              >
                {isPlanning ? 'Planning...' : 'Generate Edit Plan'}
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Try saying:</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setPrompt("Make this a 10 second vertical video, mute the audio, and add the title 'My Journey' at the beginning.")}
                  className="px-2 py-1 text-[11px] bg-secondary border border-border rounded-md text-white hover:bg-white/10 text-left transition-colors"
                >
                  "Make this a 10 second vertical video, mute the audio, and add the title 'My Journey' at the beginning."
                </button>
                <button 
                  onClick={() => setPrompt("Make this suitable for YouTube Shorts")}
                  className="px-2 py-1 text-[11px] bg-secondary border border-border rounded-md text-white hover:bg-white/10 transition-colors"
                >
                  "Make this suitable for YouTube Shorts"
                </button>
              </div>
            </div>
            
            {planError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-xs">
                {planError}
              </div>
            )}
            
            {plan && (
              <div className="p-4 bg-secondary/60 border border-border rounded-md space-y-3 mt-2">
                <h4 className="text-xs font-semibold uppercase text-signal tracking-wider">Proposed Edit Plan</h4>
                <p className="text-xs text-muted-foreground">{plan.explanation}</p>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white space-y-1.5 bg-black/30 p-3 rounded-md border border-border">
                    <div className="text-[10px] uppercase font-mono text-signal mb-2">AI EDIT PLAN</div>
                    {plan.output?.aspect_ratio && (
                      <div className="flex gap-2 items-center"><span className="text-signal">✓</span> {plan.output.aspect_ratio} Vertical</div>
                    )}
                    {plan.operations?.map((op: any, i: number) => {
                      if (op.type === 'trim') return <div key={i} className="flex gap-2 items-center"><span className="text-signal">✓</span> Trim to {op.end - op.start} seconds</div>;
                      if (op.type === 'mute') return <div key={i} className="flex gap-2 items-center"><span className="text-signal">✓</span> Remove audio</div>;
                      if (op.type === 'title') return <div key={i} className="flex gap-2 items-center"><span className="text-signal">✓</span> Add title: "{op.text}"</div>;
                      if (op.type === 'speed') return <div key={i} className="flex gap-2 items-center"><span className="text-signal">✓</span> Change speed to {op.factor}x</div>;
                      return <div key={i} className="flex gap-2 items-center"><span className="text-signal">✓</span> {op.type} operation</div>;
                    })}
                  </div>
                </div>
                {plan.unsupported_requests && plan.unsupported_requests.length > 0 && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-xs font-semibold text-amber-500">Note: The following parts of your request are not supported yet:</span>
                    <ul className="list-disc pl-4 mt-1">
                      {plan.unsupported_requests.map((req: string, i: number) => (
                        <li key={i} className="text-[11px] text-amber-400/80">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="pt-3 flex justify-end">
                   <button
                    type="button"
                    onClick={handleExportVideo}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{isExporting ? exportStatusText : 'Approve & Apply Edits'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
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
            max={duration}
            step="0.1"
            value={playheadTime}
            onChange={(e) => setPlayheadTime(parseFloat(e.target.value))}
            className="w-full opacity-0 absolute inset-0 cursor-ew-resize"
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${(playheadTime / duration) * 100}%` }}
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
