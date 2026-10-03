import React from 'react';
import { StorySection } from '../story/StorySection';

export const LandingPage: React.FC = () => {
  return (
    <div className="w-full bg-background text-foreground relative selection:bg-signal/20 selection:text-white">
      <StorySection />
    </div>
  );
};
