import { SpanQueue, type QueuedSpan } from '../queue/SpanQueue.js';
import { SpanExporter } from './exporter.js';

let idCounter = 0;
function generateId(): string {
  return `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Span Builder ─────────────────────────────────────────────────────────────

export interface SpanOptions {
  name: string;
  traceId?: string;
  parentSpanId?: string;
  attributes?: Record<string, unknown>;
}

export class AutopilotSpan {
  readonly id: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  readonly attributes: Record<string, unknown>;
  status: { code: number; message?: string } = { code: 0 };
  events: Array<{ name: string; timestamp: number; attributes: Record<string, unknown> }> = [];

  constructor(options: SpanOptions) {
    this.id = generateId();
    this.traceId = options.traceId ?? generateTraceId();
    this.parentSpanId = options.parentSpanId;
    this.name = options.name;
    this.startTime = Date.now();
    this.attributes = options.attributes ?? {};
  }

  setAttribute(key: string, value: unknown): this {
    this.attributes[key] = value;
    return this;
  }

  addEvent(name: string, attributes: Record<string, unknown> = {}): this {
    this.events.push({ name, timestamp: Date.now(), attributes });
    return this;
  }

  setStatus(code: number, message?: string): this {
    this.status = { code, message };
    return this;
  }

  end(): void {
    this.endTime = Date.now();
  }

  toQueuedSpan(): QueuedSpan {
    return {
      id: this.id,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      attributes: { ...this.attributes },
      status: { ...this.status },
      events: this.events.map((e) => ({
        name: e.name,
        timestamp: e.timestamp,
        attributes: { ...e.attributes },
      })),
      enqueuedAt: Date.now(),
    };
  }
}

// ── Processor ────────────────────────────────────────────────────────────────

export class AutopilotSpanProcessor {
  private queue: SpanQueue;

  constructor(exporter: SpanExporter) {
    this.queue = new SpanQueue((spans) => exporter.export(spans));
  }

  onStart(_span: AutopilotSpan): void {
    // no-op
  }

  onEnd(span: AutopilotSpan): void {
    // Skip internal otel spans
    if (span.name.startsWith('otel.')) return;

    span.end();
    const queued = span.toQueuedSpan();
    this.queue.enqueue(queued);
  }

  async shutdown(): Promise<void> {
    await this.queue.shutdown();
  }

  get queueSize(): number {
    return this.queue.size;
  }
}
