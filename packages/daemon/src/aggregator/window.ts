import { getMetricsInRange } from '../store/metrics.js';
import { insertAggregatedWindow } from '../store/insights.js';
import { detectPatterns, type AggregatedWindow, type PatternAlert } from './patterns.js';
import type { TraceMetrics } from '../store/metrics.js';

const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class AggregationWindowManager {
  private windowStart: number;
  private previousWindow: AggregatedWindow | null = null;
  private onWindowClose?: (window: AggregatedWindow, alerts: PatternAlert[]) => void;
  private timer: ReturnType<typeof setInterval> | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private onPartialUpdate?: (partial: AggregatedWindow) => void;

  constructor(opts: {
    onWindowClose?: (w: AggregatedWindow, alerts: PatternAlert[]) => void;
    onPartialUpdate?: (partial: AggregatedWindow) => void;
  }) {
    this.windowStart = Date.now();
    this.onWindowClose = opts.onWindowClose;
    this.onPartialUpdate = opts.onPartialUpdate;
  }

  start(): void {
    const msUntilClose = WINDOW_DURATION_MS - (Date.now() - this.windowStart);
    this.timer = setTimeout(() => {
      this.closeWindow();
      // Then set interval for subsequent windows
      this.timer = setInterval(() => this.closeWindow(), WINDOW_DURATION_MS);
    }, msUntilClose);

    // Push partial updates every 60s
    this.updateTimer = setInterval(() => {
      if (this.onPartialUpdate) {
        const partial = this.computeCurrentWindow();
        this.onPartialUpdate(partial);
      }
    }, 60000);
  }

  stop(): void {
    if (this.timer) { clearTimeout(this.timer); clearInterval(this.timer); this.timer = null; }
    if (this.updateTimer) { clearInterval(this.updateTimer); this.updateTimer = null; }
  }

  getWindowStart(): number { return this.windowStart; }

  getWindowEnd(): number { return this.windowStart + WINDOW_DURATION_MS; }

  getTimeRemaining(): number {
    return Math.max(0, this.getWindowEnd() - Date.now());
  }

  computeCurrentWindow(): AggregatedWindow {
    const metrics = getMetricsInRange(this.windowStart, Date.now());
    const window = this.aggregate(metrics, this.windowStart, Date.now());
    window.windowEnd = new Date(this.getWindowEnd()).toISOString();
    return window;
  }

  forceCloseWindow(): void {
    if (this.timer) { clearTimeout(this.timer); clearInterval(this.timer); }
    this.closeWindow();
    this.timer = setInterval(() => this.closeWindow(), WINDOW_DURATION_MS);
  }

  private closeWindow(): void {
    const windowEnd = this.windowStart + WINDOW_DURATION_MS;
    const metrics = getMetricsInRange(this.windowStart, windowEnd);
    const window = this.aggregate(metrics, this.windowStart, windowEnd);
    const alerts = detectPatterns(window);

    // Store in SQLite
    insertAggregatedWindow(window.windowStart, window.windowEnd, window, alerts);

    // Callback
    if (this.onWindowClose) {
      this.onWindowClose(window, alerts);
    }

    // Shift window
    this.previousWindow = window;
    this.windowStart = Date.now();
  }

  private aggregate(metrics: TraceMetrics[], startMs: number, endMs: number): AggregatedWindow {
    const n = metrics.length;
    const durationMin = (endMs - startMs) / 60000;

    if (n === 0) {
      return this.emptyWindow(startMs, endMs, durationMin);
    }

    // Latency
    const latencies = metrics.map(m => m.totalDurationMs).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / n;
    const p50 = latencies[Math.floor(n * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(n * 0.95)] ?? 0;
    const p99 = latencies[Math.floor(n * 0.99)] ?? 0;
    const maxLat = latencies[n - 1] ?? 0;

    // Tokens
    let totalPT = 0, totalCT = 0, totalTT = 0, maxTT = 0;
    for (const m of metrics) {
      totalPT += m.promptTokens; totalCT += m.completionTokens; totalTT += m.totalTokens;
      if (m.totalTokens > maxTT) maxTT = m.totalTokens;
    }

    // Token trend (3 × 5-min sub-windows)
    const tokenTrend = this.computeTokenTrend(metrics, startMs, endMs);

    // Errors
    let totalErrors = 0;
    const errorsByType: Record<string, number> = {};
    for (const m of metrics) {
      if (m.hasError) { totalErrors++; }
      for (const et of m.errorTypes) { errorsByType[et] = (errorsByType[et] ?? 0) + 1; }
    }

    // Tools
    let totalToolCalls = 0;
    const toolsByName: Record<string, number> = {};
    for (const m of metrics) {
      totalToolCalls += m.toolCallCount;
      for (const [name, count] of Object.entries(m.toolCallsPerTool)) {
        toolsByName[name] = (toolsByName[name] ?? 0) + count;
      }
    }

    // Models
    const modelUsage: Record<string, number> = {};
    for (const m of metrics) {
      for (const model of m.models) {
        modelUsage[model] = (modelUsage[model] ?? 0) + 1;
      }
    }

    // Pattern counts
    const pc = { loops: 0, repetitiveTools: 0, tokenSpikes: 0, contextOverflows: 0,
      maxStepsReached: 0, silentFailures: 0, highLatency: 0 };
    for (const m of metrics) {
      if (m.patterns.hasLoop) pc.loops++;
      if (m.patterns.hasRepetitiveTool) pc.repetitiveTools++;
      if (m.patterns.hasTokenSpike) pc.tokenSpikes++;
      if (m.patterns.hasContextOverflow) pc.contextOverflows++;
      if (m.patterns.hasMaxStepsReached) pc.maxStepsReached++;
      if (m.patterns.hasSilentFailure) pc.silentFailures++;
      if (m.patterns.hasHighLatency) pc.highLatency++;
    }

    // Top offenders
    const sorted = [...metrics].sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    const slowest = sorted.slice(0, 5).map(m => ({ traceId: m.traceId, durationMs: m.totalDurationMs, spanCount: m.spanCount }));

    const tokenSorted = [...metrics].sort((a, b) => b.totalTokens - a.totalTokens);
    const highestToken = tokenSorted.slice(0, 5).map(m => ({ traceId: m.traceId, totalTokens: m.totalTokens, model: m.models[0] ?? 'unknown' }));

    const repToolTraces: Array<{ traceId: string; toolName: string; callCount: number }> = [];
    for (const m of metrics) {
      for (const [name, count] of Object.entries(m.toolCallsPerTool)) {
        if (count >= 3) repToolTraces.push({ traceId: m.traceId, toolName: name, callCount: count });
      }
    }
    repToolTraces.sort((a, b) => b.callCount - a.callCount);

    // Compare to previous window
    let vsLastWindow: AggregatedWindow['vsLastWindow'];
    if (this.previousWindow) {
      const latDelta = avgLatency - this.previousWindow.avgLatencyMs;
      const tokDelta = (n > 0 ? totalTT / n : 0) - this.previousWindow.avgTokensPerTrace;
      const errDelta = (n > 0 ? totalErrors / n : 0) - this.previousWindow.errorRate;
      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      if (latDelta > 1000 || errDelta > 0.1) trend = 'degrading';
      else if (latDelta < -1000 || errDelta < -0.1) trend = 'improving';
      vsLastWindow = { latencyDelta: latDelta, tokenDelta: tokDelta, errorRateDelta: errDelta, trend };
    }

    const serviceName = metrics.length > 0 ? metrics[0].serviceName : 'default';

    return {
      serviceName,
      windowStart: new Date(startMs).toISOString(), windowEnd: new Date(endMs).toISOString(),
      durationMinutes: Math.round(durationMin), totalTraces: n, tracesPerMinute: n / durationMin,
      avgLatencyMs: avgLatency, p50LatencyMs: p50, p95LatencyMs: p95, p99LatencyMs: p99, maxLatencyMs: maxLat,
      totalPromptTokens: totalPT, totalCompletionTokens: totalCT, totalTokens: totalTT,
      avgTokensPerTrace: totalTT / n, maxTokensInSingleTrace: maxTT, tokenTrend,
      totalErrors, errorRate: totalErrors / n, errorsByType,
      totalToolCalls, toolCallsByName: toolsByName, avgToolCallsPerTrace: totalToolCalls / n,
      modelUsage, patternCounts: pc,
      slowestTraces: slowest, highestTokenTraces: highestToken, mostRepetitiveToolTraces: repToolTraces.slice(0, 5),
      vsLastWindow,
    };
  }

  private computeTokenTrend(metrics: TraceMetrics[], startMs: number, endMs: number): 'stable' | 'rising' | 'spiking' | 'falling' {
    const duration = endMs - startMs;
    const third = duration / 3;
    const sub1 = metrics.filter(m => m.timestamp < startMs + third);
    const sub3 = metrics.filter(m => m.timestamp >= startMs + 2 * third);
    const avg1 = sub1.length > 0 ? sub1.reduce((a, m) => a + m.totalTokens, 0) / sub1.length : 0;
    const avg3 = sub3.length > 0 ? sub3.reduce((a, m) => a + m.totalTokens, 0) / sub3.length : 0;
    if (avg1 === 0) return 'stable';
    const change = (avg3 - avg1) / avg1;
    if (change > 0.5) return 'spiking';
    if (change > 0.2) return 'rising';
    if (change < -0.2) return 'falling';
    return 'stable';
  }

  private emptyWindow(startMs: number, endMs: number, durationMin: number): AggregatedWindow {
    return {
      serviceName: 'default',
      windowStart: new Date(startMs).toISOString(), windowEnd: new Date(endMs).toISOString(),
      durationMinutes: Math.round(durationMin), totalTraces: 0, tracesPerMinute: 0,
      avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, maxLatencyMs: 0,
      totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0,
      avgTokensPerTrace: 0, maxTokensInSingleTrace: 0, tokenTrend: 'stable',
      totalErrors: 0, errorRate: 0, errorsByType: {},
      totalToolCalls: 0, toolCallsByName: {}, avgToolCallsPerTrace: 0,
      modelUsage: {}, patternCounts: { loops: 0, repetitiveTools: 0, tokenSpikes: 0, contextOverflows: 0, maxStepsReached: 0, silentFailures: 0, highLatency: 0 },
      slowestTraces: [], highestTokenTraces: [], mostRepetitiveToolTraces: [],
    };
  }
}
