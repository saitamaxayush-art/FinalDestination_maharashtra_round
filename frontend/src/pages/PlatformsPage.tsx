import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { PLATFORM_SPECS } from '../config/platforms';
import { adaptForPlatform } from '../services/mockAiService';
import { adaptClipPlatform } from '../services/api';
import {
  Sparkles,
  Columns,
  Calendar,
  Check,
  Move,
} from 'lucide-react';

export const PlatformsPage: React.FC = () => {
  const {
    selectedPlatformId,
    platformVariants,
    setSelectedPlatformId,
    updatePlatformVariant,
    queueVariantToWorkflow,
    activeClipId,
  } = useStore();

  const [isAdaptingAll, setIsAdaptingAll] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);

  const activeSpec = PLATFORM_SPECS[selectedPlatformId] || PLATFORM_SPECS.youtube_shorts;
  const activeVariant = platformVariants[selectedPlatformId] || {
    platformId: selectedPlatformId,
    title: 'From Script to Cut Video',
    caption: 'How to map scripts to video cuts.',
    hashtags: activeSpec.defaultHashtags,
    cropX: 50,
    cropY: 50,
    cropScale: 1,
    isQueued: false,
  };

  // Run Adapt All across platforms
  const handleAdaptAll = async () => {
    setIsAdaptingAll(true);
    const platformKeys = Object.keys(PLATFORM_SPECS);
    for (const key of platformKeys) {
      const generated = await adaptForPlatform('The 14-Hour Bottleneck', key);
      updatePlatformVariant(key, generated);
    }
    setIsAdaptingAll(false);
  };

  const handleQueueCurrent = async () => {
    queueVariantToWorkflow(selectedPlatformId);
    
    try {
      const numericId = parseInt(activeClipId?.replace(/\D/g, '') || '0');
      if (numericId > 0) {
        await adaptClipPlatform(numericId, selectedPlatformId);
      }
    } catch (err) {
      console.error('Failed to adapt platform on backend', err);
    }
  };

  // Aspect ratio calculation for preview container
  const getAspectRatioPadding = () => {
    if (activeSpec.aspectRatioWidth === 9 && activeSpec.aspectRatioHeight === 16) {
      return 'aspect-[9/16] max-w-[240px]';
    }
    if (activeSpec.aspectRatioWidth === 1 && activeSpec.aspectRatioHeight === 1) {
      return 'aspect-square max-w-[320px]';
    }
    return 'aspect-video max-w-[480px]';
  };

  const queuedCount = Object.values(platformVariants).filter((v) => v.isQueued).length;

  return (
    <PageShell
      title="Multi-Platform Adaptation"
      description="Reframes video aspect ratios, tests safe zone margin overlays, and tailors captions per distribution channel."
      stepNumber={6}
      nextPageTitle="Workflow"
      nextPagePath="/workflow"
      carryOverText={`${queuedCount} platform variants queued into Scheduled column on Workflow board.`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompareView(!showCompareView)}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showCompareView
                ? 'bg-white text-black border-white'
                : 'bg-secondary border-border text-muted-foreground hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare variants</span>
          </button>

          <button
            type="button"
            onClick={handleAdaptAll}
            disabled={isAdaptingAll}
            className="px-4 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAdaptingAll ? 'Adapting...' : 'Adapt all channels'}</span>
          </button>
        </div>
      }
    >
      {/* RECTANGULAR PLATFORM TABS (NO PILL SHAPES) */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border/80 pb-3">
        {Object.values(PLATFORM_SPECS).map((spec) => {
          const isActive = selectedPlatformId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedPlatformId(spec.id)}
              className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all border ${
                isActive
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-secondary/70 border-border text-muted-foreground hover:text-white hover:bg-secondary'
              }`}
            >
              <span>{spec.name}</span>
              <span className="ml-2 font-mono text-[10px] opacity-75">
                ({spec.aspectRatioLabel})
              </span>
            </button>
          );
        })}
      </div>

      {showCompareView ? (
        /* SIDE-BY-SIDE COMPARE VIEW */
        <div className="hairline-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Side-by-Side Comparison
              </span>
              <h3 className="font-display text-2xl text-white mt-0.5">
                Distribution Variants
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareView(false)}
              className="text-xs text-muted-foreground hover:text-white underline"
            >
              Return to single editor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(PLATFORM_SPECS).slice(0, 3).map((spec) => {
              const variant = platformVariants[spec.id] || activeVariant;
              return (
                <div key={spec.id} className="p-4 rounded-md border border-border bg-secondary/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{spec.name}</span>
                    <span className="text-[10px] font-mono text-signal">{spec.aspectRatioLabel}</span>
                  </div>

                  <div className="w-full aspect-[9/16] max-h-48 mx-auto bg-black rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                    Frame ({spec.aspectRatioLabel})
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-white block truncate">{variant.title}</span>
                    <p className="text-muted-foreground text-[11px] line-clamp-3 leading-relaxed">
                      {variant.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE PLATFORM WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 5 COLS: Aspect Ratio Preview Frame with Safe Zone Overlays & Reframe Control */}
          <div className="lg:col-span-5 hairline-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Canvas Safe Zones: {activeSpec.aspectRatioLabel}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Max {activeSpec.maxDurationSeconds}s
              </span>
            </div>

            {/* Animated Aspect Ratio Frame */}
            <div className="w-full flex items-center justify-center py-4 bg-black/40 rounded-md border border-border/80 relative">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                className={`w-full ${getAspectRatioPadding()} mx-auto bg-black rounded-md border border-white/20 relative overflow-hidden flex flex-col justify-between p-3 select-none`}
              >
                {/* Safe Zone Margin Guides */}
                <div
                  className="absolute inset-0 pointer-events-none border border-dashed border-warn/60"
                  style={{
                    top: `${activeSpec.safeZones.topPercent}%`,
                    bottom: `${activeSpec.safeZones.bottomPercent}%`,
                    left: `${activeSpec.safeZones.leftPercent}%`,
                    right: `${activeSpec.safeZones.rightPercent}%`,
                  }}
                >
                  <span className="absolute top-1 left-1 text-[8px] font-mono uppercase bg-warn/80 text-black px-1 rounded-sm font-bold">
                    Safe Action Area
                  </span>
                </div>

                {/* Top safe zone label */}
                <div className="z-10 text-[9px] font-mono text-muted-foreground text-center bg-black/60 py-0.5 rounded">
                  UI Margin: Top {activeSpec.safeZones.topPercent}%
                </div>

                {/* Center Content Simulation with Draggable Crop Position */}
                <div className="z-10 text-center space-y-1">
                  <div className="w-12 h-12 rounded-md bg-signal/20 border border-signal mx-auto flex items-center justify-center text-signal">
                    <Move className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-white block">
                    Focal Center
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    X: {activeVariant.cropX}% | Y: {activeVariant.cropY}%
                  </span>
                </div>

                {/* Bottom UI controls safe zone */}
                <div className="z-10 text-[9px] font-mono text-warn text-center bg-black/80 py-1 rounded border border-warn/40">
                  {activeSpec.safeZones.comment}
                </div>
              </motion.div>
            </div>

            {/* Reframe Horizontal / Vertical Sliders */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  Reframe Crop Offset
                </span>
                <span className="text-[11px]">Adjust frame anchor</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Horizontal Pan: {activeVariant.cropX}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={activeVariant.cropX}
                    onChange={(e) =>
                      updatePlatformVariant(selectedPlatformId, {
                        cropX: parseInt(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Vertical Tilt: {activeVariant.cropY}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={activeVariant.cropY}
                    onChange={(e) =>
                      updatePlatformVariant(selectedPlatformId, {
                        cropY: parseInt(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: Editable Fields (Title, Caption, Hashtags) + Queue to Workflow */}
          <div className="lg:col-span-7 hairline-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                  Channel Copy
                </span>
                <h3 className="font-display text-2xl text-white mt-0.5">
                  {activeSpec.name} Specifications
                </h3>
              </div>

              <button
                type="button"
                onClick={handleQueueCurrent}
                disabled={activeVariant.isQueued}
                className={`px-4 py-2 rounded-md font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  activeVariant.isQueued
                    ? 'bg-ok text-black'
                    : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {activeVariant.isQueued ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Queued to Workflow</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Queue into Workflow</span>
                  </>
                )}
              </button>
            </div>

            {/* Title field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="uppercase tracking-wider text-muted-foreground font-medium">
                  Video Post Title
                </label>
                <span className="font-mono text-muted-foreground text-[11px]">
                  {activeVariant.title.length} characters
                </span>
              </div>
              <input
                type="text"
                value={activeVariant.title}
                onChange={(e) =>
                  updatePlatformVariant(selectedPlatformId, { title: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Caption field with character counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="uppercase tracking-wider text-muted-foreground font-medium">
                  Caption / Description
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    activeVariant.caption.length > activeSpec.maxCaptionLength
                      ? 'text-warn font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {activeVariant.caption.length} / {activeSpec.maxCaptionLength}
                </span>
              </div>
              <textarea
                rows={6}
                value={activeVariant.caption}
                onChange={(e) =>
                  updatePlatformVariant(selectedPlatformId, { caption: e.target.value })
                }
                className="w-full p-3 text-xs rounded-md bg-secondary border border-border text-white leading-relaxed focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Hashtags field */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Hashtags (comma separated)
              </label>
              <input
                type="text"
                value={activeVariant.hashtags.join(', ')}
                onChange={(e) =>
                  updatePlatformVariant(selectedPlatformId, {
                    hashtags: e.target.value
                      .split(',')
                      .map((h) => h.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none font-mono"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {activeVariant.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-border text-[11px] text-signal font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
