import React from 'react';
import { useLocation } from 'react-router-dom';
import { PipelineProgress } from './PipelineProgress';
import { NextStepCard } from './NextStepCard';

interface PageShellProps {
  title: string;
  description: string;
  stepNumber?: number;
  nextPageTitle?: string;
  nextPagePath?: string;
  carryOverText?: string;
  nextPageCtaLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  stepNumber,
  nextPageTitle,
  nextPagePath,
  carryOverText,
  nextPageCtaLabel,
  actions,
  children,
}) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  // In dashboard module mode: compact toolbar with actions, no marketing hero or cards
  if (isDashboard) {
    return (
      <div className="w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40 gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl sm:text-2xl text-white tracking-tight">
              {title}
            </span>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        <div className="flex-1 w-full">{children}</div>
      </div>
    );
  }

  // Standalone marketing route view
  return (
    <div className="w-full min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/60">
        <div className="space-y-2">
          {stepNumber && (
            <div className="text-xs uppercase tracking-widest text-signal font-semibold">
              Step {stepNumber} of 8
            </div>
          )}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight text-white leading-none font-normal">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* 8-step pipeline progress */}
      {stepNumber && <PipelineProgress currentStep={stepNumber} />}

      {/* Main interactive workspace */}
      <div className="mt-6">{children}</div>

      {/* Bottom Next step card */}
      {nextPageTitle && nextPagePath && carryOverText && (
        <NextStepCard
          nextPageTitle={nextPageTitle}
          nextPagePath={nextPagePath}
          carryOverText={carryOverText}
          stepNumber={(stepNumber || 1) + 1}
          ctaLabel={nextPageCtaLabel}
        />
      )}
    </div>
  );
};
