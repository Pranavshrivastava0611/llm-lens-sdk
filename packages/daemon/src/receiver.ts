import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { insertTrace, getRecentRawSpans } from './store/traces.js';
import { updateAgentConfig, getAgentConfig } from './store/insights.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IngestSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  status: { code: number; message?: string };
  events: Array<{ name: string; timestamp: number; attributes: Record<string, unknown> }>;
  enqueuedAt: number;
}

export interface IngestPayload {
  spans: IngestSpan[];
  metadata: {
    serviceName: string;
    codebasePath: string;
    sdkVersion: string;
    sentAt: string;
    judgeModel?: {
      provider: string;
      apiKey: string;
      model: string;
    };
  };
}

interface BufferedTrace {
  traceId: string;
  serviceName: string;
  spans: IngestSpan[];
  firstSeen: number;
  lastSeen: number;
  timer: ReturnType<typeof setTimeout>;
}

// ── Span Receiver ────────────────────────────────────────────────────────────

const TRACE_COMPLETION_WINDOW = 5000; // 5s

export class SpanReceiver extends EventEmitter {
  private traceBuffer = new Map<string, BufferedTrace>();

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'POST' && url.pathname === '/ingest') {
      this.handleIngest(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      this.handleHealth(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/config/agent') {
      this.handleGetConfig(res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/config/agent') {
      this.handlePostConfig(req, res);
      return;
    }

    // Serve CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  getBufferedTraceCount(): number {
    return this.traceBuffer.size;
  }

  private recentSpans: Array<any> = [];

  constructor() {
    super();
    // Initialize recent spans from database
    try {
      this.recentSpans = getRecentRawSpans(100);
    } catch {
      // Allow it to fail gracefully if DB isn't ready
    }
  }

  getRecentSpans(): Array<any> {
    return this.recentSpans;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  private handleIngest(req: IncomingMessage, res: ServerResponse): void {
    // Respond 202 immediately
    res.writeHead(202, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ accepted: true }));

    // Process in background
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      setImmediate(() => {
        try {
          const payload: IngestPayload = JSON.parse(body);
          this.processPayload(payload);
        } catch (err) {
          console.error('[daemon] Failed to process ingest payload:', err);
        }
      });
    });
  }

  private handleHealth(res: ServerResponse): void {
    const windowAge = this.emit('getWindowAge') ? 0 : 0; // placeholder
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      status: 'ok',
      bufferedTraces: this.traceBuffer.size,
      windowAge,
      uptime: process.uptime(),
    }));
  }

  private handleGetConfig(res: ServerResponse): void {
    const config = getAgentConfig();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    // Never return apiKey to client
    res.end(JSON.stringify({
      provider: config.provider,
      model: config.model,
      hasApiKey: Boolean(config.keys[config.provider] && config.keys[config.provider].length > 0),
    }));
  }

  private handlePostConfig(req: IncomingMessage, res: ServerResponse): void {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body) as { provider?: string; apiKey?: string; model?: string; keys?: Record<string, string> };

        const validProviders = ['openrouter', 'openai', 'anthropic', 'groq'];
        if (data.provider && !validProviders.includes(data.provider)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Invalid provider' }));
          return;
        }

        const current = getAgentConfig();
        const keys = { ...current.keys };
        if (data.keys) Object.assign(keys, data.keys);
        if (data.apiKey && data.provider) keys[data.provider] = data.apiKey;
        else if (data.apiKey) keys[current.provider] = data.apiKey;

        updateAgentConfig({
          provider: data.provider ?? current.provider,
          keys,
          model: data.model ?? current.model,
        });

        this.emit('config:update', {
          provider: data.provider ?? current.provider,
          model: data.model ?? current.model,
        });

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }

  // ── Span Processing ──────────────────────────────────────────────────────

  private processPayload(payload: IngestPayload): void {
    const { spans, metadata } = payload;

    // Handle judge model config from SDK
    if (metadata.judgeModel) {
      const current = getAgentConfig();
      if (!current.keys[current.provider]) {
        const keys = { ...current.keys };
        keys[metadata.judgeModel.provider] = metadata.judgeModel.apiKey;
        
        updateAgentConfig({
          provider: metadata.judgeModel.provider,
          keys,
          model: metadata.judgeModel.model,
        });
        this.emit('config:update', {
          provider: metadata.judgeModel.provider,
          model: metadata.judgeModel.model,
        });
      }
    }

    for (const span of spans) {
      const spanData = {
        id: span.id,
        parentSpanId: span.parentSpanId,
        name: span.name,
        traceId: span.traceId,
        serviceName: metadata.serviceName,
        status: span.status,
        durationMs: span.endTime ? span.endTime - span.startTime : undefined,
        attributes: span.attributes,
        events: span.events,
      };

      this.recentSpans.unshift(spanData);
      if (this.recentSpans.length > 100) {
        this.recentSpans.pop();
      }

      // Emit for live feed
      this.emit('span', spanData);

      // Buffer by traceId
      this.bufferSpan(span, metadata.serviceName);
    }
  }

  private bufferSpan(span: IngestSpan, serviceName: string): void {
    const existing = this.traceBuffer.get(span.traceId);

    if (existing) {
      existing.spans.push(span);
      existing.lastSeen = Date.now();

      // Reset completion timer
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => {
        this.completeTrace(span.traceId);
      }, TRACE_COMPLETION_WINDOW);
    } else {
      const timer = setTimeout(() => {
        this.completeTrace(span.traceId);
      }, TRACE_COMPLETION_WINDOW);

      this.traceBuffer.set(span.traceId, {
        traceId: span.traceId,
        serviceName,
        spans: [span],
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        timer,
      });
    }
  }

  private completeTrace(traceId: string): void {
    const buffered = this.traceBuffer.get(traceId);
    if (!buffered) return;

    this.traceBuffer.delete(traceId);
    clearTimeout(buffered.timer);

    const spans = buffered.spans;
    const startTimes = spans.map((s) => s.startTime).filter(Boolean);
    const endTimes = spans.map((s) => s.endTime).filter((t): t is number => t != null);

    const minStart = startTimes.length > 0 ? Math.min(...startTimes) : Date.now();
    const maxEnd = endTimes.length > 0 ? Math.max(...endTimes) : Date.now();
    const durationMs = maxEnd - minStart;
    const hasError = spans.some((s) => s.status.code === 2);

    // Store raw trace
    insertTrace({
      traceId,
      serviceName: buffered.serviceName,
      spans: JSON.stringify(spans),
      durationMs,
      spanCount: spans.length,
      hasError,
    });

    // Emit trace:complete for metrics extraction
    this.emit('trace:complete', {
      traceId,
      serviceName: buffered.serviceName,
      spans,
      durationMs,
      spanCount: spans.length,
      hasError,
    });
  }
}
