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
  // Global Metrics
  const globalTraces = completedTraces.length;
  const globalErrorRate = globalTraces > 0 ? completedTraces.filter(t => t.hasError).length / globalTraces : 0;
  const globalAvgLatency = globalTraces > 0 ? completedTraces.reduce((a, t) => a + t.durationMs, 0) / globalTraces : 0;
  const globalTokens = completedTraces.reduce((a, t) => a + t.totalTokens, 0);

  const globalErrorColor = globalErrorRate > 0.15 ? "#ef4444" : globalErrorRate > 0.05 ? "#f97316" : "#4ade80";

  // Window Metrics
  const w = currentWindow;
  const winTraces = w?.totalTraces ?? 0;
  const winErrorRate = w?.errorRate ?? 0;
  const winAvgLatency = w?.avgLatencyMs ?? 0;
  const winP95 = w?.p95LatencyMs ?? 0;
  const winTokens = w?.totalTokens ?? 0;
  const winToolCalls = w?.totalToolCalls ?? 0;
  const winTokenTrend = w?.tokenTrend ?? "stable";
  const patternCount = patternAlerts.length;

  const winErrorColor = winErrorRate > 0.15 ? "#ef4444" : winErrorRate > 0.05 ? "#f97316" : "#4ade80";
  const tokenColor = winTokenTrend === "spiking" ? "#ef4444" : winTokenTrend === "rising" ? "#f97316" : "#60a5fa";
  const hasCritical = patternAlerts.some(a => a.severity === "critical");

  const globalCards: MetricCard[] = [
    { label: "TRACES (24H)", value: globalTraces.toLocaleString(), color: "var(--color-content)" },
    { label: "ERROR RATE (24H)", value: globalTraces > 0 ? `${(globalErrorRate * 100).toFixed(1)}%` : "—", color: globalTraces > 0 ? globalErrorColor : "var(--color-dim)" },
    { label: "AVG LATENCY (24H)", value: globalTraces > 0 ? `${Math.round(globalAvgLatency).toLocaleString()}ms` : "—", color: globalTraces > 0 ? "var(--color-purple)" : "var(--color-dim)" },
    { label: "TOKENS (24H)", value: globalTraces > 0 ? globalTokens.toLocaleString() : "—", color: globalTraces > 0 ? "var(--color-blue)" : "var(--color-dim)" },
  ];

  const windowCards: MetricCard[] = [
    { label: "TRACES (LIVE)", value: winTraces.toLocaleString(), color: "var(--color-content)" },
    { label: "ERROR RATE (LIVE)", value: w ? `${(winErrorRate * 100).toFixed(1)}%` : "—", color: w ? winErrorColor : "var(--color-dim)" },
    { label: "AVG LATENCY (LIVE)", value: w ? `${Math.round(winAvgLatency).toLocaleString()}ms` : "—", color: w ? "var(--color-purple)" : "var(--color-dim)" },
    { label: "TOKENS (LIVE)", value: w ? winTokens.toLocaleString() : "—", color: w ? tokenColor : "var(--color-dim)" },
    { label: "TOOL CALLS (LIVE)", value: winTraces > 0 ? winToolCalls.toLocaleString() : "—", color: winTraces > 0 ? "#34d399" : "var(--color-dim)" },
    { label: "PATTERNS (LIVE)", value: patternCount > 0 ? String(patternCount) : "—", color: patternCount > 0 ? "#f59e0b" : "var(--color-dim)", blink: hasCritical },
  ];

  const renderCard = (card: MetricCard, i: number) => (
    <div
      key={i}
      className={`flex flex-col p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm ${card.blink ? "animate-pulse-border" : ""}`}
    >
      <span className="text-[10px] font-semibold tracking-wider text-[var(--color-muted)] mb-1">
        {card.label}
      </span>
      <span
        className="text-lg font-bold leading-none font-mono"
        style={{ color: card.color }}
      >
        {card.value}
      </span>
    </div>
  );

  return (
    <div
      id="metrics-bar"
      className="flex flex-col md:flex-row items-start md:items-center overflow-x-auto overflow-y-hidden bg-zinc-950 border-b border-zinc-800 min-h-[64px] py-2 px-6"
    >
      <div className="flex items-center">
        {globalCards.map(renderCard)}
      </div>
      
      {/* Separator between Global and Live */}
      <div className="hidden md:flex flex-col justify-center px-4">
        <div className="w-0.5 h-10 bg-zinc-800 rounded-sm" />
      </div>

      <div className="flex items-center mt-2 md:mt-0">
        {windowCards.map(renderCard)}
      </div>
    </div>
  );
}
