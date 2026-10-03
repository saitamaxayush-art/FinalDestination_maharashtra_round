export interface FrameLoaderOptions {
  totalFrames?: number;
  isMobile?: boolean;
  onProgress?: (loaded: number, total: number) => void;
}

export class FrameLoader {
  private totalFrames: number;
  private isMobile: boolean;
  private onProgress?: (loaded: number, total: number) => void;

  private images: (HTMLImageElement | null)[];
  private loaded: boolean[];
  private loadedCount = 0;
  private queue: number[] = [];
  private inFlight = 0;
  private maxConcurrent = 6;
  private lastDecodedCenter = -1;
  private destroyed = false;

  constructor(options: FrameLoaderOptions = {}) {
    this.totalFrames = options.totalFrames ?? 204;
    this.isMobile = options.isMobile ?? false;
    this.onProgress = options.onProgress;

    this.images = new Array(this.totalFrames + 1).fill(null);
    this.loaded = new Array(this.totalFrames + 1).fill(false);

    // Initial preload: frame 1 first
    this.loadFrame(1, true);

    // Queue nearby frames and idle frames
    this.enqueueInitial();
  }

  public setMobile(isMobile: boolean) {
    if (this.isMobile !== isMobile) {
      this.isMobile = isMobile;
      // Reload current frame set if needed
    }
  }

  private getFrameUrl(idx: number): string {
    const padded = String(idx).padStart(3, '0');
    const folder = this.isMobile ? 'mobile' : 'desktop';
    return `/story/${folder}/f_${padded}.webp`;
  }

  private enqueueInitial() {
    // Initial priority: frames 1 to 20
    for (let i = 2; i <= Math.min(25, this.totalFrames); i++) {
      this.queue.push(i);
    }
    // Handoff plate frames (185 to 204) are also high priority
    for (let i = 185; i <= this.totalFrames; i++) {
      if (!this.queue.includes(i)) this.queue.push(i);
    }
    // The rest
    for (let i = 26; i < 185; i++) {
      if (!this.queue.includes(i)) this.queue.push(i);
    }
    this.processQueue();
  }

  public prioritizeAround(centerIdx: number) {
    if (this.destroyed) return;
    const center = Math.max(1, Math.min(this.totalFrames, Math.round(centerIdx)));

    // Reorder queue: outward from center
    const newQueue: number[] = [];
    for (let offset = 0; offset <= this.totalFrames; offset++) {
      const up = center + offset;
      const down = center - offset;
      if (up <= this.totalFrames && !this.loaded[up] && !this.queue.includes(up)) {
        newQueue.push(up);
      }
      if (down >= 1 && down !== up && !this.loaded[down] && !this.queue.includes(down)) {
        newQueue.push(down);
      }
    }
    this.queue = newQueue;
    this.processQueue();

    // Call img.decode() for window of +/- 30 frames around current frame
    if (Math.abs(center - this.lastDecodedCenter) > 8) {
      this.lastDecodedCenter = center;
      const minF = Math.max(1, center - 30);
      const maxF = Math.min(this.totalFrames, center + 30);
      for (let i = minF; i <= maxF; i++) {
        const img = this.images[i];
        if (img && img.complete && 'decode' in img) {
          img.decode().catch(() => {});
        }
      }
    }
  }

  private processQueue() {
    if (this.destroyed) return;
    while (this.inFlight < this.maxConcurrent && this.queue.length > 0) {
      const idx = this.queue.shift();
      if (idx && !this.loaded[idx] && !this.images[idx]) {
        this.loadFrame(idx);
      }
    }
  }

  private loadFrame(idx: number, highPriority = false) {
    if (this.images[idx] || this.destroyed) return;

    this.inFlight++;
    const img = new Image();
    img.decoding = highPriority ? 'sync' : 'async';
    img.src = this.getFrameUrl(idx);

    img.onload = () => {
      this.inFlight--;
      this.loaded[idx] = true;
      this.images[idx] = img;
      this.loadedCount++;
      this.onProgress?.(this.loadedCount, this.totalFrames);
      this.processQueue();
    };

    img.onerror = () => {
      this.inFlight--;
      // Retry once at idle or ignore
      this.processQueue();
    };

    this.images[idx] = img;
  }

  public getFrame(idx: number): HTMLImageElement | null {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(idx)));
    if (this.loaded[clamped] && this.images[clamped]) {
      return this.images[clamped];
    }
    // Fall back to nearest loaded frame so canvas is never blank
    for (let offset = 1; offset <= this.totalFrames; offset++) {
      const up = clamped + offset;
      const down = clamped - offset;
      if (up <= this.totalFrames && this.loaded[up] && this.images[up]) {
        return this.images[up];
      }
      if (down >= 1 && this.loaded[down] && this.images[down]) {
        return this.images[down];
      }
    }
    return this.images[1] || null;
  }

  public isFrameLoaded(idx: number): boolean {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(idx)));
    return this.loaded[clamped] === true;
  }

  public getProgress(): number {
    return this.totalFrames > 0 ? this.loadedCount / this.totalFrames : 0;
  }

  public destroy() {
    this.destroyed = true;
    this.queue = [];
    this.images = [];
  }
}
