import type { TraceMetrics } from '../store/metrics.js';

export type PatternType =
  | 'token_spike'
  | 'loop_detected'
  | 'repetitive_tool_call'
  | 'error_rate_surge'
  | 'latency_regression'
  | 'context_overflow_cluster'
  | 'model_cost_anomaly'
  | 'silent_failure_cluster'
  | 'max_steps_cluster';

export interface PatternAlert {
  type: PatternType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string[];
  affectedTraces: string[];
  metric: number;
}

export interface AggregatedWindow {
  id?: number;
  serviceName: string;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  totalTraces: number;
  tracesPerMinute: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgTokensPerTrace: number;
  maxTokensInSingleTrace: number;
  tokenTrend: 'stable' | 'rising' | 'spiking' | 'falling';
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  totalToolCalls: number;
  toolCallsByName: Record<string, number>;
  avgToolCallsPerTrace: number;
  modelUsage: Record<string, number>;
  patternCounts: {
    loops: number;
    repetitiveTools: number;
    tokenSpikes: number;
    contextOverflows: number;
    maxStepsReached: number;
    silentFailures: number;
    highLatency: number;
  };
  slowestTraces: Array<{ traceId: string; durationMs: number; spanCount: number }>;
  highestTokenTraces: Array<{ traceId: string; totalTokens: number; model: string }>;
  mostRepetitiveToolTraces: Array<{ traceId: string; toolName: string; callCount: number }>;
  vsLastWindow?: {
    latencyDelta: number;
    tokenDelta: number;
    errorRateDelta: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
}

export function detectPatterns(window: AggregatedWindow): PatternAlert[] {
  const alerts: PatternAlert[] = [];

  if (window.tokenTrend === 'spiking' || window.maxTokensInSingleTrace > 50000 || window.avgTokensPerTrace > 8000) {
    alerts.push({
      type: 'token_spike', severity: window.maxTokensInSingleTrace > 80000 ? 'critical' : 'high',
      title: 'Token Spike Detected',
      description: `Token usage is ${window.tokenTrend}. Max: ${window.maxTokensInSingleTrace}, avg: ${Math.round(window.avgTokensPerTrace)}/trace.`,
      evidence: [`Trend: ${window.tokenTrend}`, `Max: ${window.maxTokensInSingleTrace}`, `Avg: ${Math.round(window.avgTokensPerTrace)}`],
      affectedTraces: window.highestTokenTraces.map(t => t.traceId), metric: window.maxTokensInSingleTrace,
    });
  }

  if (window.patternCounts.loops > 0) {
    alerts.push({
      type: 'loop_detected', severity: window.patternCounts.loops > 3 ? 'critical' : 'high',
      title: 'Loop Behavior Detected',
      description: `${window.patternCounts.loops} traces show looping patterns.`,
      evidence: [`${window.patternCounts.loops} traces with loops`],
      affectedTraces: [], metric: window.patternCounts.loops,
    });
  }

  if (window.patternCounts.repetitiveTools > 0) {
    alerts.push({
      type: 'repetitive_tool_call', severity: 'high',
      title: 'Repetitive Tool Calls',
      description: `${window.patternCounts.repetitiveTools} traces show repetitive tool usage.`,
      evidence: [`${window.patternCounts.repetitiveTools} repetitive traces`],
      affectedTraces: window.mostRepetitiveToolTraces.map(t => t.traceId), metric: window.patternCounts.repetitiveTools,
    });
  }

  if (window.errorRate > 0.15) {
    alerts.push({
      type: 'error_rate_surge', severity: window.errorRate > 0.30 ? 'critical' : 'high',
      title: 'Error Rate Surge',
      description: `Error rate: ${Math.round(window.errorRate * 100)}% (${window.totalErrors}/${window.totalTraces}).`,
      evidence: [`Error rate: ${Math.round(window.errorRate * 100)}%`, `Errors: ${window.totalErrors}`],
      affectedTraces: [], metric: window.errorRate,
    });
  }

  if (window.vsLastWindow && window.vsLastWindow.latencyDelta > 2000 && window.vsLastWindow.trend === 'degrading') {
    alerts.push({
      type: 'latency_regression', severity: 'high',
      title: 'Latency Regression',
      description: `Avg latency increased by ${Math.round(window.vsLastWindow.latencyDelta)}ms.`,
      evidence: [`Delta: +${Math.round(window.vsLastWindow.latencyDelta)}ms`],
      affectedTraces: window.slowestTraces.map(t => t.traceId), metric: window.vsLastWindow.latencyDelta,
    });
  }

  if (window.patternCounts.contextOverflows >= 2) {
    alerts.push({
      type: 'context_overflow_cluster', severity: 'high',
      title: 'Context Overflow Cluster',
      description: `${window.patternCounts.contextOverflows} traces hit context limits.`,
      evidence: [`${window.patternCounts.contextOverflows} overflows`],
      affectedTraces: [], metric: window.patternCounts.contextOverflows,
    });
  }

  if (window.patternCounts.silentFailures >= 3) {
    alerts.push({
      type: 'silent_failure_cluster', severity: 'medium',
      title: 'Silent Failure Cluster',
      description: `${window.patternCounts.silentFailures} traces produced no output.`,
      evidence: [`${window.patternCounts.silentFailures} silent failures`],
      affectedTraces: [], metric: window.patternCounts.silentFailures,
    });
  }

  if (window.patternCounts.maxStepsReached >= 2) {
    alerts.push({
      type: 'max_steps_cluster', severity: 'medium',
      title: 'Max Steps Reached Frequently',
      description: `${window.patternCounts.maxStepsReached} traces hit maxSteps limit.`,
      evidence: [`${window.patternCounts.maxStepsReached} maxSteps events`],
      affectedTraces: [], metric: window.patternCounts.maxStepsReached,
    });
  }

  return alerts;
}

export function detectTracePatterns(metrics: TraceMetrics): PatternAlert[] {
  const alerts: PatternAlert[] = [];
  const p = metrics.patterns;

  if (p.hasLoop) {
    alerts.push({ type: 'loop_detected', severity: 'high', title: 'Loop Detected',
      description: `Trace ${metrics.traceId.slice(0, 8)} shows looping.`,
      evidence: ['Same span 3+ times'], affectedTraces: [metrics.traceId], metric: 1 });
  }
  if (p.hasTokenSpike && metrics.totalTokens > 50000) {
    alerts.push({ type: 'token_spike', severity: metrics.totalTokens > 80000 ? 'critical' : 'high',
      title: 'Token Spike', description: `Trace used ${metrics.totalTokens.toLocaleString()} tokens.`,
      evidence: [`Tokens: ${metrics.totalTokens}`], affectedTraces: [metrics.traceId], metric: metrics.totalTokens });
  }
  if (p.hasContextOverflow) {
    alerts.push({ type: 'context_overflow_cluster', severity: 'high', title: 'Context Overflow',
      description: `Trace hit context limit.`, evidence: ['finishReason: length'],
      affectedTraces: [metrics.traceId], metric: 1 });
  }
  if (p.hasHighLatency && metrics.totalDurationMs > 30000) {
    alerts.push({ type: 'latency_regression', severity: 'high', title: 'Extremely Slow Trace',
      description: `Trace took ${(metrics.totalDurationMs / 1000).toFixed(1)}s.`,
      evidence: [`Duration: ${metrics.totalDurationMs}ms`], affectedTraces: [metrics.traceId], metric: metrics.totalDurationMs });
  }

  return alerts;
}
