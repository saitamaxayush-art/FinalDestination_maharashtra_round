import React, { useState, useEffect } from 'react';

const TERMS_SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'acceptable-use', title: '2. Acceptable Use and Conduct' },
  { id: 'user-content', title: '3. Ownership of User Content' },
  { id: 'ai-disclaimer', title: '4. AI Output Review Responsibility' },
  { id: 'intellectual-property', title: '5. Intellectual Property' },
  { id: 'liability', title: '6. Limitation of Liability' },
  { id: 'governing-law', title: '7. Governing Jurisdiction' },
  { id: 'contact', title: '8. Contact Information' },
];

export const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    const handleScroll = () => {
      const offsets = TERMS_SECTIONS.map((s) => {
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
          Legal Terms
        </span>
        <h1 className="font-display text-4xl sm:text-6xl text-white font-normal mt-1 tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          Last updated: [DATE PLACEHOLDER]
          {/* TODO: Add concrete publication date upon commercial distribution */}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sticky Table of Contents */}
        <aside className="lg:col-span-4 sticky top-28 hairline-card p-5 space-y-4">
          <span className="text-xs uppercase tracking-wider text-signal font-semibold block pb-2 border-b border-border/60">
            Table of Contents
          </span>
          <nav className="space-y-1.5 text-xs">
            {TERMS_SECTIONS.map((sec) => (
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
        </aside>

        {/* Content Body */}
        <div className="lg:col-span-8 space-y-12 text-sm text-foreground/90 leading-relaxed">
          <section id="acceptance" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By accessing and operating the CreatorAi demonstration frontend, you acknowledge that this software is an experimental prototype intended solely for workflow demonstration and feature testing.
            </p>
          </section>

          <section id="acceptable-use" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              2. Acceptable Use and Conduct
            </h2>
            <p className="text-muted-foreground">
              You agree not to use this software to process unlawful, defamatory, infringing, or malicious media files. Because processing occurs client-side on your hardware, you are solely responsible for compliance with local media regulations and computational standards.
            </p>
          </section>

          <section id="user-content" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              3. Ownership of User Content
            </h2>
            <p className="text-muted-foreground">
              All user media, including scripts, speech transcripts, video takes, and adapted platform assets, remains your exclusive property. CreatorAi claims zero ownership, license, or distribution rights over files ingested into the local demo client.
            </p>
          </section>

          <section id="ai-disclaimer" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              4. AI Output Review Responsibility
            </h2>
            <p className="text-muted-foreground">
              Simulated or algorithmic timeline edits, speech cut points, transcription alignments, and generated hook texts are provided strictly as recommendations.
            </p>
            <p className="text-muted-foreground">
              Algorithmic outputs may contain timing errors or imprecise segment boundaries. The creator is solely responsible for verifying each edit, subtitle line, and safe zone boundary before distributing content publicly.
            </p>
          </section>

          <section id="intellectual-property" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              5. Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              The user interface code, visual styles, timeline component architecture, and design tokens of CreatorAi belong to CreatorAi. You may not decompile or reverse-engineer proprietary software assets outside permitted open-source licensing terms.
            </p>
          </section>

          <section id="liability" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              This demo is provided "as is" without warranty of any kind, either express or implied. Under no circumstances shall CreatorAi be held liable for any loss of video assets, corrupted project data, or timeline calculation discrepancies resulting from browser cache evictions.
            </p>
          </section>

          <section id="governing-law" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              7. Governing Jurisdiction
            </h2>
            <p className="text-muted-foreground">
              {/* TODO: Specify corporate jurisdiction before commercial agreement execution */}
              These terms shall be construed and governed in accordance with the laws of [JURISDICTION PLACEHOLDER], without regard to conflict of law principles.
            </p>
          </section>

          <section id="contact" className="space-y-3">
            <h2 className="font-display text-3xl text-white">
              8. Contact Information
            </h2>
            <p className="text-muted-foreground">
              For legal inquiries regarding these terms:
            </p>
            <p className="font-mono text-xs text-signal">
              {/* TODO: Insert verified company legal contact email */}
              [CONTACT EMAIL: legal@creatorai.internal]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
