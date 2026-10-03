import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Navbar } from './components/shared/Navbar';
import { Footer } from './components/shared/Footer';

import { LandingPage } from './pages/LandingPage';
import { AssetsPage } from './pages/AssetsPage';
import { ScriptsPage } from './pages/ScriptsPage';
import { FootagePage } from './pages/FootagePage';
import { ClipsPage } from './pages/ClipsPage';
import { EditorPage } from './pages/EditorPage';
import { PlatformsPage } from './pages/PlatformsPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { InsightsPage } from './pages/InsightsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Scroll to top helper on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Animated route transitions: outgoing fades & shifts up 12px, incoming rises
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full flex-1"
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/scripts" element={<ScriptsPage />} />
          <Route path="/footage" element={<FootagePage />} />
          <Route path="/clips" element={<ClipsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/platforms" element={<PlatformsPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />

      {/* Subtle film grain overlay (feTurbulence SVG noise) */}
      <svg className="film-grain" aria-hidden="true">
        <filter id="film-grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain-filter)" />
      </svg>

      {/* Main app container with subtle 1px grid pattern on solid navy */}
      <div className="min-h-screen flex flex-col bg-background bg-grid-pattern relative">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
