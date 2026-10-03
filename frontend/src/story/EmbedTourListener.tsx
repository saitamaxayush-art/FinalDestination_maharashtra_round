import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  clicking: boolean;
}

export const EmbedTourListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmbed = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('embed') === '1');

  const [sliding, setSliding] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    visible: false,
    clicking: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper for smooth spring/lerp cursor movement
  const animateCursorTo = useCallback(
    async (
      targetX: number,
      targetY: number,
      durationMs = 600,
      signal?: AbortSignal
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        const startX = cursor.x;
        const startY = cursor.y;
        const startTime = performance.now();

        const step = (now: number) => {
          if (signal?.aborted) {
            resolve(false);
            return;
          }
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);
          // easeOutCubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const curX = startX + (targetX - startX) * ease;
          const curY = startY + (targetY - startY) * ease;

          setCursor((prev) => ({
            ...prev,
            x: curX,
            y: curY,
            visible: true,
          }));

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve(true);
          }
        };

        requestAnimationFrame(step);
      });
    },
    [cursor.x, cursor.y]
  );

  const simulateClick = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setCursor((prev) => ({ ...prev, clicking: true }));
    await new Promise((r) => setTimeout(r, 120));
    if (signal?.aborted) return;
    setCursor((prev) => ({ ...prev, clicking: false }));
    await new Promise((r) => setTimeout(r, 80));
  }, []);

  const runChapterDemo = useCallback(
    async (route: string) => {
      // Cancel any existing demo
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      // Small pause after slide transition
      await new Promise((r) => setTimeout(r, 350));
      if (signal.aborted) return;

      const store = useStore.getState();

      if (route.startsWith('/assets')) {
        // Assets demo: load sample project, select two assets, open preview drawer
        const sampleBtn = document.querySelector('button[title*="sample" i], button:has(svg.lucide-sparkles)') as HTMLButtonElement | null;
        if (sampleBtn) {
          const rect = sampleBtn.getBoundingClientRect();
          await animateCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 500, signal);
          await simulateClick(signal);
          sampleBtn.click();
        } else {
          store.loadSampleAssets();
        }

        await new Promise((r) => setTimeout(r, 400));
        if (signal.aborted) return;

        // Select asset cards
        const assetCards = document.querySelectorAll('div[data-asset-card="true"], .liquid-glass:has(h3)') as NodeListOf<HTMLElement>;
        if (assetCards.length > 0) {
          const r1 = assetCards[0].getBoundingClientRect();
          await animateCursorTo(r1.left + r1.width / 2, r1.top + r1.height / 2, 450, signal);
          await simulateClick(signal);
          assetCards[0].click();
        }

        if (assetCards.length > 1) {
          await new Promise((r) => setTimeout(r, 250));
          if (signal.aborted) return;
          const r2 = assetCards[1].getBoundingClientRect();
          await animateCursorTo(r2.left + r2.width / 2, r2.top + r2.height / 2, 400, signal);
          await simulateClick(signal);
          assetCards[1].click();
        }

        // Open preview drawer
        const currentAssets = useStore.getState().assets;
        if (currentAssets.length > 0) {
          store.setSelectedAssetId(currentAssets[0].id);
        }
      } else if (route.startsWith('/scripts')) {
        // Scripts demo: type a topic, press Generate hooks, pin one hook
        const topicInput = document.querySelector('input[placeholder*="topic" i], input[type="text"]') as HTMLInputElement | null;
        if (topicInput) {
          const rect = topicInput.getBoundingClientRect();
          await animateCursorTo(rect.left + 50, rect.top + rect.height / 2, 500, signal);
          await simulateClick(signal);
          topicInput.focus();
          topicInput.value = 'How to edit videos 3x faster';
          topicInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await new Promise((r) => setTimeout(r, 300));
        if (signal.aborted) return;

        const genBtn = document.querySelector('button:has(svg.lucide-sparkles), button:contains("Generate")') as HTMLButtonElement | null;
        if (genBtn) {
          const rect = genBtn.getBoundingClientRect();
          await animateCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 450, signal);
          await simulateClick(signal);
          genBtn.click();
        }

        await new Promise((r) => setTimeout(r, 500));
        if (signal.aborted) return;

        // Pin one hook
        const hooks = store.script.hooks;
        if (hooks.length > 0) {
          store.pinHook(hooks[0].id);
        }
      } else if (route.startsWith('/footage')) {
        // Footage match: run matching
        const matchBtn = document.querySelector('button:has(svg.lucide-sparkles), button:has(svg.lucide-scan-eye)') as HTMLButtonElement | null;
        if (matchBtn) {
          const rect = matchBtn.getBoundingClientRect();
          await animateCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 500, signal);
          await simulateClick(signal);
          matchBtn.click();
        }
      } else if (route.startsWith('/clips')) {
        // Clips demo: press find clips, accept two
        const findClipsBtn = document.querySelector('button:has(svg.lucide-sparkles), button:has(svg.lucide-scissors)') as HTMLButtonElement | null;
        if (findClipsBtn) {
          const rect = findClipsBtn.getBoundingClientRect();
          await animateCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 500, signal);
          await simulateClick(signal);
          findClipsBtn.click();
        }

        await new Promise((r) => setTimeout(r, 400));
        if (signal.aborted) return;

        const clips = store.clips;
        if (clips.length > 0) store.acceptClip(clips[0].id);
        if (clips.length > 1) store.acceptClip(clips[1].id);
      } else if (route.startsWith('/editor')) {
        // Editor demo: apply two AI suggestions, then convert one to manual
        const suggestions = store.aiSuggestions;
        if (suggestions.length > 0) {
          store.applyAiSuggestion(suggestions[0].id);
        }
        await new Promise((r) => setTimeout(r, 300));
        if (signal.aborted) return;
        if (suggestions.length > 1) {
          store.applyAiSuggestion(suggestions[1].id);
        }
        await new Promise((r) => setTimeout(r, 300));
        if (signal.aborted) return;
        const layers = store.editorLayers;
        if (layers.length > 0) {
          store.convertLayerToManual(layers[0].id);
        }
      } else if (route.startsWith('/platforms')) {
        // Platforms demo: switch between platform tabs
        const tabs = document.querySelectorAll('button[role="tab"], button:has(svg.lucide-smartphone)') as NodeListOf<HTMLButtonElement>;
        for (let i = 0; i < Math.min(3, tabs.length); i++) {
          if (signal.aborted) return;
          const rect = tabs[i].getBoundingClientRect();
          await animateCursorTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 350, signal);
          await simulateClick(signal);
          tabs[i].click();
          await new Promise((r) => setTimeout(r, 200));
        }
      } else if (route.startsWith('/workflow')) {
        // Workflow demo: drag/move one card from Edit to Review
        const cards = store.workflowCards;
        if (cards.length > 0) {
          store.moveWorkflowCard(cards[0].id, 'Review');
        }
      } else if (route.startsWith('/insights')) {
        // Insights demo: load labeled sample data
        store.loadSampleInsights();
      }

      // Hide cursor after demo completion
      await new Promise((r) => setTimeout(r, 500));
      if (!signal.aborted) {
        setCursor((prev) => ({ ...prev, visible: false }));
      }
    },
    [animateCursorTo, simulateClick]
  );

  // Message listener from parent story window
  useEffect(() => {
    if (!isEmbed) return;

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'story:go') {
        const route = data.route as string;
        if (route && location.pathname !== route) {
          // Trigger quick horizontal slide transition with shared 1px white line
          setSliding(true);
          const targetUrl = route + (route.includes('?') ? '&embed=1' : '?embed=1');
          navigate(targetUrl, { replace: true });

          setTimeout(() => {
            setSliding(false);
          }, 320);
        }

        if (data.play) {
          runChapterDemo(route);
        }
      } else if (data.type === 'story:reset') {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setCursor((prev) => ({ ...prev, visible: false, clicking: false }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEmbed, location.pathname, navigate, runChapterDemo]);

  if (!isEmbed) return null;

  return (
    <>
      {/* Horizontal slide transition overlay with shared 1px white line */}
      <AnimatePresence>
        {sliding && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] pointer-events-none flex"
          >
            {/* 1px crisp white leading line */}
            <div className="w-[1px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div className="flex-1 bg-black/40 backdrop-blur-[2px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost Cursor (Small SVG arrow moving with spring ease, never emoji) */}
      {cursor.visible && (
        <div
          className="fixed pointer-events-none z-[120] transform -translate-x-1 -translate-y-1 transition-transform"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: `translate3d(0, 0, 0) scale(${cursor.clicking ? 0.88 : 1})`,
            transition: 'transform 0.08s ease-out',
          }}
        >
          {/* Subtle click ripple */}
          {cursor.clicking && (
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-md border border-white/80 animate-ping pointer-events-none" />
          )}

          {/* SVG Arrow Cursor */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
          >
            <path
              d="M4 4l7 18 3.5-7.5L22 11 4 4z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </>
  );
};
