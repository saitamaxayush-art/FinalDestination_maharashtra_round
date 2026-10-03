export interface FrameLoaderOptions {
  totalFrames?: number;
  isMobile?: boolean;
  onProgress?: (loaded: number, total: number) => void;
}

export type DrawableFrame = ImageBitmap | HTMLImageElement;

export class FrameLoader {
  private totalFrames: number;
  private isMobile: boolean;
  private onProgress?: (loaded: number, total: number) => void;

  private blobs: (Blob | null)[];
  private bitmaps: (ImageBitmap | null)[];
  private images: (HTMLImageElement | null)[];
  private loaded: boolean[];
  private loadedCount = 0;
  private queue: number[] = [];
  private inFlight = 0;
  private maxConcurrent = 8;
  private lastCenter = -1;
  private destroyed = false;

  constructor(options: FrameLoaderOptions = {}) {
    this.totalFrames = options.totalFrames ?? 408;
    this.isMobile = options.isMobile ?? false;
    this.onProgress = options.onProgress;

    this.blobs = new Array(this.totalFrames + 1).fill(null);
    this.bitmaps = new Array(this.totalFrames + 1).fill(null);
    this.images = new Array(this.totalFrames + 1).fill(null);
    this.loaded = new Array(this.totalFrames + 1).fill(false);

    // Initial preload: frame 1 first
    this.loadFrame(1, true);

    // Queue nearby frames and handoff plate frames
    this.enqueueInitial();
  }

  public setMobile(isMobile: boolean) {
    if (this.isMobile !== isMobile) {
      this.isMobile = isMobile;
      // Clear queue and reload around lastCenter
      this.queue = [];
      if (this.lastCenter > 0) {
        this.prioritizeAround(this.lastCenter);
      }
    }
  }

  private getFrameUrl(idx: number): string {
    const padded = String(idx).padStart(3, '0');
    const folder = this.isMobile ? 'mobile' : 'desktop';
    return `/story/${folder}/f_${padded}.webp`;
  }

  private enqueueInitial() {
    // Initial priority: frames 2 to 40
    for (let i = 2; i <= Math.min(40, this.totalFrames); i++) {
      this.queue.push(i);
    }
    // High priority: handoff plate frames (380 to 408)
    for (let i = Math.max(1, this.totalFrames - 28); i <= this.totalFrames; i++) {
      if (!this.queue.includes(i)) this.queue.push(i);
    }
    // The rest of the frames
    for (let i = 41; i < Math.max(1, this.totalFrames - 28); i++) {
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
      if (up <= this.totalFrames && !this.loaded[up] && !newQueue.includes(up)) {
        newQueue.push(up);
      }
      if (down >= 1 && down !== up && !this.loaded[down] && !newQueue.includes(down)) {
        newQueue.push(down);
      }
    }
    this.queue = newQueue;
    this.processQueue();

    // Manage ImageBitmap decoding window (+/- 40 frames)
    if (Math.abs(center - this.lastCenter) >= 4 || this.lastCenter === -1) {
      this.lastCenter = center;
      this.manageBitmapWindow(center);
    }
  }

  private async manageBitmapWindow(center: number) {
    if (typeof createImageBitmap === 'undefined') return;

    const minF = Math.max(1, center - 40);
    const maxF = Math.min(this.totalFrames, center + 40);

    // Close bitmaps outside the +/- 40 window to protect GPU and system memory
    for (let i = 1; i <= this.totalFrames; i++) {
      if (i < minF || i > maxF) {
        if (i !== 1 && this.bitmaps[i]) {
          try {
            this.bitmaps[i]?.close();
          } catch {
            // ignore
          }
          this.bitmaps[i] = null;
        }
      }
    }

    // Decode bitmaps inside window if we have the blob
    for (let i = minF; i <= maxF; i++) {
      if (this.blobs[i] && !this.bitmaps[i]) {
        try {
          const bmp = await createImageBitmap(this.blobs[i]!);
          if (!this.destroyed && this.lastCenter >= 0 && Math.abs(i - this.lastCenter) <= 45) {
            this.bitmaps[i] = bmp;
          } else {
            bmp.close();
          }
        } catch {
          // ignore
        }
      }
    }
  }

  private processQueue() {
    if (this.destroyed) return;
    while (this.inFlight < this.maxConcurrent && this.queue.length > 0) {
      const idx = this.queue.shift();
      if (idx && !this.loaded[idx]) {
        this.loadFrame(idx);
      }
    }
  }

  private async loadFrame(idx: number, highPriority = false) {
    if (this.loaded[idx] || this.destroyed) return;

    this.inFlight++;
    const url = this.getFrameUrl(idx);

    try {
      const response = await fetch(url, { priority: highPriority ? 'high' : 'auto' } as RequestInit);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      this.blobs[idx] = blob;
      this.loaded[idx] = true;
      this.loadedCount++;
      this.onProgress?.(this.loadedCount, this.totalFrames);

      // Create ImageBitmap if within window or high priority
      if (typeof createImageBitmap !== 'undefined') {
        const center = this.lastCenter > 0 ? this.lastCenter : 1;
        if (highPriority || Math.abs(idx - center) <= 40) {
          createImageBitmap(blob)
            .then((bmp) => {
              if (!this.destroyed) {
                this.bitmaps[idx] = bmp;
              } else {
                bmp.close();
              }
            })
            .catch(() => {});
        }
      } else {
        // Fallback to HTMLImageElement
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        this.images[idx] = img;
      }
    } catch {
      // Fallback with standard Image element if fetch fails
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.onload = () => {
        this.images[idx] = img;
        this.loaded[idx] = true;
        this.loadedCount++;
        this.onProgress?.(this.loadedCount, this.totalFrames);
      };
    } finally {
      this.inFlight--;
      this.processQueue();
    }
  }

  public getFrame(idx: number): DrawableFrame | null {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(idx)));

    // 1. Direct hit in bitmap cache
    if (this.bitmaps[clamped]) {
      return this.bitmaps[clamped];
    }

    // 2. Direct hit in image cache
    if (this.images[clamped]?.complete && this.images[clamped]?.naturalWidth) {
      return this.images[clamped];
    }

    // 3. Fall back to nearest loaded bitmap/image
    for (let offset = 1; offset <= this.totalFrames; offset++) {
      const up = clamped + offset;
      const down = clamped - offset;

      if (up <= this.totalFrames) {
        if (this.bitmaps[up]) return this.bitmaps[up];
        if (this.images[up]?.complete && this.images[up]?.naturalWidth) return this.images[up];
      }
      if (down >= 1) {
        if (this.bitmaps[down]) return this.bitmaps[down];
        if (this.images[down]?.complete && this.images[down]?.naturalWidth) return this.images[down];
      }
    }

    return this.bitmaps[1] || this.images[1] || null;
  }

  public isFrameLoaded(idx: number): boolean {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(idx)));
    return this.loaded[clamped] === true;
  }

  public getProgress(): number {
    return this.totalFrames > 0 ? this.loadedCount / this.totalFrames : 0;
  }

  public isAllLoaded(): boolean {
    return this.loadedCount >= this.totalFrames;
  }

  public destroy() {
    this.destroyed = true;
    this.queue = [];
    for (let i = 1; i <= this.totalFrames; i++) {
      if (this.bitmaps[i]) {
        try {
          this.bitmaps[i]?.close();
        } catch {
          // ignore
        }
        this.bitmaps[i] = null;
      }
      this.blobs[i] = null;
      this.images[i] = null;
    }
  }
}
