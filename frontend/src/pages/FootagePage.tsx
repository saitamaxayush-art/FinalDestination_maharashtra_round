import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { matchScriptToFootage } from '../services/mockAiService';
import {
  Sparkles,
  Film,
  Play,
  AlertTriangle,
  Upload,
  GripHorizontal,
  CheckCircle2,
} from 'lucide-react';

export const FootagePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    script,
    assets,
    footageSegments,
    scriptLineMatches,
    setScriptLineMatches,
    reassignMatch,
  } = useStore();

  const [selectedAssetId, setSelectedAssetId] = useState<string>('sample_asset_1');
  const [isMatching, setIsMatching] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>('line_0');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>('seg_1');
  const [draggedLineId, setDraggedLineId] = useState<string | null>(null);

  // Run alignment matcher
  const handleRunMatching = async () => {
    setIsMatching(true);
    const lines = script.sections.map((s) => s.content);
    const results = await matchScriptToFootage(lines);
    setScriptLineMatches(results);
    setIsMatching(false);
  };

  // Drag and drop manual line reassignment to segment
  const handleDragLineStart = (lineId: string) => {
    setDraggedLineId(lineId);
  };

  const handleDropOnSegment = (segmentId: string) => {
    if (!draggedLineId) return;
    reassignMatch(draggedLineId, segmentId);
    setActiveLineId(draggedLineId);
    setActiveSegmentId(segmentId);
    setDraggedLineId(null);
  };

  const selectLine = (lineId: string, segmentId?: string) => {
    setActiveLineId(lineId);
    if (segmentId) setActiveSegmentId(segmentId);
  };

  const selectSegment = (segmentId: string, matchedLineId?: string) => {
    setActiveSegmentId(segmentId);
    if (matchedLineId) setActiveLineId(matchedLineId);
  };

  const missingLines = scriptLineMatches.filter((m) => m.status === 'missing');
  const activeSegment = footageSegments.find((s) => s.id === activeSegmentId);

  return (
    <PageShell
      title="Script-to-Video Understanding"
      description="Synchronize spoken script lines with raw footage speech segments. Reassign matches by dragging lines directly onto timeline blocks."
      stepNumber={3}
      nextPageTitle="Clips"
      nextPagePath="/clips"
      carryOverText={`${footageSegments.length} verified speech segments ready for candidate clip detection.`}
      actions={
        <button
          type="button"
          onClick={handleRunMatching}
          disabled={isMatching}
          className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isMatching ? 'Aligning speech...' : 'Run matching'}</span>
        </button>
      }
    >
      {/* Video Source Selector Bar */}
      <div className="hairline-card p-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-signal" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Source Video Asset:
          </span>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none"
          >
            {assets
              .filter((a) => a.type === 'video')
              .map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            {assets.filter((a) => a.type === 'video').length === 0 && (
              <option value="sample_asset_1">interview_raw_01.mp4 (Sample)</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-ok" />
            <span className="text-muted-foreground">Matched</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-warn" />
            <span className="text-muted-foreground">Weak match</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-white/40" />
            <span className="text-muted-foreground">No footage found</span>
          </div>
        </div>
      </div>

      {/* Main Split Screen: Script Lines on Left, Footage Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {/* LEFT COLUMN: Script as Numbered Lines */}
        <div className="hairline-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Script Lines
              </span>
              <h3 className="font-display text-2xl text-white mt-0.5">
                Spoken Statements
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Drag line to reassign
            </span>
          </div>

          <div className="space-y-3">
            {scriptLineMatches.map((line, idx) => {
              const isSelected = activeLineId === line.lineId;
              return (
                <div
                  key={line.lineId}
                  draggable
                  onDragStart={() => handleDragLineStart(line.lineId)}
                  onClick={() => selectLine(line.lineId, line.segmentId)}
                  className={`p-3.5 rounded-md border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-signal bg-signal/15 shadow-md'
                      : 'border-border bg-secondary/50 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        Line {idx + 1}
                      </span>
                    </div>

                    {/* Status Badge (no percentages/accuracy numbers) */}
                    <div>
                      {line.status === 'matched' && (
                        <span className="px-2 py-0.5 rounded-md bg-ok/15 border border-ok text-ok text-[10px] font-mono">
                          Matched
                        </span>
                      )}
                      {line.status === 'weak' && (
                        <span className="px-2 py-0.5 rounded-md bg-warn/15 border border-warn text-warn text-[10px] font-mono">
                          Weak match
                        </span>
                      )}
                      {line.status === 'missing' && (
                        <span className="px-2 py-0.5 rounded-md bg-white/10 border border-border text-muted-foreground text-[10px] font-mono">
                          No footage found
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {line.text}
                  </p>

                  {line.segmentId && (
                    <div className="text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                      Mapped to segment: {line.segmentId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Footage Timeline & Video Scrub Preview */}
        <div className="space-y-6">
          {/* Simulated Video Player & Scrub Frame */}
          <div className="hairline-card p-4 space-y-3">
            <div className="w-full h-56 rounded-md bg-black border border-border flex flex-col items-center justify-center relative overflow-hidden">
              <Play className="w-10 h-10 text-signal opacity-80 mb-2" />
              <span className="text-xs text-white font-semibold">
                {activeSegment ? activeSegment.label : 'Select a line to scrub'}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground mt-1">
                Timecode: {activeSegment ? `00:${activeSegment.startTime.toFixed(1)} - 00:${activeSegment.endTime.toFixed(1)}` : '00:00.0'}
              </span>
            </div>

            {/* Segment blocks list (Drop Target) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase tracking-wider font-semibold">
                  Footage Timeline Segments
                </span>
                <span>Drop script line to rebind</span>
              </div>

              <div className="space-y-2">
                {footageSegments.map((segment) => {
                  const isSelected = activeSegmentId === segment.id;
                  const isMatchForLine = scriptLineMatches.some(
                    (m) => m.lineId === activeLineId && m.segmentId === segment.id
                  );

                  return (
                    <div
                      key={segment.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnSegment(segment.id)}
                      onClick={() => selectSegment(segment.id, segment.matchedLineId)}
                      className={`p-3 rounded-md border transition-all cursor-pointer space-y-1 ${
                        isSelected || isMatchForLine
                          ? 'border-signal bg-secondary'
                          : 'border-border bg-secondary/50 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-[240px]">
                          {segment.label}
                        </span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          00:{segment.startTime.toFixed(1)} - 00:{segment.endTime.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground italic truncate">
                        "{segment.transcript}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MISSING FOOTAGE PANEL */}
          <div className="hairline-card p-5 border-warn/40 bg-warn/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warn" />
                <h4 className="text-xs uppercase tracking-wider font-semibold text-warn">
                  Missing Footage ({missingLines.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => navigate('/assets')}
                className="px-3 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span>Upload more b-roll in Assets</span>
              </button>
            </div>

            {missingLines.length > 0 ? (
              <div className="space-y-1.5">
                {missingLines.map((m) => (
                  <div
                    key={m.lineId}
                    className="p-2.5 rounded-md bg-secondary/80 border border-border text-xs text-muted-foreground flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{m.text}</span>
                    <span className="text-[10px] font-mono text-warn flex-shrink-0">
                      Unmatched
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-ok">
                <CheckCircle2 className="w-4 h-4" />
                <span>All script lines currently have footage candidates.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};
