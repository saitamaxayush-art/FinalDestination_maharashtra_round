import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, CheckCircle2 } from 'lucide-react';

const PRIVACY_SECTIONS = [
  { id: 'browser-processing', title: '1. In-Browser File Processing' },
  { id: 'local-storage', title: '2. Local Storage State' },
  { id: 'no-tracking', title: '3. Zero Analytics and Tracking' },
  { id: 'clear-data', title: '4. Clearing Your Data' },
  { id: 'future-backend', title: '5. Future Cloud Backend Roadmap' },
  { id: 'contact', title: '6. Contact and Inquiries' },
];

export const PrivacyPage: React.FC = () => {
  const { resetAllData } = useStore();
  const [clearedToast, setClearedToast] = useState(false);
  const [activeSection, setActiveSection] = useState('browser-processing');

  const handleClearAll = () => {
    resetAllData();
    setClearedToast(true);
    setTimeout(() => setClearedToast(false), 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const offsets = PRIVACY_SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return { id: s.id, offset: 99999 };
        return { id: s.id, offset: Math.abs(el.getBoundingClientRect().top - 120) };
      });
      offsets.sort((a, b) => a.offset - b.offset);
      if (offsets[0]) setActiveSection(offsets[0].id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-border/80 mb-12">
        <span className="text-xs uppercase tracking-widest text-signal font-semibold">
          Legal & Privacy
        </span>
        <h1 className="font-display text-4xl sm:text-6xl text-white font-normal mt-1 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          Last updated: [DATE PLACEHOLDER]
          {/* TODO: Add concrete publication date once production backend launches */}
        </p>
      </div>

      {clearedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-md bg-secondary border border-ok text-white text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-ok" />
          <span>All local demo data cleared from your browser storage.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sticky Table of Contents */}
        <aside className="lg:col-span-4 sticky top-28 hairline-card p-5 space-y-4">
          <span className="text-xs uppercase tracking-wider text-signal font-semibold block pb-2 border-b border-border/60">
            Table of Contents
          </span>
          <nav className="space-y-1.5 text-xs">
            {PRIVACY_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                  activeSection === sec.id
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {sec.title}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full px-4 py-2 rounded-md bg-warn/15 border border-warn text-warn font-semibold text-xs hover:bg-warn/25 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all local data</span>
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <div className="lg:col-span-8 space-y-12 text-sm text-foreground/90 leading-relaxed">
          <section id="browser-processing" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              1. In-Browser File Processing
            </h2>
            <p className="text-muted-foreground">
              The CreatorAi demo frontend executes entirely within your client browser. When you drag and drop video clips, audio voiceovers, or thumbnail images into the Asset Management library, files are converted to local browser memory object URLs.
            </p>
            <p className="text-muted-foreground">
              No audio, video, script text, or metadata is transmitted across network sockets to external cloud storage or remote servers. Canvas thumbnail generation and audio waveform extractions run on your device CPU and GPU.
            </p>
          </section>

          <section id="local-storage" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              2. Local Storage State
            </h2>
            <p className="text-muted-foreground">
              To allow your work to persist between page reloads and cross-screen pipelines, CreatorAi serializes session configuration, script text, active hook variants, timeline markers, and Kanban cards into your browser's local storage under the key <code>creatorai_demo_state</code>.
            </p>
            <p className="text-muted-foreground">
              This storage is sandboxed to your browser profile. It cannot be accessed by third-party origins or external domains.
            </p>
          </section>

          <section id="no-tracking" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              3. Zero Analytics and Tracking
            </h2>
            <p className="text-muted-foreground">
              This demonstration client contains no telemetry beacons, tracking pixels, session recording cookies, or third-party behavioral analytics SDKs. No identifiers, IP addresses, or device fingerprints are compiled or transmitted.
            </p>
          </section>

          <section id="clear-data" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              4. Clearing Your Data
            </h2>
            <p className="text-muted-foreground">
              You maintain total control over your local data. You may purge all saved assets, custom scripts, video cuts, and workflow logs at any moment by clicking the button below or utilizing your browser's built-in developer tools to clear site data.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2.5 rounded-md bg-warn/15 border border-warn text-warn font-semibold text-xs hover:bg-warn/25 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all local data now</span>
              </button>
            </div>
          </section>

          <section id="future-backend" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              5. Future Cloud Backend Roadmap
            </h2>
            <p className="text-muted-foreground">
              {/* TODO: Update this section when real production microservices replace the mock service layer */}
              [FUTURE CLOUD SPECIFICATION PLACEHOLDER]: When an optional cloud sync backend is introduced, users will be required to authenticate explicitly. File uploads will be encrypted in transit using TLS 1.3 and at rest using standard cloud bucket encryption. No content will ever be used for foundation model training without explicit written creator consent.
            </p>
          </section>

          <section id="contact" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              6. Contact and Inquiries
            </h2>
            <p className="text-muted-foreground">
              For technical inquiries or questions regarding this demo architecture, please contact our engineering team:
            </p>
            <p className="font-mono text-xs text-signal">
              {/* TODO: Insert verified company contact email */}
              [CONTACT EMAIL: support@creatorai.internal]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
