import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  Video,
  CheckCircle2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Plus,
  Type,
  Link2,
  Scissors,
  MessageSquare,
  Hash,
  RefreshCw,
  Check,
  Cpu,
  ChevronDown,
  Layers,
  UploadCloud,
  Radio,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface NodePosition {
  x: number;
  y: number;
}

export const WorkflowCanvas: React.FC = () => {
  const { addWorkflowCard } = useStore();

  // Dynamic state of the canvas pipeline
  const [topic, setTopic] = useState('AI Marketing & Workflow Automation');
  const [contentType, setContentType] = useState('Short-form Video');
  const [tone, setTone] = useState('Direct & Punchy');
  const [keywords, setKeywords] = useState('agentic workflows, growth, production');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [visualStyle, setVisualStyle] = useState('Cyberpunk Tech');
  const [typography, setTypography] = useState('Outfit / Bold Sans');
  const [seoOptimized, setSeoOptimized] = useState(true);
  const [shortenPacing, setShortenPacing] = useState(false);
  const [hasCustomHashtags, setHasCustomHashtags] = useState(true);
  const [activeTab, setActiveTab] = useState<'caption' | 'blog'>('caption');
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState('CreatorAi Core');
  const [activeTool, setActiveTool] = useState<'select' | 'add' | 'text' | 'connect' | 'cut' | 'comment'>('select');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Canvas node positions (responsive default coordinates)
  const [positions, setPositions] = useState<Record<string, NodePosition>>({
    tools: { x: 30, y: 30 },
    generator: { x: 340, y: 60 },
    visuals: { x: 340, y: 390 },
    editor: { x: 670, y: 190 },
    preview: { x: 990, y: 40 },
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Dynamic hook variations based on topic
  const hookVariations = [
    `90% of creators waste 15 hours a week doing this manually (${topic}). Here is the automated fix:`,
    `Stop editing raw footage by hand. This single AI pipeline handles hooks, cuts, and sync:`,
    `How top content teams ship 30 high-converting clips daily with zero burnout:`,
  ];

  // Dynamic hashtags based on topic
  const hashtags = ['#AiAutomation', '#CreatorEconomy', '#VideoOps', '#AgenticAI'];

  // Trigger pulse effect / regeneration
  const handleRegenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setSelectedHookIndex((prev) => (prev + 1) % hookVariations.length);
      setIsProcessing(false);
      showToast('Pipeline updated with fresh hook variations and pacing.');
    }, 600);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setIsProcessing(true);
    const newTopic = promptInput.trim();
    setTimeout(() => {
      setTopic(newTopic);
      setPromptInput('');
      setIsProcessing(false);
      showToast(`Pipeline reconfigured for: "${newTopic}"`);
    }, 700);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Push to store
  const handlePushToReview = () => {
    addWorkflowCard(
      `${topic.slice(0, 32)}: Automated Production Cut`,
      'Review',
      contentType === 'Short-form Video' ? 'TikTok' : 'YouTube Shorts'
    );
    showToast('Sent to Review Queue! View card in Kanban.');
  };

  // Dynamic port positions for SVG bezier curves
  // Node card widths and heights estimation:
  // tools: 270w, ~330h. Port at x: tools.x + 270, y: tools.y + 160
  // generator: 290w, ~320h. InPort at x: generator.x, y: generator.y + 140; OutPort at x: generator.x + 290, y: generator.y + 160
  // visuals: 290w, ~270h. InPort at x: visuals.x, y: visuals.y + 110; OutPort at x: visuals.x + 290, y: visuals.y + 140
  // editor: 280w, ~330h. InPort1 at x: editor.x, y: editor.y + 110; InPort2 at x: editor.x, y: editor.y + 190; OutPort at x: editor.x + 280, y: editor.y + 150
  // preview: 310w, ~540h. InPort at x: preview.x, y: preview.y + 180

  const pToolsOut = { x: positions.tools.x + 270, y: positions.tools.y + 150 };
  const pGenIn = { x: positions.generator.x, y: positions.generator.y + 140 };
  const pGenOut = { x: positions.generator.x + 290, y: positions.generator.y + 160 };
  const pVisIn = { x: positions.visuals.x, y: positions.visuals.y + 110 };
  const pVisOut = { x: positions.visuals.x + 290, y: positions.visuals.y + 130 };
  const pEditIn1 = { x: positions.editor.x, y: positions.editor.y + 100 };
  const pEditIn2 = { x: positions.editor.x, y: positions.editor.y + 180 };
  const pEditOut = { x: positions.editor.x + 280, y: positions.editor.y + 150 };
  const pPrevIn = { x: positions.preview.x, y: positions.preview.y + 180 };

  const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const handleDragNode = (id: string, info: { point: { x: number; y: number } }) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(1300, info.point.x - rect.left - 130));
    const newY = Math.max(10, Math.min(700, info.point.y - rect.top - 60));
    setPositions((prev) => ({
      ...prev,
      [id]: { x: Math.round(newX), y: Math.round(newY) },
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full">
      {/* LEFT SIDEBAR: In Progress, Ready for Review, Prompt */}
      <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col justify-between space-y-4 bg-secondary/80 border border-border/80 rounded-lg p-4 backdrop-blur-md">
        <div className="space-y-6">
          {/* IN PROGRESS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-mono tracking-wider">
              <span className="font-semibold text-white/80">In Progress</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">3</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-signal/50 transition-colors space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-signal/15 text-signal mt-0.5 flex-shrink-0 animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate">
                        Daily LinkedIn Auto-Post
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">23m ago</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Automatic Post Generator
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-signal/50 transition-colors space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-white/10 text-white mt-0.5 flex-shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate">
                        TikTok Hook Engine
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">14m ago</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Pacing and Subtitle Sync
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-signal/50 transition-colors space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-white/10 text-white mt-0.5 flex-shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate">
                        YouTube Shorts Repurposer
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">6m ago</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Face Tracking and Auto-Cut
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* READY FOR REVIEW SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-mono tracking-wider">
              <span className="font-semibold text-white/80">Ready For Review</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">3</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-white/30 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ok mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-white block leading-snug">
                        Social Post: Top AI Workflows 2026
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Sentiment Score: +14.2 / -1.9
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">1m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">Status:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-signal/20 text-signal border border-signal/40">
                    Review Ready
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-white/30 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ok mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-white block leading-snug">
                        Blog Draft: AI Automation Ops
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Word Count: 1,230
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">3m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">Status:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ok/20 text-ok border border-ok/40">
                    Draft Complete
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/60 border border-border/70 hover:border-white/30 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ok mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-white block leading-snug">
                        Cross-Platform Video Snippet
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Retention Estimate: 78.4%
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">18m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">Status:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white border border-border">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM PROMPT BAR (Inspired by reference bottom left box) */}
        <div className="pt-4 border-t border-border/70 space-y-2">
          <form onSubmit={handlePromptSubmit} className="space-y-2">
            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe your content pipeline or topic..."
              className="w-full p-2.5 text-xs rounded-md bg-background/90 border border-border text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-signal resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-2.5 py-1 text-[11px] rounded-md bg-background border border-border text-white appearance-none pr-6 font-mono focus:outline-none"
                >
                  <option value="CreatorAi Core">CreatorAi Core</option>
                  <option value="GPT-4o">GPT-4o</option>
                  <option value="Claude 3.7">Claude 3.7</option>
                </select>
                <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`p-1.5 rounded-md border text-xs transition-colors ${
                    isMicActive
                      ? 'bg-warn/20 border-warn text-warn'
                      : 'bg-background border-border text-muted-foreground hover:text-white'
                  }`}
                  title={isMicActive ? 'Microphone on' : 'Voice input'}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-md bg-signal text-black font-semibold text-xs hover:bg-signal/90 flex items-center gap-1 disabled:opacity-50"
                  title="Run prompt through pipeline"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* MAIN CANVAS AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/90 border border-border/80 rounded-lg overflow-hidden relative shadow-2xl">
        {/* TOP CANVAS NAVIGATION BAR */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-secondary/40 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              className="font-semibold text-white flex items-center gap-1.5 border-b-2 border-signal pb-1 -mb-1"
            >
              <Cpu className="w-3.5 h-3.5 text-signal" />
              <span>Pipeline Flow</span>
            </button>
            <span className="text-muted-foreground hover:text-white cursor-pointer transition-colors">
              Workflows
            </span>
            <span className="text-muted-foreground hover:text-white cursor-pointer transition-colors">
              Generator
            </span>
            <span className="text-muted-foreground hover:text-white cursor-pointer transition-colors">
              Schedule
            </span>
            <span className="text-muted-foreground hover:text-white cursor-pointer transition-colors">
              Integrations
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-signal/15 border border-signal/40 text-signal text-[10px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-[9999px] bg-signal animate-ping" />
              <span>LIVE PIPELINE</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPositions({
                  tools: { x: 30, y: 30 },
                  generator: { x: 340, y: 60 },
                  visuals: { x: 340, y: 390 },
                  editor: { x: 670, y: 190 },
                  preview: { x: 990, y: 40 },
                });
                showToast('Reset node layout to default.');
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              title="Reset node positions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE WORKSPACE CANVAS (DOT GRID + SVG WIRES + DRAGGABLE NODES) */}
        <div
          ref={canvasRef}
          className="relative w-full h-[760px] overflow-x-auto overflow-y-hidden select-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)', /* ban-ok */
            backgroundSize: '24px 24px',
            backgroundColor: '#021422',
          }}
        >
          {/* SVG BEZIER CONNECTION WIRES */}
          <svg
            className="absolute inset-0 w-[1400px] h-[760px] pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--signal))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--signal))" stopOpacity="1" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Wire 1: Tools -> Generator */}
            <path
              d={getBezierPath(pToolsOut.x, pToolsOut.y, pGenIn.x, pGenIn.y)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />
            <path
              d={getBezierPath(pToolsOut.x, pToolsOut.y, pGenIn.x, pGenIn.y)}
              fill="none"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Wire 2: Tools -> Visuals */}
            <path
              d={getBezierPath(pToolsOut.x, pToolsOut.y, pVisIn.x, pVisIn.y)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />
            <path
              d={getBezierPath(pToolsOut.x, pToolsOut.y, pVisIn.x, pVisIn.y)}
              fill="none"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Wire 3: Generator -> Editor */}
            <path
              d={getBezierPath(pGenOut.x, pGenOut.y, pEditIn1.x, pEditIn1.y)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />
            <path
              d={getBezierPath(pGenOut.x, pGenOut.y, pEditIn1.x, pEditIn1.y)}
              fill="none"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Wire 4: Visuals -> Editor */}
            <path
              d={getBezierPath(pVisOut.x, pVisOut.y, pEditIn2.x, pEditIn2.y)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />
            <path
              d={getBezierPath(pVisOut.x, pVisOut.y, pEditIn2.x, pEditIn2.y)}
              fill="none"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Wire 5: Editor -> Output Preview */}
            <path
              d={getBezierPath(pEditOut.x, pEditOut.y, pPrevIn.x, pPrevIn.y)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2.5"
            />
            <path
              d={getBezierPath(pEditOut.x, pEditOut.y, pPrevIn.x, pPrevIn.y)}
              fill="none"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              filter="url(#glow)"
            />
          </svg>

          {/* INNER WRAPPER FOR NODES AND SVG */}
          <div
            className="relative min-w-[1360px] h-[760px] transition-transform duration-200 origin-top-left"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* NODE 1: TOOLS & INPUTS */}
            <motion.div
              drag
              dragMomentum={false}
              onDrag={(_, info) => handleDragNode('tools', info)}
              style={{ x: positions.tools.x, y: positions.tools.y }}
              className="absolute z-20 w-[270px] rounded-lg bg-secondary/95 border border-white/20 p-4 shadow-xl backdrop-blur-md cursor-grab active:cursor-grabbing space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[9999px] bg-white" />
                  <span className="text-xs font-semibold text-white tracking-wide">Tools</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Source</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs focus:outline-none focus:border-signal"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Content Type
                  </label>
                  <div className="relative">
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs appearance-none pr-6 focus:outline-none"
                    >
                      <option value="Short-form Video">Short-form Video</option>
                      <option value="Social post">Social post</option>
                      <option value="Newsletter">Newsletter</option>
                      <option value="Carousel Breakdown">Carousel Breakdown</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Tone
                  </label>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs appearance-none pr-6 focus:outline-none"
                    >
                      <option value="Direct & Punchy">Direct and Punchy</option>
                      <option value="Professional">Professional</option>
                      <option value="Educational">Educational</option>
                      <option value="Contrarian">Contrarian</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs focus:outline-none focus:border-signal"
                  />
                </div>
              </div>

              {/* Output port handle */}
              <div
                className="absolute -right-2 top-[150px] w-4 h-4 rounded-[9999px] bg-signal border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Output Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>
            </motion.div>

            {/* NODE 2: AI CONTENT GENERATOR */}
            <motion.div
              drag
              dragMomentum={false}
              onDrag={(_, info) => handleDragNode('generator', info)}
              style={{ x: positions.generator.x, y: positions.generator.y }}
              className="absolute z-20 w-[290px] rounded-lg bg-secondary/95 border border-white/20 p-4 shadow-xl backdrop-blur-md cursor-grab active:cursor-grabbing space-y-3"
            >
              {/* Input port handle */}
              <div
                className="absolute -left-2 top-[140px] w-4 h-4 rounded-[9999px] bg-white border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Input Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rotate-45 bg-signal" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    AI Content Generator
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="p-1 rounded hover:bg-white/10 text-signal hover:text-white transition-colors"
                  title="Regenerate hooks"
                >
                  <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 p-1 rounded-md bg-background border border-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('caption')}
                    className={`flex-1 py-1 rounded text-center text-[11px] font-medium transition-colors ${
                      activeTab === 'caption'
                        ? 'bg-signal text-black font-semibold'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    Post Caption
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('blog')}
                    className={`flex-1 py-1 rounded text-center text-[11px] font-medium transition-colors ${
                      activeTab === 'blog'
                        ? 'bg-signal text-black font-semibold'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    Blog Version
                  </button>
                </div>

                {/* Generated Hook Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Select Hook Variation:
                  </span>
                  {hookVariations.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedHookIndex(i)}
                      className={`p-2 rounded-md border text-[11px] cursor-pointer transition-colors ${
                        selectedHookIndex === i
                          ? 'bg-signal/15 border-signal text-white font-medium'
                          : 'bg-background/70 border-border text-muted-foreground hover:text-white'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="font-mono text-[9px] text-signal font-semibold mt-0.5">
                          #{i + 1}
                        </span>
                        <p className="line-clamp-2 leading-relaxed">{h}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output port handle */}
              <div
                className="absolute -right-2 top-[160px] w-4 h-4 rounded-[9999px] bg-signal border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Output Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>
            </motion.div>

            {/* NODE 3: VISUAL & B-ROLL MATCHER */}
            <motion.div
              drag
              dragMomentum={false}
              onDrag={(_, info) => handleDragNode('visuals', info)}
              style={{ x: positions.visuals.x, y: positions.visuals.y }}
              className="absolute z-20 w-[290px] rounded-lg bg-secondary/95 border border-white/20 p-4 shadow-xl backdrop-blur-md cursor-grab active:cursor-grabbing space-y-3"
            >
              {/* Input port handle */}
              <div
                className="absolute -left-2 top-[110px] w-4 h-4 rounded-[9999px] bg-white border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Input Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[9999px] bg-signal" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    Thumbnail and Footage
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Assets</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Upload or Select asset box */}
                <button
                  type="button"
                  onClick={() => showToast('Linked raw footage: "A-Roll Interview Segment #02"')}
                  className="w-full py-2.5 px-3 rounded-md bg-background border border-dashed border-border hover:border-signal flex items-center justify-center gap-2 text-muted-foreground hover:text-white transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-signal" />
                  <span className="text-xs">Upload Image / Footage</span>
                </button>

                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Visual Style
                  </label>
                  <div className="relative">
                    <select
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs appearance-none pr-6 focus:outline-none"
                    >
                      <option value="Cyberpunk Tech">Cyberpunk Tech</option>
                      <option value="Minimal Studio">Minimal Studio</option>
                      <option value="Dark Clean">Dark Clean</option>
                      <option value="Neon Accent">Neon Accent</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                    Typography
                  </label>
                  <div className="relative">
                    <select
                      value={typography}
                      onChange={(e) => setTypography(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white text-xs appearance-none pr-6 focus:outline-none"
                    >
                      <option value="Outfit / Bold Sans">Outfit / Bold Sans</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="Cinematic Serif">Cinematic Serif</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Output port handle */}
              <div
                className="absolute -right-2 top-[130px] w-4 h-4 rounded-[9999px] bg-signal border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Output Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>
            </motion.div>

            {/* NODE 4: EDITOR & TIMELINE */}
            <motion.div
              drag
              dragMomentum={false}
              onDrag={(_, info) => handleDragNode('editor', info)}
              style={{ x: positions.editor.x, y: positions.editor.y }}
              className="absolute z-20 w-[280px] rounded-lg bg-secondary/95 border border-white/20 p-4 shadow-xl backdrop-blur-md cursor-grab active:cursor-grabbing space-y-3"
            >
              {/* Input port 1 (from Gen) */}
              <div
                className="absolute -left-2 top-[100px] w-4 h-4 rounded-[9999px] bg-white border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Input Port 1"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>

              {/* Input port 2 (from Visuals) */}
              <div
                className="absolute -left-2 top-[180px] w-4 h-4 rounded-[9999px] bg-white border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Input Port 2"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[9999px] bg-white" />
                  <span className="text-xs font-semibold text-white tracking-wide">Editor</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Post-Prod</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Action button: Rewrite */}
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="w-full p-2.5 rounded-md bg-background border border-border hover:border-signal flex items-center gap-2 text-left text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-signal" />
                  <span className="font-medium text-xs">Rewrite Hook</span>
                </button>

                {/* Action button: Shorten */}
                <button
                  type="button"
                  onClick={() => setShortenPacing(!shortenPacing)}
                  className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left transition-colors ${
                    shortenPacing
                      ? 'bg-signal/15 border-signal text-white'
                      : 'bg-background border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-signal" />
                    <span className="font-medium text-xs">Shorten Pacing</span>
                  </div>
                  {shortenPacing && <Check className="w-3 h-3 text-signal" />}
                </button>

                {/* Action button: SEO Optimise */}
                <button
                  type="button"
                  onClick={() => setSeoOptimized(!seoOptimized)}
                  className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left transition-colors ${
                    seoOptimized
                      ? 'bg-signal/15 border-signal text-white'
                      : 'bg-background border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-signal" />
                    <span className="font-medium text-xs">SEO Optimise</span>
                  </div>
                  {seoOptimized && <Check className="w-3 h-3 text-signal" />}
                </button>

                {/* Action button: Hashtags */}
                <button
                  type="button"
                  onClick={() => setHasCustomHashtags(!hasCustomHashtags)}
                  className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left transition-colors ${
                    hasCustomHashtags
                      ? 'bg-signal/15 border-signal text-white'
                      : 'bg-background border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-signal" />
                    <span className="font-medium text-xs">Auto Hashtags</span>
                  </div>
                  {hasCustomHashtags && <Check className="w-3 h-3 text-signal" />}
                </button>
              </div>

              {/* Output port handle */}
              <div
                className="absolute -right-2 top-[150px] w-4 h-4 rounded-[9999px] bg-signal border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Output Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>
            </motion.div>

            {/* NODE 5: LIVE OUTPUT PREVIEW (Inspired by reference final card) */}
            <motion.div
              drag
              dragMomentum={false}
              onDrag={(_, info) => handleDragNode('preview', info)}
              style={{ x: positions.preview.x, y: positions.preview.y }}
              className="absolute z-20 w-[320px] rounded-lg bg-secondary/95 border border-white/20 p-4 shadow-xl backdrop-blur-md cursor-grab active:cursor-grabbing space-y-3"
            >
              {/* Input port handle */}
              <div
                className="absolute -left-2 top-[180px] w-4 h-4 rounded-[9999px] bg-white border-2 border-background flex items-center justify-center cursor-pointer shadow-md"
                title="Input Port"
              >
                <div className="w-1.5 h-1.5 rounded-[9999px] bg-black" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[9999px] bg-white" />
                  <span className="text-xs font-semibold text-white tracking-wide">Editor Preview</span>
                </div>
                <span className="text-[10px] font-mono text-signal font-semibold">Ready</span>
              </div>

              {/* STYLIZED MOCKUP VISUAL FRAME (Deep navy tech graphic dark slate frame) */}
              <div className="relative w-full h-[190px] rounded-md overflow-hidden bg-[#071f33] border border-border/80 flex items-center justify-center">
                {/* Background matrix grid and tech accent */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)', /* ban-ok */
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* Cyber figure wireframe / waveform silhouette in amber/white */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center p-3">
                  <div className="w-14 h-14 rounded-lg bg-background/80 border border-signal/40 flex items-center justify-center shadow-lg">
                    <Cpu className="w-7 h-7 text-signal animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-signal font-semibold">
                      {visualStyle}
                    </span>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                      {topic}
                    </p>
                  </div>
                  {/* Audio wave bars */}
                  <div className="flex items-end gap-1 h-4 pt-1">
                    {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-signal/80 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[9px] font-mono text-white">
                  9:16 HD
                </div>
              </div>

              {/* POST PREVIEW */}
              <div className="p-2.5 rounded-md bg-background/80 border border-border/70 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Post Preview
                </span>
                <p className="text-[11px] text-white/90 leading-relaxed font-sans line-clamp-3">
                  {hookVariations[selectedHookIndex]}
                </p>
                {hasCustomHashtags && (
                  <p className="text-[10px] text-signal font-mono font-medium">
                    {hashtags.join(' ')}
                  </p>
                )}
              </div>

              {/* BLOG PREVIEW */}
              <div className="p-2.5 rounded-md bg-background/80 border border-border/70 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="uppercase">Blog Preview</span>
                  <span>1,240 words</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  Automation is fundamentally altering content ops. Here is how modern creator studios eliminate
                  friction across scripting and video cutting.
                </p>
              </div>

              {/* ACTION BUTTON: PUSH TO REVIEW */}
              <button
                type="button"
                onClick={handlePushToReview}
                className="w-full py-2 px-3 rounded-md bg-signal text-black font-semibold text-xs hover:bg-signal/90 flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Send to Review Queue</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* FLOATING BOTTOM TOOL DOCK (Inspired by reference bottom dock) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-lg bg-secondary/90 border border-white/20 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'select'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Select & Move"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('add');
              showToast('Click anywhere on canvas to place a custom pipeline node.');
            }}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'add'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Add Node"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('text');
              showToast('Text tool active: Add note to canvas.');
            }}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'text'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Add Annotation"
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('connect');
              showToast('Cable mode: Click output port then input port.');
            }}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'connect'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Connect Cables"
          >
            <Link2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('cut');
              showToast('Split tool: Click wire to detach.');
            }}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'cut'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Split & Cut"
          >
            <Scissors className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('comment');
              showToast('Comment mode: Click any node to add review feedback.');
            }}
            className={`p-2 rounded-md transition-colors ${
              activeTool === 'comment'
                ? 'bg-signal text-black'
                : 'text-muted-foreground hover:text-white'
            }`}
            title="Comment"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-border/80 mx-0.5" />

          <button
            type="button"
            onClick={() => {
              const newZ = Math.max(0.7, Math.round((zoomLevel - 0.1) * 10) / 10);
              setZoomLevel(newZ);
              showToast(`Zoom: ${Math.round(newZ * 100)}%`);
            }}
            className="p-2 rounded-md text-muted-foreground hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-mono text-muted-foreground px-1 select-none">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => {
              const newZ = Math.min(1.3, Math.round((zoomLevel + 0.1) * 10) / 10);
              setZoomLevel(newZ);
              showToast(`Zoom: ${Math.round(newZ * 100)}%`);
            }}
            className="p-2 rounded-md text-muted-foreground hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* BOTTOM RIGHT TELEMETRY (Inspired by reference bottom right stats) */}
        <div className="absolute bottom-3 right-4 z-20 text-[10px] font-mono text-muted-foreground/80 pointer-events-none flex items-center gap-3">
          <span>T: 0.08s</span>
          <span>I: 0</span>
          <span>N: 5 (10)</span>
          <span>S: 60.24</span>
        </div>

        {/* TOAST FEEDBACK NOTIFICATION */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute top-14 right-4 z-40 px-3 py-2 rounded-md bg-secondary border border-signal text-white text-xs font-mono shadow-xl flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-[9999px] bg-signal" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
