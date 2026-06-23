// ── Types ────────────────────────────────────────────────────────────────────

export interface QueuedSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;   // ms
  endTime?: number;     // ms
  attributes: Record<string, unknown>;
  status: { code: number; message?: string };
  events: Array<{ name: string; timestamp: number; attributes: Record<string, unknown> }>;
  enqueuedAt: number;
}

export interface SpanQueueOptions {
  batchSize: number;
  flushInterval: number;
  maxSpanAge: number;
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
}

type FlushCallback = (spans: QueuedSpan[]) => Promise<void>;

// ── SpanQueue ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: SpanQueueOptions = {
  batchSize: 15,
  flushInterval: 3000,
  maxSpanAge: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  maxQueueSize: 500,
};

export class SpanQueue {
  private queue: QueuedSpan[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private options: SpanQueueOptions;
  private onFlush: FlushCallback;
  private dropCount = 0;
  private isFlushing = false;
  private isShutdown = false;

  constructor(onFlush: FlushCallback, options?: Partial<SpanQueueOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.onFlush = onFlush;
    this.startTimer();
    this.registerShutdownHooks();
  }

  enqueue(span: QueuedSpan): void {
    if (this.isShutdown) return;

    if (this.queue.length >= this.options.maxQueueSize) {
      this.dropCount++;
      if (this.dropCount % 50 === 0) {
        console.warn(
          `[llm-autopilot] Queue full — dropped ${this.dropCount} spans total`
        );
      }
      return;
    }

    this.queue.push(span);

    if (this.queue.length >= this.options.batchSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    try {
      // We no longer drop stale spans; we ensure all spans are exported.

      // Grab a batch
      const batch = this.queue.splice(0, this.options.batchSize);
      if (batch.length === 0) return;

      await this.sendWithRetry(batch);
    } catch {
      // Silently drop — don't crash the host app
    } finally {
      this.isFlushing = false;
    }
  }

  async shutdown(): Promise<void> {
    this.isShutdown = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Flush remaining spans
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.options.batchSize);
      try {
        await this.onFlush(batch);
      } catch {
        break; // Best effort
      }
    }
  }

  get size(): number {
    return this.queue.length;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.timer = setInterval(() => {
      void this.flush();
    }, this.options.flushInterval);

    // Never prevent process exit
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      this.timer.unref();
    }
  }

  private async sendWithRetry(batch: QueuedSpan[]): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        await this.onFlush(batch);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < this.options.maxRetries - 1) {
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn(
      `[llm-autopilot] Failed to export ${batch.length} spans after ${this.options.maxRetries} retries: ${lastError?.message}`
    );
  }

  private registerShutdownHooks(): void {
    const onShutdown = () => {
      void this.shutdown();
    };

    process.once('beforeExit', onShutdown);
    process.once('SIGTERM', onShutdown);
    process.once('SIGINT', onShutdown);
  }
}
