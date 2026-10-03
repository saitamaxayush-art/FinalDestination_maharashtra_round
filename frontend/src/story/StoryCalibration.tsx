import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pt } from './homography';
import { videoToScreenCover, DEFAULT_SCREEN_QUAD } from './quad';

interface StoryCalibrationProps {
  quad: Pt[];
  onChange: (quad: Pt[]) => void;
  viewportWidth: number;
  viewportHeight: number;
  crop?: number;
}

const CORNER_NAMES = ['TL (Top-Left)', 'TR (Top-Right)', 'BR (Bottom-Right)', 'BL (Bottom-Left)'];
const CORNER_KEYS = ['TL', 'TR', 'BR', 'BL'];

export const StoryCalibration: React.FC<StoryCalibrationProps> = ({
  quad,
  onChange,
  viewportWidth,
  viewportHeight,
  crop = 1.0,
}) => {
  const [activeCorner, setActiveCorner] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const draggingRef = useRef<number | null>(null);

  // Convert screen coords back to video coords
  const screenToVideo = useCallback(
    (screenX: number, screenY: number): Pt => {
      const s = Math.max(viewportWidth / 1280, viewportHeight / 720) * crop;
      const ox = (viewportWidth - 1280 * s) / 2;
      const oy = (viewportHeight - 720 * s) / 2;
      const vx = Math.round((screenX - ox) / s);
      const vy = Math.round((screenY - oy) / s);
      return [vx, vy];
    },
    [viewportWidth, viewportHeight, crop]
  );

  // Keyboard nudging: 1px or 5px with Shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const newQuad: Pt[] = quad.map((pt, i) => {
          if (i !== activeCorner) return [...pt] as Pt;
          let [x, y] = pt;
          if (e.key === 'ArrowUp') y -= step;
          if (e.key === 'ArrowDown') y += step;
          if (e.key === 'ArrowLeft') x -= step;
          if (e.key === 'ArrowRight') x += step;
          return [x, y];
        });
        onChange(newQuad);
      } else if (e.key >= '1' && e.key <= '4') {
        setActiveCorner(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quad, activeCorner, onChange]);

  // Pointer drag handling
  const handlePointerDown = (cornerIdx: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveCorner(cornerIdx);
    draggingRef.current = cornerIdx;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingRef.current === null) return;
    const cornerIdx = draggingRef.current;
    const [vx, vy] = screenToVideo(e.clientX, e.clientY);
    const newQuad: Pt[] = quad.map((pt, i) => (i === cornerIdx ? [vx, vy] : pt));
    onChange(newQuad);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      draggingRef.current = null;
    }
  };

  const copyJson = () => {
    const jsonStr = `export const DEFAULT_SCREEN_QUAD: Pt[] = [\n` +
      `  [${quad[0][0]}, ${quad[0][1]}], // TL\n` +
      `  [${quad[1][0]}, ${quad[1][1]}], // TR\n` +
      `  [${quad[2][0]}, ${quad[2][1]}], // BR\n` +
      `  [${quad[3][0]}, ${quad[3][1]}], // BL\n` +
      `];`;
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDefault = () => {
    onChange(DEFAULT_SCREEN_QUAD);
  };

  // Convert quad to screen coordinates for handles
  const screenPoints = quad.map(([x, y]) =>
    videoToScreenCover(x, y, viewportWidth, viewportHeight, crop)
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none z-50 overflow-hidden font-sans"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Quad polygon outline */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <polygon
          points={screenPoints.map((p) => `${p[0]},${p[1]}`).join(' ')}
          fill="rgba(56, 189, 248, 0.08)"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* 4 Draggable Handles */}
      {screenPoints.map((pt, idx) => {
        const isActive = activeCorner === idx;
        return (
          <div
            key={idx}
            onPointerDown={(e) => handlePointerDown(idx, e)}
            className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-shadow ${
              isActive ? 'z-50' : 'z-40'
            }`}
            style={{ left: pt[0], top: pt[1] }}
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border-2 ${
                isActive
                  ? 'bg-signal text-black border-white shadow-lg ring-4 ring-signal/30 scale-125'
                  : 'bg-black/90 text-white border-white/80 hover:scale-110'
              }`}
            >
              {CORNER_KEYS[idx]}
            </div>
          </div>
        );
      })}

      {/* Floating HUD Calibration Panel */}
      <div className="absolute top-6 left-6 pointer-events-auto bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-4 text-xs text-white shadow-2xl max-w-sm space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-semibold text-signal uppercase tracking-wider text-[11px]">
            Perspective Calibration (?calibrate=1)
          </span>
          <span className="text-[10px] text-muted-foreground">Dev Mode</span>
        </div>

        <p className="text-muted-foreground text-[11px] leading-tight">
          Drag handles or use Arrow Keys to nudge (Hold Shift for 5px). Keys 1-4 switch corners.
        </p>

        {/* Corner Selection buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {CORNER_KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveCorner(i)}
              className={`py-1.5 px-2 rounded text-center font-mono font-medium text-[11px] transition-colors ${
                activeCorner === i
                  ? 'bg-signal text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Live Video Coordinates */}
        <div className="space-y-1 font-mono text-[11px] bg-white/5 p-2 rounded border border-white/10">
          {quad.map(([x, y], i) => (
            <div
              key={i}
              className={`flex justify-between ${
                activeCorner === i ? 'text-signal font-semibold' : 'text-gray-300'
              }`}
            >
              <span>{CORNER_NAMES[i]}:</span>
              <span>
                [{x}, {y}]
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={copyJson}
            className="flex-1 py-1.5 px-3 rounded bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Quad JSON'}
          </button>
          <button
            type="button"
            onClick={resetDefault}
            className="py-1.5 px-3 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
