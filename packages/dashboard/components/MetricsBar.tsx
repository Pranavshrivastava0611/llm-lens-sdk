"use client";

import type { AggregatedWindow, TraceCompleteEvent, PatternAlert } from "@/hooks/useWebSocket";

interface MetricsBarProps {
  currentWindow: AggregatedWindow | null;
  completedTraces: TraceCompleteEvent[];
  patternAlerts: PatternAlert[];
}

interface MetricCard {
  label: string;
  value: string;
  color: string;
  blink?: boolean;
}

export default function MetricsBar({ currentWindow, completedTraces, patternAlerts }: MetricsBarProps) {
  const w = currentWindow;
  const traceCount = w?.totalTraces ?? completedTraces.length;
  const errorRate = w?.errorRate ?? (completedTraces.length > 0
    ? completedTraces.filter(t => t.hasError).length / completedTraces.length : 0);
  const avgLatency = w?.avgLatencyMs ?? (completedTraces.length > 0
    ? completedTraces.reduce((a, t) => a + t.durationMs, 0) / completedTraces.length : 0);
  const p95 = w?.p95LatencyMs ?? 0;
  const totalTokens = w?.totalTokens ?? completedTraces.reduce((a, t) => a + t.totalTokens, 0);
  const avgTokens = traceCount > 0 ? totalTokens / traceCount : 0;
  const toolCalls = w?.totalToolCalls ?? 0;
  const patternCount = patternAlerts.length;
  const tokenTrend = w?.tokenTrend ?? "stable";

  const errorColor = errorRate > 0.15 ? "#ef4444" : errorRate > 0.05 ? "#f97316" : "#4ade80";
  const tokenColor = tokenTrend === "spiking" ? "#ef4444" : tokenTrend === "rising" ? "#f97316" : "#60a5fa";
  const hasCritical = patternAlerts.some(a => a.severity === "critical");

  const cards: MetricCard[] = [
    { label: "TRACES", value: traceCount.toLocaleString(), color: "#ffffff" },
    { label: "ERROR RATE", value: traceCount > 0 ? `${(errorRate * 100).toFixed(1)}%` : "—", color: traceCount > 0 ? errorColor : "#555" },
    { label: "AVG LATENCY", value: traceCount > 0 ? `${Math.round(avgLatency).toLocaleString()}ms` : "—", color: traceCount > 0 ? "#a78bfa" : "#555" },
    { label: "P95 LATENCY", value: traceCount > 0 ? `${Math.round(p95).toLocaleString()}ms` : "—", color: traceCount > 0 ? "#a78bfa" : "#555" },
    { label: "TOTAL TOKENS", value: traceCount > 0 ? totalTokens.toLocaleString() : "—", color: traceCount > 0 ? "#60a5fa" : "#555" },
    { label: "AVG TOKENS / TRACE", value: traceCount > 0 ? Math.round(avgTokens).toLocaleString() : "—", color: traceCount > 0 ? tokenColor : "#555" },
    { label: "TOOL CALLS", value: traceCount > 0 ? toolCalls.toLocaleString() : "—", color: traceCount > 0 ? "#34d399" : "#555" },
    { label: "PATTERNS", value: traceCount > 0 ? String(patternCount) : "—", color: traceCount > 0 && patternCount > 0 ? "#f59e0b" : "#555", blink: hasCritical },
  ];

  return (
    <div
      id="metrics-bar"
      className="flex items-center overflow-x-auto"
      style={{ height: 56, background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "0 24px" }}
    >
      {cards.map((card, i) => (
        <div key={card.label} className="flex items-center">
          {i > 0 && <div style={{ width: 1, height: 32, background: "#1a1a1a", flexShrink: 0 }} />}
          <div className="flex flex-col items-center justify-center px-5 min-w-[120px]">
            <span
              className={`text-lg font-semibold leading-none font-mono ${card.blink ? "animate-blink" : ""}`}
              style={{ color: card.color }}
            >
              {card.value}
            </span>
            <span className="text-[9px] mt-1 tracking-widest" style={{ color: "#555" }}>
              {card.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
