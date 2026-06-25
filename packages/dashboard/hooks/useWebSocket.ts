"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SpanEvent {
  id?: string;
  parentSpanId?: string;
  name: string;
  traceId: string;
  status: { code: number; message?: string };
  durationMs?: number;
  attributes?: Record<string, unknown>;
  events?: Array<{ name: string; timestamp: number; attributes: Record<string, unknown> }>;
  serviceName?: string;
}

export interface TraceCompleteEvent {
  traceId: string;
  durationMs: number;
  spanCount: number;
  hasError: boolean;
  patterns: Record<string, boolean>;
  totalTokens: number;
}

export interface PatternAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: string[];
  affectedTraces: string[];
  metric: number;
}

export interface InsightReport {
  windowId?: number;
  windowStart: string;
  windowEnd: string;
  healthScore: number;
  headline: string;
  summary: string;
  findings: Array<{
    type: string;
    severity: string;
    title: string;
    detail: string;
    metric: string;
    recommendation: string;
  }>;
  tokenAnalysis: { trend: string; concern: string | null; recommendation: string | null };
  latencyAnalysis: {
    assessment: "healthy" | "degraded" | "critical";
    p95Ms: number;
    concern: string | null;
    recommendation: string | null;
  };
  toolAnalysis: { mostUsed: string; concern: string | null; recommendation: string | null };
  watchFor: string[];
}

export interface AggregatedWindow {
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
  tokenTrend: string;
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
}

export interface TraceMetric {
  traceId: string;
  timestamp: number;
  totalDurationMs: number;
  totalTokens: number;
  hasError: boolean;
  models: string[];
  toolCallCount: number;
  spanCount: number;
  patterns: Record<string, boolean>;
}

export interface AgentConfigPublic {
  provider: string;
  model: string;
  hasApiKey: boolean;
  keys?: Record<string, string>;
}

export interface DashboardState {
  connected: boolean;
  spans: SpanEvent[];
  completedTraces: TraceCompleteEvent[];
  patternAlerts: PatternAlert[];
  insights: InsightReport[];
  currentWindow: AggregatedWindow | null;
  recentMetrics: TraceMetric[];
  agentConfig: AgentConfigPublic | null;
  healthScore: number;
}

const MAX_SPANS = 100;
const MAX_ALERTS = 50;

export function useWebSocket(url: string) {
  const [state, setState] = useState<DashboardState>({
    connected: false,
    spans: [],
    completedTraces: [],
    patternAlerts: [],
    insights: [],
    currentWindow: null,
    recentMetrics: [],
    agentConfig: null,
    healthScore: -1,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((s) => ({ ...s, connected: true }));
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        reconnectRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data: unknown };
          handleMessage(msg);
        } catch { /* ignore */ }
      };
    } catch {
      reconnectRef.current = setTimeout(connect, 2000);
    }
  }, [url]);

  const handleMessage = useCallback((msg: { type: string; data: unknown }) => {
    switch (msg.type) {
      case "init": {
        const data = msg.data as {
          recentSpans: SpanEvent[];
          recentMetrics: TraceMetric[];
          recentInsights: InsightReport[];
          currentWindowStats: AggregatedWindow | null;
          agentConfig: AgentConfigPublic;
        };

        const historicalTraces = (data.recentMetrics ?? []).map(m => ({
          traceId: m.traceId,
          durationMs: m.totalDurationMs,
          spanCount: m.spanCount ?? 1,
          hasError: m.hasError,
          patterns: m.patterns,
          totalTokens: m.totalTokens
        }));

        setState((s) => ({
          ...s,
          spans: data.recentSpans ?? [],
          recentMetrics: data.recentMetrics ?? [],
          currentWindow: data.currentWindowStats ?? null,
          completedTraces: historicalTraces,
          insights: data.recentInsights ?? [],
          agentConfig: data.agentConfig,
          healthScore: data.recentInsights?.[0]?.healthScore ?? -1,
        }));
        break;
      }
      case "span": {
        const span = msg.data as SpanEvent;
        setState((s) => ({
          ...s,
          spans: [span, ...s.spans].slice(0, MAX_SPANS),
        }));
        break;
      }
      case "trace:complete": {
        const trace = msg.data as TraceCompleteEvent;
        setState((s) => ({
          ...s,
          completedTraces: [trace, ...s.completedTraces].slice(0, 200),
        }));
        break;
      }
      case "metrics:update": {
        const data = msg.data as { currentWindow: AggregatedWindow };
        setState((s) => ({
          ...s,
          currentWindow: data.currentWindow,
        }));
        break;
      }
      case "pattern:alert": {
        const alert = msg.data as PatternAlert;
        setState((s) => ({
          ...s,
          patternAlerts: [alert, ...s.patternAlerts].slice(0, MAX_ALERTS),
        }));
        break;
      }
      case "insight:ready": {
        const insight = msg.data as InsightReport;
        setState((s) => ({
          ...s,
          insights: [insight, ...s.insights].slice(0, 20),
          healthScore: insight.healthScore,
        }));
        break;
      }
      case "config:updated": {
        const config = msg.data as AgentConfigPublic;
        setState((s) => ({ ...s, agentConfig: config }));
        break;
      }
    }
  }, []);

  const sendMessage = useCallback((type: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { state, sendMessage };
}
