import React, { useState } from 'react';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { generateHooks, generateScript } from '../services/mockAiService';
import { uploadScript, startJob } from '../services/api';
import { HookVariant, HookTechnique } from '../types';
import {
  Sparkles,
  Pin,
  Copy,
  GripVertical,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
} from 'lucide-react';

export const ScriptsPage: React.FC = () => {
  const {
    script,
    setScriptField,
    pinHook,
    updateHookText,
    updateSection,
    reorderSections,
    backendProjectId,
    setBackendJobId,
    setJobState,
  } = useStore();

  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [supportingOpen, setSupportingOpen] = useState(true);

  // Typewriter streaming hooks handler
  const handleGenerateHooks = async () => {
    setIsGeneratingHooks(true);
    const variants = await generateHooks(script.topic, script.audience, script.tone);

    // Stream variants in sequence to simulate typewriter generation
    const streamed: HookVariant[] = [];
    for (let i = 0; i < variants.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      streamed.push(variants[i]);
      setScriptField('hooks', [...streamed]);
    }

    setIsGeneratingHooks(false);
  };

  // Generate full script and supporting content
  const handleGenerateFullScript = async () => {
    setIsGeneratingScript(true);
    const pinned = script.hooks.find((h) => h.id === script.pinnedHookId);
    const res = await generateScript(
      script.topic,
      pinned?.text || script.hooks[0]?.text || '',
      script.tone
    );
    setScriptField('sections', res.sections);
    setScriptField('supportingContent', res.supportingContent);

    if (backendProjectId) {
      try {
        const fullContent = res.sections.map((s: any) => s.content).join('\n\n');
        const scriptRes = await uploadScript(backendProjectId, fullContent);
        
        // Assuming video asset id 1 for mock since we may not have it strictly stored
        const videoAssetId = 1; 
        const jobRes = await startJob(backendProjectId, videoAssetId, scriptRes.id, {});
        setBackendJobId(jobRes.id);
        setJobState(jobRes.status, jobRes.progress || 0);
      } catch (err) {
        console.error('Failed to upload script and start job', err);
      }
    }

    setIsGeneratingScript(false);
  };

  // Drag and drop reordering for sections
  const handleDragStart = (index: number) => {
    setDraggedSectionIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
    const updated = [...script.sections];
    const item = updated.splice(draggedSectionIndex, 1)[0];
    updated.splice(index, 0, item);
    setDraggedSectionIndex(index);
    reorderSections(updated);
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHookId(id);
    setTimeout(() => setCopiedHookId(null), 2000);
  };

  const getTechniqueBadge = (tech: HookTechnique) => {
    switch (tech) {
      case 'question':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/40';
      case 'contrast':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      case 'number':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
      case 'story':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
      case 'direct claim':
        return 'bg-white/10 text-white border-white/20';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <PageShell
      title="Script and Hook Generation"
      description="Frame concepts with high-retention hooks and assemble modular script blocks for speech alignment."
      stepNumber={2}
      nextPageTitle="Footage Match"
      nextPagePath="/footage"
      carryOverText={`Pinned hook "${script.hooks.find((h) => h.id === script.pinnedHookId)?.text.slice(0, 35)}..." and ${script.sections.length} script sections ready for audio-visual matching.`}
      actions={
        <button
          type="button"
          onClick={handleGenerateFullScript}
          disabled={isGeneratingScript}
          className="px-4 py-2 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGeneratingScript ? 'Generating script...' : 'Generate full script'}</span>
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: Input Configuration Form */}
        <div className="hairline-card p-6 space-y-5">
          <div className="pb-3 border-b border-border">
            <span className="text-xs uppercase tracking-wider text-signal font-semibold">
              Script Parameters
            </span>
            <h3 className="font-display text-2xl text-white mt-1">Setup Details</h3>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
              Core Topic / Thesis
            </label>
            <input
              type="text"
              value={script.topic}
              onChange={(e) => setScriptField('topic', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40"
              placeholder="e.g. Editing bottlenecks, timeline mapping"
            />
          </div>

          {/* Audience */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
              Target Audience
            </label>
            <input
              type="text"
              value={script.audience}
              onChange={(e) => setScriptField('audience', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40"
              placeholder="e.g. Video editors, creators, producers"
            />
          </div>

          {/* Tone Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
              Delivery Tone
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-secondary/60 p-1 rounded-md border border-border">
              {(['Direct', 'Casual', 'Technical', 'Energetic'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setScriptField('tone', t)}
                  className={`py-1.5 text-xs rounded-md font-medium transition-colors ${
                    script.tone === t
                      ? 'bg-white text-black font-semibold'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Platform & Target Length */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Platform
              </label>
              <select
                value={script.platform}
                onChange={(e) => setScriptField('platform', e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40"
              >
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Target Length
              </label>
              <input
                type="text"
                value={script.targetLength}
                onChange={(e) => setScriptField('targetLength', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40 font-mono"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateHooks}
            disabled={isGeneratingHooks}
            className="w-full py-2.5 rounded-md bg-signal text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingHooks ? 'Streaming 6 hooks...' : 'Generate 6 hook variants'}</span>
          </button>
        </div>

        {/* RIGHT TWO COLUMNS: Streamed Hook Variants + Script Section Builder */}
        <div className="lg:col-span-2 space-y-8">
          {/* HOOK VARIANTS */}
          <div className="hairline-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                  Hook Variants
                </span>
                <h3 className="font-display text-2xl text-white mt-0.5">
                  Opening Statements
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {script.hooks.length} options generated
              </span>
            </div>

            <div className="space-y-3">
              {script.hooks.map((hook) => {
                const isPinned = hook.id === script.pinnedHookId;
                const isEditing = editingHookId === hook.id;

                return (
                  <div
                    key={hook.id}
                    className={`p-4 rounded-md border transition-all space-y-2.5 ${
                      isPinned
                        ? 'border-signal bg-signal/10'
                        : 'border-border bg-secondary/50 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono border uppercase ${getTechniqueBadge(
                          hook.technique
                        )}`}
                      >
                        {hook.technique}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => pinHook(hook.id)}
                          className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                            isPinned
                              ? 'bg-signal text-black font-semibold'
                              : 'text-muted-foreground hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingHookId(isEditing ? null : hook.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(hook.text, hook.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/10"
                        >
                          {copiedHookId === hook.id ? (
                            <Check className="w-3.5 h-3.5 text-ok" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={hook.text}
                        onChange={(e) => updateHookText(hook.id, e.target.value)}
                        className="w-full p-2 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                        "{hook.text}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCRIPT BUILDER (REORDERABLE CARDS) */}
          <div className="hairline-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                  Script Builder
                </span>
                <h3 className="font-display text-2xl text-white mt-0.5">
                  Timeline Sections
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Drag to reorder sequence
              </span>
            </div>

            <div className="space-y-3">
              {script.sections.map((section, idx) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-md border border-border bg-secondary/70 flex items-start gap-3 transition-colors ${
                    draggedSectionIndex === idx ? 'opacity-40 border-signal' : 'hover:border-white/30'
                  }`}
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white pt-1">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-signal font-semibold">
                        0{idx + 1} &bull; {section.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {section.content.split(' ').length} words
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      className="w-full p-2.5 text-xs rounded-md bg-secondary border border-border/80 text-foreground leading-relaxed focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUPPORTING CONTENT COLLAPSIBLES */}
          {script.supportingContent && (
            <div className="hairline-card p-6 space-y-4">
              <button
                type="button"
                onClick={() => setSupportingOpen(!supportingOpen)}
                className="w-full flex items-center justify-between pb-2 border-b border-border text-left"
              >
                <div>
                  <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                    Supporting Assets
                  </span>
                  <h3 className="font-display text-2xl text-white mt-0.5">
                    Metadata and Titles
                  </h3>
                </div>
                {supportingOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {supportingOpen && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                      Title Options
                    </label>
                    <ul className="space-y-1 text-xs text-white">
                      {script.supportingContent.titles.map((title, i) => (
                        <li key={i} className="p-2 rounded-md bg-secondary/60 border border-border flex items-center justify-between">
                          <span>{title}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(title, `title_${i}`)}
                            className="text-muted-foreground hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                      Description
                    </label>
                    <p className="p-2.5 rounded-md bg-secondary/60 border border-border text-xs text-muted-foreground leading-relaxed">
                      {script.supportingContent.description}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {script.supportingContent.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-white/10 border border-border text-xs text-white">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};
