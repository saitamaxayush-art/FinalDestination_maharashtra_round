import React from 'react';
import { ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface InspectorPanelProps {
  module: string;
  isOpen: boolean;
  onToggle: () => void;
  width: number;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  module,
  isOpen,
  onToggle,
  width,
}) => {
  const {
    assets,
    selectedAssetId,
    script,
    footageSegments,
    scriptLineMatches,
    clips,
    activeClipId,
    editorLayers,
    editorHistory,
    platformVariants,
    workflowCards,
    insightsRecords,
  } = useStore();

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Open inspector"
        className="hidden lg:flex w-7 h-full border-l border-border bg-secondary/30 items-center justify-center text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  // Render module-specific inspection
  const renderDetails = () => {
    switch (module) {
      case 'assets': {
        const asset = assets.find((a) => a.id === selectedAssetId);
        if (!asset) {
          return (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Select an asset to inspect properties.
            </div>
          );
        }
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Asset Name
              </span>
              <p className="font-medium text-white truncate">{asset.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Type</span>
                <p className="text-white capitalize">{asset.type}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Size</span>
                <p className="text-white">{(asset.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              {asset.duration && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Duration</span>
                  <p className="text-white">{asset.duration.toFixed(1)}s</p>
                </div>
              )}
              {asset.resolution && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Resolution</span>
                  <p className="text-white">{asset.resolution}</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border/40 space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.length > 0 ? (
                  asset.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-muted-foreground font-mono">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground/60 italic">No tags</span>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'scripts': {
        const pinnedHook = script.hooks.find((h) => h.id === script.pinnedHookId);
        const totalWords = script.sections.reduce((acc, s) => acc + s.content.split(/\s+/).filter(Boolean).length, 0);

        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Script Metadata
              </span>
              <p className="font-medium text-white">{script.topic || 'Untitled script'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Words</span>
                <p className="text-white font-mono">{totalWords}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Sections</span>
                <p className="text-white font-mono">{script.sections.length}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Target</span>
                <p className="text-white capitalize">{script.targetLength}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Tone</span>
                <p className="text-white capitalize">{script.tone}</p>
              </div>
            </div>
            {pinnedHook && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-signal">
                  Pinned Hook Technique: {pinnedHook.technique}
                </span>
                <p className="p-2.5 rounded bg-white/5 border border-border text-foreground/90 italic leading-relaxed">
                  "{pinnedHook.text}"
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'footage': {
        const matched = scriptLineMatches.filter((m) => m.status === 'matched').length;
        const weak = scriptLineMatches.filter((m) => m.status === 'weak').length;
        const missing = scriptLineMatches.filter((m) => m.status === 'missing').length;

        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Footage Alignment Stats
              </span>
              <p className="text-white font-medium">
                {footageSegments.length} segments analyzed
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center font-mono">
              <div className="p-2 rounded bg-ok/10 border border-ok/30">
                <div className="text-ok font-bold">{matched}</div>
                <div className="text-[10px] text-muted-foreground">Matched</div>
              </div>
              <div className="p-2 rounded bg-warn/10 border border-warn/30">
                <div className="text-warn font-bold">{weak}</div>
                <div className="text-[10px] text-muted-foreground">Weak</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-border">
                <div className="text-muted-foreground font-bold">{missing}</div>
                <div className="text-[10px] text-muted-foreground">Missing</div>
              </div>
            </div>
          </div>
        );
      }

      case 'clips': {
        const clip = clips.find((c) => c.id === activeClipId);
        if (!clip) {
          return (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Select a clip to inspect cut parameters.
            </div>
          );
        }
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Clip Details
              </span>
              <p className="font-medium text-white truncate">{clip.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 font-mono">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">Start Time</span>
                <p className="text-white">{clip.startTime.toFixed(1)}s</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">End Time</span>
                <p className="text-white">{clip.endTime.toFixed(1)}s</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">Duration</span>
                <p className="text-white">{(clip.endTime - clip.startTime).toFixed(1)}s</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">Status</span>
                <p className={`capitalize ${clip.status === 'accepted' ? 'text-ok' : 'text-signal'}`}>
                  {clip.status}
                </p>
              </div>
            </div>
            {clip.suggestedHook && (
              <div className="pt-2 border-t border-border/40 space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">
                  Attached Hook
                </span>
                <p className="text-foreground/90 italic leading-relaxed">
                  "{clip.suggestedHook}"
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'editor': {
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Timeline Layers
              </span>
              <p className="text-white font-medium">{editorLayers.length} active tracks</p>
            </div>
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">
                Edit History ({editorHistory.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {editorHistory.length > 0 ? (
                  editorHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 rounded bg-white/5 border border-border/40 text-[11px] flex justify-between items-center"
                    >
                      <span className="text-white truncate">{h.action}</span>
                      <span className="font-mono text-muted-foreground text-[10px]">{h.author}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground/60 italic">No edits yet</span>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'platforms': {
        const variantsList = Object.values(platformVariants);
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Platform Adaptations
              </span>
              <p className="text-white font-medium">{variantsList.length} export targets</p>
            </div>
            <div className="space-y-2 pt-2 border-t border-border/40">
              {variantsList.map((pv) => (
                <div key={pv.platformId} className="p-2 rounded bg-white/5 border border-border/40 flex justify-between items-center">
                  <span className="text-white font-medium capitalize">{pv.platformId}</span>
                  <span className="font-mono text-muted-foreground text-[10px]">{pv.isQueued ? 'Queued' : 'Ready'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'workflow': {
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Production Pipeline
              </span>
              <p className="text-white font-medium">{workflowCards.length} cards on board</p>
            </div>
          </div>
        );
      }

      case 'insights': {
        return (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                Dataset Overview
              </span>
              <p className="text-white font-medium">{insightsRecords.length} performance records</p>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Select an item to inspect properties.
          </div>
        );
    }
  };

  return (
    <aside
      style={{ width }}
      className="hidden lg:flex flex-col h-full border-l border-border bg-secondary/20 flex-shrink-0"
      aria-label="Inspector"
    >
      <div className="h-10 px-4 flex items-center justify-between border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-signal" />
          <span>Inspector</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          title="Collapse inspector"
          className="text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">{renderDetails()}</div>
    </aside>
  );
};
