import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface NextStepCardProps {
  nextPageTitle: string;
  nextPagePath: string;
  carryOverText: string;
  stepNumber: number;
  ctaLabel?: string;
}

export const NextStepCard: React.FC<NextStepCardProps> = ({
  nextPageTitle,
  nextPagePath,
  carryOverText,
  stepNumber,
  ctaLabel,
}) => {
  return (
    <div className="w-full mt-12 mb-6 hairline-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-signal font-semibold">
            Next Pipeline Step: {stepNumber} of 8
          </span>
        </div>
        <h4 className="font-display text-2xl tracking-tight text-white">
          Continue to {nextPageTitle}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {carryOverText}
        </p>
      </div>

      <Link
        to={nextPagePath}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform self-start sm:self-center flex-shrink-0"
      >
        <span>{ctaLabel || `Proceed to ${nextPageTitle}`}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
