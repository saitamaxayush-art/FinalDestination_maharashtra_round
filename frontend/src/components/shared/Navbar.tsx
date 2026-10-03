import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { LEFT_NAV_ITEMS, RIGHT_NAV_ITEMS, LEGAL_NAV_ITEMS } from '../../config/nav';
import { hasSession } from '../../services/session';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => hasSession());
  const navRef = useRef<HTMLDivElement>(null);
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for session changes
  useEffect(() => {
    const handleSessionChange = () => {
      setIsLoggedIn(hasSession());
    };
    window.addEventListener('creatorai:session-changed', handleSessionChange);
    return () => window.removeEventListener('creatorai:session-changed', handleSessionChange);
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll progress calculation
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close nav on route change
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsOpen(false);
    setIsMobileMenuOpen(false);
  }

  // Close on Escape and outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false);
          logoButtonRef.current?.focus();
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          logoButtonRef.current?.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobileMenuOpen]);

  const toggleNav = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Nav item stagger delays from center outward:
  // LEFT: index 4 (Clips) nearest, index 0 (Home) furthest
  // RIGHT: index 0 (Editor) nearest, index 3 (Insights) furthest
  const leftItemsReversed = [...LEFT_NAV_ITEMS].reverse();

  return (
    <>
      <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          ref={navRef}
          className="liquid-glass rounded-lg pointer-events-auto border border-white/10 shadow-2xl relative"
          initial={false}
          animate={{
            width: isOpen ? 'min(92vw, 1100px)' : '176px',
            height: '52px',
          }}
          transition={{
            type: 'spring',
            stiffness: 220,
            damping: 28,
          }}
        >
          <div className="w-full h-full flex items-center justify-between px-3 relative">
            {/* LEFT LINKS (appear when open, staggered outward from center) */}
            <div className="hidden md:flex items-center space-x-1 flex-1 justify-end pr-5 overflow-hidden">
              <AnimatePresence>
                {isOpen &&
                  leftItemsReversed.map((item, idx) => {
                    const isActive = location.pathname === item.path;
                    // idx 0 is Clips (nearest logo), idx 4 is Home (furthest)
                    const delay = idx * 0.04;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2, delay }}
                        className="relative"
                      >
                        <Link
                          to={item.path}
                          onClick={item.path === '/' ? handleHomeClick : undefined}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors block relative ${
                            isActive
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {item.name}
                          {isActive && (
                            <motion.div
                              layoutId="nav-active-indicator"
                              className="absolute bottom-0 left-2 right-2 h-0.5 bg-signal"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  }).reverse()}
              </AnimatePresence>
            </div>

            {/* CENTER LOGO BUTTON */}
            <div className="flex-shrink-0 flex items-center justify-center mx-auto">
              <button
                ref={logoButtonRef}
                type="button"
                onClick={toggleNav}
                aria-expanded={isOpen || isMobileMenuOpen}
                aria-controls="nav-menu"
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
              >
                {/* Geometric inline SVG mark: play-head and cut-mark */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <polygon points="5 4 15 12 5 20 5 4" fill="white" />
                  <line x1="18" y1="4" x2="18" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="font-display text-2xl tracking-tight text-white leading-none pt-0.5">
                  CreatorAi
                </span>
                <motion.div
                  animate={{ rotate: isOpen || isMobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
            </div>

            {/* RIGHT LINKS & CTA (appear when open, staggered outward from center) */}
            <div className="hidden md:flex items-center space-x-1 flex-1 justify-start pl-5 overflow-hidden">
              <AnimatePresence>
                {isOpen && (
                  <>
                    {RIGHT_NAV_ITEMS.map((item, idx) => {
                      const isActive = location.pathname === item.path;
                      // idx 0 is Editor (nearest logo), idx 3 is Insights
                      const delay = idx * 0.04;
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.2, delay }}
                          className="relative"
                        >
                          <Link
                            to={item.path}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors block relative ${
                              isActive
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.name}
                            {isActive && (
                              <motion.div
                                layoutId="nav-active-indicator"
                                className="absolute bottom-0 left-2 right-2 h-0.5 bg-signal"
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                              />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}

                    {/* Rectangular glass button "Log in" / "Dashboard" */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2, delay: RIGHT_NAV_ITEMS.length * 0.04 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isLoggedIn) {
                            navigate('/dashboard');
                          } else {
                            navigate('/login');
                          }
                        }}
                        className="ml-3 px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <span>{isLoggedIn ? 'Dashboard' : 'Log in'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 1px Scroll progress line along bottom edge of nav container */}
          <div
            className="absolute bottom-0 left-0 h-[1.5px] bg-white/80 transition-all duration-75"
            style={{ width: `${scrollProgress}%` }}
          />
        </motion.div>
      </header>

      {/* MOBILE SPLIT OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex flex-col pointer-events-auto">
            {/* Top/Left half curtains splitting open from center */}
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 bg-background/95 backdrop-blur-xl border-b border-border"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 bg-background/95 backdrop-blur-xl border-t border-border"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Menu content over curtains */}
            <motion.div
              className="relative z-50 flex flex-col justify-between h-full px-6 pt-24 pb-8 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Pipeline 1 - 4
                  </span>
                  {LEFT_NAV_ITEMS.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.04 }}
                    >
                      <Link
                        to={item.path}
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
                          if (item.path === '/') handleHomeClick(e);
                        }}
                        className={`block font-display text-2xl sm:text-3xl tracking-tight py-1 transition-colors ${
                          location.pathname === item.path
                            ? 'text-signal'
                            : 'text-white hover:text-signal'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Pipeline 5 - 8
                  </span>
                  {RIGHT_NAV_ITEMS.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block font-display text-2xl sm:text-3xl tracking-tight py-1 transition-colors ${
                          location.pathname === item.path
                            ? 'text-signal'
                            : 'text-white hover:text-signal'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action and Legal */}
              <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isLoggedIn) {
                      navigate('/dashboard');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-md bg-white text-black font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <span>{isLoggedIn ? 'Dashboard' : 'Log in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {LEGAL_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-white underline underline-offset-4"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
