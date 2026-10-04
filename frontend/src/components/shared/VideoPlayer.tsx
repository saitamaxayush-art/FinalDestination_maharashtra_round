import React, { forwardRef } from 'react';
import { resolveMediaUrl } from '../../config';

interface VideoPlayerProps {
  src?: string | null;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onPlay, onPause, onEnded }, ref) => {
    const resolvedSrc = resolveMediaUrl(src);

    if (!resolvedSrc) {
      return null;
    }

    return (
      <video
        ref={ref}
        src={resolvedSrc}
        controls
        playsInline
        preload="auto"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
