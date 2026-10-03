import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PIPELINE_STEPS } from '../../config/nav';
import { useStore } from '../../store/useStore';
import { getJobStatus } from '../../services/api';

interface PipelineProgressProps {
  currentStep?: number;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentStep }) => {
  const location = useLocation();
  const { backendJobId, jobStatus, jobProgress, setJobState } = useStore();

  useEffect(() => {
    if (!backendJobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(backendJobId);
        setJobState(status.status, status.progress);
      } catch (err) {
        console.error('Failed to poll job status', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [backendJobId, jobStatus, setJobState]);

  return (
    <div className="w-full my-6 bg-secondary/40 border border-border rounded-lg p-2.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider font-medium">Pipeline Progress</span>
          {backendJobId && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              jobStatus === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
              jobStatus === 'failed' ? 'bg-red-500/15 text-red-400' :
              'bg-blue-500/15 text-blue-400 animate-pulse'
            }`}>
              {jobStatus?.toUpperCase() || 'QUEUED'} {jobProgress > 0 && `(${Math.round(jobProgress)}%)`}
            </span>
          )}
        </div>
        <span>
          Step {currentStep || 1} of {PIPELINE_STEPS.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
        {PIPELINE_STEPS.map((step) => {
          const isActive = location.pathname === step.path || currentStep === step.stepNumber;
          const isPassed = (currentStep || 1) > (step.stepNumber || 1);

          return (
            <Link
              key={step.path}
              to={step.path}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors border ${
                isActive
                  ? 'bg-signal/15 border-signal text-white font-medium shadow-sm'
                  : isPassed
                  ? 'bg-white/5 border-border/80 text-foreground hover:bg-white/10'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-md text-[10px] flex items-center justify-center font-semibold ${
                  isActive
                    ? 'bg-signal text-black'
                    : isPassed
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-muted-foreground'
                }`}
              >
                {step.stepNumber}
              </span>
              <span className="truncate">{step.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
