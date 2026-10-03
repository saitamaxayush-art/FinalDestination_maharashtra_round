import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  FolderArchive,
  FileText,
  ScanEye,
  Scissors,
  SlidersHorizontal,
  Smartphone,
  Kanban,
  BarChart3,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  MousePointerClick,
} from 'lucide-react';
import { PIPELINE_STEPS } from '../config/nav';
import { matchScriptToFootage } from '../services/mockAiService';
import { ScriptLineMatch } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const isPipelineInView = useInView(pipelineRef, { once: true, margin: '-100px' });

  // Pause hero video under reduced motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Pipeline interactive state
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Live demo strip state
  const [sampleScriptText, setSampleScriptText] = useState(
    'Why do video creators spend 14 hours editing a single video?\nYour script already contains the cut points.\nWhen you map lines to footage, you cut production time.'
  );
  const [isMatching, setIsMatching] = useState(false);
  const [matchedLines, setMatchedLines] = useState<ScriptLineMatch[]>([]);

  const handleRunMiniMatch = async () => {
    setIsMatching(true);
    const lines = sampleScriptText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const results = await matchScriptToFootage(lines);
    setMatchedLines(results);
    setIsMatching(false);
  };

  // How editing stays editable interactive state
  const [isDetached, setIsDetached] = useState(false);

  // Lucide icon mapping for pipeline & feature cards
  const getIcon = (idx: number) => {
    switch (idx) {
      case 0: return <FolderArchive className="w-5 h-5" />;
      case 1: return <FileText className="w-5 h-5" />;
      case 2: return <ScanEye className="w-5 h-5" />;
      case 3: return <Scissors className="w-5 h-5" />;
      case 4: return <SlidersHorizontal className="w-5 h-5" />;
      case 5: return <Smartphone className="w-5 h-5" />;
      case 6: return <Kanban className="w-5 h-5" />;
      case 7: return <BarChart3 className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full bg-background text-foreground relative selection:bg-signal/20">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-36 overflow-hidden">
        {/* Fullscreen looping background video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-45"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        />

        {/* Flat darkening layer for legibility (no multi-color gradients) */}
        <div className="absolute inset-0 bg-black/25 z-0 pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto">
          {/* H1 Heading */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal animate-fade-rise text-white">
            From script to{' '}
            <em className="not-italic text-muted-foreground">published clip,</em> in{' '}
            <em className="not-italic text-muted-foreground">one workspace.</em>
          </h1>

          {/* Concrete subtext */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
            Upload your script and raw footage. CreatorAi matches each line to the right moment, cuts short-form clips, writes hooks, and exports a version for each platform. Every AI edit stays editable.
          </p>

          {/* Two CTAs */}
          <div className="animate-fade-rise-delay-2 mt-12 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="liquid-glass rounded-md px-10 py-4 text-base font-semibold text-white border border-white/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              Open the demo
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-4 rounded-md text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              See the pipeline
            </button>
          </div>
        </div>
      </section>

      {/* ===================== PIPELINE SECTION ===================== */}
      <section
        id="pipeline"
        ref={pipelineRef}
        className="w-full py-28 px-6 border-t border-border bg-background relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 mb-16 text-center sm:text-left">
            <span className="text-xs uppercase tracking-widest text-signal font-semibold">
              The 8-Stage Operations Pipeline
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-normal tracking-tight">
              From raw files to verified publish queue.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Each stage produces structured outputs that carry over to the next screen. Click any node to open that workspace.
            </p>
          </div>

          {/* Desktop SVG Pipeline Diagram */}
          <div className="hidden lg:block relative py-12">
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 1000 60">
              {/* Connecting line */}
              <motion.line
                x1="40"
                y1="30"
                x2="960"
                y2="30"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="2"
                strokeDasharray="920"
                initial={{ strokeDashoffset: 920 }}
                animate={isPipelineInView ? { strokeDashoffset: 0 } : {}}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />

              {/* Connecting pulse */}
              <motion.line
                x1="40"
                y1="30"
                x2="960"
                y2="30"
                stroke="hsl(var(--signal))"
                strokeWidth="2"
                strokeDasharray="80 840"
                initial={{ strokeDashoffset: 920 }}
                animate={isPipelineInView ? { strokeDashoffset: [920, 0] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </svg>

            {/* 8 Pipeline Nodes */}
            <div className="absolute inset-0 flex justify-between items-center px-4">
              {PIPELINE_STEPS.map((step, idx) => {
                const isSelected = selectedNodeIndex === idx;
                return (
                  <div
                    key={step.path}
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setSelectedNodeIndex(idx)}
                    onMouseLeave={() => setSelectedNodeIndex(null)}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(step.path)}
                      className={`w-14 h-14 rounded-lg flex items-center justify-center border transition-all z-10 ${
                        isSelected
                          ? 'bg-signal text-black border-signal scale-110 shadow-lg'
                          : 'bg-secondary/90 text-white border-border hover:border-white/60'
                      }`}
                    >
                      {getIcon(idx)}
                    </button>

                    <span className="mt-3 text-xs font-medium text-foreground tracking-tight text-center">
                      {step.name}
                    </span>

                    {/* Popover Description */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-20 w-52 p-3 rounded-lg bg-black/90 border border-white/20 backdrop-blur-md shadow-2xl z-30 text-left pointer-events-none"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-signal mb-1">
                          Stage {idx + 1} of 8
                        </div>
                        <div className="text-xs font-semibold text-white mb-1">
                          {step.name}
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">
                          {step.description}
                        </p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Pipeline Timeline */}
          <div className="lg:hidden relative border-l-2 border-border/80 ml-4 pl-6 space-y-6">
            {PIPELINE_STEPS.map((step, idx) => (
              <div
                key={step.path}
                onClick={() => navigate(step.path)}
                className="relative cursor-pointer group"
              >
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-signal group-hover:text-black group-hover:border-signal transition-colors">
                  {idx + 1}
                </div>
                <div className="p-3 rounded-lg hairline-card space-y-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>{step.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURE INDEX ===================== */}
      <section className="w-full py-28 px-6 border-t border-border bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-signal font-semibold">
              Platform Features
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-normal tracking-tight">
              Eight dedicated workspaces.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Every tool is engineered for a specific stage of content production. No multi-purpose cluttered menus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PIPELINE_STEPS.map((step, idx) => (
              <div
                key={step.path}
                onClick={() => navigate(step.path)}
                className="hairline-card p-6 flex flex-col justify-between h-64 cursor-pointer group"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-white/5 border border-border flex items-center justify-center text-signal mb-4">
                    {getIcon(idx)}
                  </div>
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">
                    0{idx + 1}
                  </span>
                  <h3 className="font-display text-2xl text-white tracking-tight mt-1 mb-2">
                    {step.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-signal transition-colors pt-4 border-t border-border/40">
                  <span>Open workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== LIVE DEMO STRIP ===================== */}
      <section className="w-full py-28 px-6 border-t border-border bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-border text-xs text-signal font-mono mb-3">
                <span className="w-1.5 h-1.5 rounded-sm bg-signal" />
                Interactive sample
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-white font-normal tracking-tight">
                Test the script-to-footage matcher.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mt-2">
                Type or edit script lines below, then run matching to see how lines bind to timeline segment blocks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/footage')}
              className="text-xs font-semibold uppercase tracking-wider text-signal hover:underline flex items-center gap-1 self-start md:self-end"
            >
              <span>Continue in the full demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hairline-card p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Script input */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                  Script input (one line per spoken statement)
                </label>
                <textarea
                  rows={5}
                  value={sampleScriptText}
                  onChange={(e) => setSampleScriptText(e.target.value)}
                  className="w-full p-4 rounded-md bg-secondary/80 border border-border text-sm text-foreground focus:outline-none focus:border-white/40 font-mono leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleRunMiniMatch}
                  disabled={isMatching}
                  className="px-6 py-2.5 rounded-md bg-white text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isMatching ? 'Running alignment...' : 'Match to footage'}
                </button>
              </div>

              {/* Matched blocks visualizer */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                  Aligned video segments
                </label>
                <div className="min-h-[170px] p-4 rounded-md bg-secondary/40 border border-border flex flex-col justify-center space-y-2.5">
                  {matchedLines.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Click "Match to footage" above to calculate alignment against raw media segments.
                    </div>
                  ) : (
                    matchedLines.map((m, idx) => (
                      <motion.div
                        key={m.lineId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-2.5 rounded-md bg-secondary/90 border border-border text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-muted-foreground">
                            0{idx + 1}
                          </span>
                          <span className="truncate text-white">{m.text}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {m.status === 'matched' && (
                            <span className="px-2 py-0.5 rounded-md bg-ok/20 border border-ok text-ok text-[11px] font-mono">
                              Matched
                            </span>
                          )}
                          {m.status === 'weak' && (
                            <span className="px-2 py-0.5 rounded-md bg-warn/20 border border-warn text-warn text-[11px] font-mono">
                              Weak match
                            </span>
                          )}
                          {m.status === 'missing' && (
                            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-border text-muted-foreground text-[11px] font-mono">
                              No footage found
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW EDITING STAYS EDITABLE ===================== */}
      <section className="w-full py-28 px-6 border-t border-border bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-signal font-semibold">
              Full Creator Control
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-normal tracking-tight">
              How editing stays editable.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              AI recommendations arrive as inspectable timeline layers with an amber outline. Detach any layer into a manual track to take full control.
            </p>
          </div>

          <div className="hairline-card p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Layer state box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Active Timeline Track</span>
                  <span className="font-mono">
                    {isDetached ? 'Layer Mode: Manual' : 'Layer Mode: AI Assistant'}
                  </span>
                </div>

                {/* The Layer Box */}
                <div
                  className={`p-5 rounded-lg transition-all border ${
                    isDetached
                      ? 'bg-secondary border-border text-white'
                      : 'bg-signal/10 border-signal text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-signal" />
                      <span className="font-semibold text-sm">
                        Subtitle Block at 00:14.2
                      </span>
                    </div>
                    {!isDetached ? (
                      <span className="px-2 py-0.5 rounded-md bg-signal text-black font-semibold text-[10px] uppercase tracking-wider">
                        AI Layer
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold text-[10px] uppercase tracking-wider">
                        Manual Layer
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    "Your script already contains the cut points for your video."
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">In: 00:14.2 | Out: 00:17.8</span>
                    <span className={isDetached ? 'text-ok font-medium' : 'text-signal font-medium'}>
                      {isDetached ? 'Detached: Editable by user' : 'Pending verification'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDetached(!isDetached)}
                    className="px-5 py-2.5 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>{isDetached ? 'Revert to AI Layer' : 'Convert to manual'}</span>
                  </button>

                  <span className="text-xs text-muted-foreground">
                    {isDetached ? 'Now fully detached.' : 'Click to detach marker.'}
                  </span>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="space-y-4 md:pl-6 md:border-l border-border/60">
                <h4 className="text-base font-semibold text-white">
                  Why this matters
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-ok flex-shrink-0 mt-0.5" />
                    <span>No locked black boxes. Every cut, subtitle, and crop remains a standard timeline primitive.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-ok flex-shrink-0 mt-0.5" />
                    <span>History tracking shows who made each edit: you or the AI suggestion engine.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-ok flex-shrink-0 mt-0.5" />
                    <span>Convert to manual with one click to adjust words, timecodes, or styling.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA BLOCK ===================== */}
      <section className="w-full py-28 px-6 border-t border-border bg-background relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="font-display text-4xl sm:text-6xl text-white font-normal tracking-tight">
            Start with a script and some footage.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Run the entire content operations loop directly in your browser. All data stays local to your session.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="liquid-glass rounded-md px-10 py-4 text-base font-semibold text-white border border-white/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              Open the demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
