import React from 'react';
import { Link } from 'react-router-dom';
import { PIPELINE_STEPS, LEGAL_NAV_ITEMS } from '../../config/nav';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {

  return (
    <footer className="w-full border-t border-border bg-background py-16 px-6 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand column */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="5 4 15 12 5 20 5 4" fill="white" />
              <line x1="18" y1="4" x2="18" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-3xl tracking-tight text-white">
              CreatorAi
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Content operations platform for video creators. Given a script and raw footage, it matches speech to video moments, extracts short-form clips, and adapts aspect ratios per platform.
          </p>
          <div className="pt-2">
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-border text-xs text-muted-foreground font-mono">
              In-browser demonstration client
            </span>
          </div>
        </div>

        {/* Product pipeline links */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-white mb-4">
            Production Pipeline
          </h4>
          <ul className="space-y-2.5 text-sm">
            {PIPELINE_STEPS.map((step) => (
              <li key={step.path}>
                <Link
                  to={step.path}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  {step.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal & System links */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-white mb-4">
            Legal and System
          </h4>
          <ul className="space-y-2.5 text-sm">
            {LEGAL_NAV_ITEMS.map((legal) => (
              <li key={legal.path}>
                <Link
                  to={legal.path}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  {legal.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/assets"
                className="text-signal hover:underline"
              >
                Launch workspace demo
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>
          Copyright {CURRENT_YEAR} CreatorAi demo. All rights reserved.
        </div>
        <div className="text-muted-foreground/80">
          Client-side state stored in local storage. No external server tracking.
        </div>
      </div>
    </footer>
  );
};
