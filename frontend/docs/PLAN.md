# CreatorAi Frontend Demo Plan

## 1. Overview & Architecture
CreatorAi is an AI-powered content operations platform for creators. This demo frontend is animation-rich, responsive, and completely functional with simulated AI services, shared Zustand state persisted to localStorage, and strict adherence to design constraints (no gradients/purples/em dashes/emojis/pill buttons/fake metrics).

## 2. Directory & Component Structure
- `src/types/index.ts`
  - Core interfaces for Assets, Scripts, Footage Segments, Clips, Editor Tracks/Layers, Platforms, Workflow Cards, and Insights.
- `src/config/nav.ts`
  - Central source of truth for the 8 pipeline stages and legal links.
- `src/config/platforms.ts`
  - Platform dimensions, safe zones, and limits with documentation verification notice.
- `src/services/mockAiService.ts`
  - Typed simulated async services with realistic latency and deterministic mock data.
- `src/store/useStore.ts`
  - Unified Zustand store managing all demo state, persisted to localStorage, with sample data loaders and a full reset method.
- `src/components/shared/`
  - `Navbar.tsx`: Expanding glass nav with centered logo, staggered links, scroll indicator, and mobile curtain overlay.
  - `Footer.tsx`: Simple copyright, brand, and clean links.
  - `PageShell.tsx`: Standard page wrapper with Instrument Serif headers and pipeline progress.
  - `PipelineProgress.tsx`: 8-step interactive pipeline tracker.
  - `NextStepCard.tsx`: Context-aware next stage navigation card showing state carry-over.
  - `HairlineCard.tsx`: Card surface with CSS white hairline sweep on hover.
  - `MagneticButton.tsx`: Magnetic CTA button with subtle pointer follow (max 6px).
- `src/pages/`
  - `LandingPage.tsx`: Hero video, animated SVG pipeline diagram, feature cards, mini matcher demo strip, editable layer demo.
  - `AssetsPage.tsx`: Drag-and-drop file ingestion, canvas video/audio thumbnails, folders, metadata drawer, sample data loader.
  - `ScriptsPage.tsx`: Controls, 6 streamed hooks with typewriter effect & technique tags, reorderable script builder, supporting content.
  - `FootagePage.tsx`: Split-screen script to timeline matcher with animated SVG connectors, scrubbing, and manual drag reassignment.
  - `ClipsPage.tsx`: Timeline with waveform, staged progress clip detector, 9:16 cards with trim handles, accept/reject.
  - `EditorPage.tsx`: Multi-track timeline, AI suggestions with amber outline, convert to manual action, history undo/redo.
  - `PlatformsPage.tsx`: Dynamic aspect ratio preview, safe zone guides, reframe crop tool, side-by-side compare, workflow exporter.
  - `WorkflowPage.tsx`: 7-column Kanban board, drag-and-drop, Month calendar view, card detail drawer with real activity logs.
  - `InsightsPage.tsx`: Honest metrics dashboard (empty by default), CSV importer, Recharts with flat single colors, observations panel, data table toggle.
  - `PrivacyPage.tsx` & `TermsPage.tsx`: Sticky table of contents, bracketed placeholders, working "Clear all local data" button.
  - `NotFoundPage.tsx`: 404 error page matching theme.

## 3. Implementation Steps
1. Configure Tailwind, CSS variables, Google Fonts (`Instrument Serif` & `Inter`), liquid glass, and keyframe animations.
2. Build data types, navigation config, and mock service layer.
3. Build the Zustand store with localStorage persistence and cross-page data hydration.
4. Implement shared layout components: Navbar, PipelineProgress, NextStepCard, Footer, HairlineCard.
5. Implement Landing Page and all 8 feature pages + 2 legal pages + 404 page.
6. Verify no violations of hard bans (check for em dashes, rounded-full on buttons, emoji, purple gradients).
7. Run TypeScript build and linter to ensure zero errors.
8. Test all routes, interactions, and responsive states in the browser.
