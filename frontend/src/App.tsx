import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Navbar } from './components/shared/Navbar';
import { Footer } from './components/shared/Footer';
import { RequireSession } from './components/shared/RequireSession';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useLenisScrollTrigger } from './story/useLenisScrollTrigger';

// Scroll to top helper on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// The landing stage is native sticky. Its ancestors deliberately avoid transforms.
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/assets" replace />} />
      <Route
        path="/dashboard/:module"
        element={
          <RequireSession>
            <DashboardPage />
          </RequireSession>
        }
      />
      {/* Old top-level routes redirect to /dashboard/<module> */}
      <Route path="/assets" element={<Navigate to="/dashboard/assets" replace />} />
      <Route path="/scripts" element={<Navigate to="/dashboard/scripts" replace />} />
      <Route path="/footage" element={<Navigate to="/dashboard/footage" replace />} />
      <Route path="/clips" element={<Navigate to="/dashboard/clips" replace />} />
      <Route path="/editor" element={<Navigate to="/dashboard/editor" replace />} />
      <Route path="/platforms" element={<Navigate to="/dashboard/platforms" replace />} />
      <Route path="/workflow" element={<Navigate to="/dashboard/workflow" replace />} />
      <Route path="/insights" element={<Navigate to="/dashboard/insights" replace />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  if (isLanding || isDashboard) {
    return <div className="w-full flex-1 flex flex-col">{routes}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full flex-1 flex flex-col"
      >
        {routes}
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-background bg-grid-pattern relative">
      {!isDashboard && <Navbar />}
      <main className="flex-1 flex flex-col">
        <AnimatedRoutes />
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  useLenisScrollTrigger();

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

      <AppContent />
    </BrowserRouter>
  );
};

export default App;
