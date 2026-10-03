import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen pt-36 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
      <div className="space-y-4">
        <span className="text-xs uppercase tracking-widest text-signal font-mono">
          404 Error: Page Not Found
        </span>
        <h1 className="font-display text-5xl sm:text-7xl text-white font-normal tracking-tight">
          Lost in the timeline.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The requested URL does not match any route in the content operations pipeline. Use the navigation bar above or return to the landing overview.
        </p>

        <div className="pt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-md bg-secondary border border-border text-white text-xs font-semibold hover:bg-white/10 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-md bg-white text-black text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
