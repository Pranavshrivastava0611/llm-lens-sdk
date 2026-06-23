"use client";

import { useMemo } from "react";
import type { TraceCompleteEvent } from "@/hooks/useWebSocket";

interface LatencyChartProps {
  completedTraces: TraceCompleteEvent[];
  p50: number;
  p95: number;
}

export default function LatencyChart({ completedTraces, p50, p95 }: LatencyChartProps) {
  const WIDTH = 100;
  const HEIGHT = 140;
  const PADDING = { top: 10, right: 10, bottom: 20, left: 40 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const data = useMemo(() => {
    if (completedTraces.length === 0) return { p50Line: "", p95Line: "", maxMs: 1000, fillPath: "" };

    const traces = completedTraces.slice(0, 200).reverse(); // oldest first
    const n = traces.length;
    const maxMs = Math.max(1, ...traces.map((t) => t.durationMs)) * 1.1;

    // Compute rolling p50 and p95
    const windowSize = Math.max(3, Math.floor(n / 15));
    const p50Points: Array<{ x: number; y: number }> = [];
    const p95Points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - windowSize);
      const window = traces.slice(start, i + 1).map((t) => t.durationMs).sort((a, b) => a - b);
      const x = PADDING.left + (i / n) * plotW;
      const wp50 = window[Math.floor(window.length * 0.5)] ?? 0;
      const wp95 = window[Math.floor(window.length * 0.95)] ?? window[window.length - 1] ?? 0;
      p50Points.push({ x, y: PADDING.top + plotH - (wp50 / maxMs) * plotH });
      p95Points.push({ x, y: PADDING.top + plotH - (wp95 / maxMs) * plotH });
    }

    const p50Line = p50Points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const p95Line = p95Points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

    // Fill between p50 and p95
    const fillPath =
      p95Points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
      " " +
      p50Points
        .slice()
        .reverse()
        .map((p, i) => `${i === 0 ? "L" : "L"}${p.x},${p.y}`)
        .join(" ") +
      " Z";

    return { p50Line, p95Line, maxMs, fillPath };
  }, [completedTraces]);

  const xLabels = ["60m", "45m", "30m", "15m", "now"];

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{ background: "#111", border: "1px solid #1a1a1a", height: 160 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-widest" style={{ color: "#555" }}>
          LATENCY (p50 / p95)
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 rounded" style={{ background: "#a78bfa" }} />
            <span className="text-[9px]" style={{ color: "#666" }}>p50 {Math.round(p50)}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 rounded" style={{ background: "#f97316" }} />
            <span className="text-[9px]" style={{ color: "#666" }}>p95 {Math.round(p95)}ms</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="flex-1 w-full">
        {/* Y axis */}
        <text x={PADDING.left - 4} y={PADDING.top + 4} textAnchor="end" fill="#444" fontSize="3.5">
          {data.maxMs >= 1000 ? `${(data.maxMs / 1000).toFixed(1)}s` : `${Math.round(data.maxMs)}ms`}
        </text>
        <text x={PADDING.left - 4} y={PADDING.top + plotH} textAnchor="end" fill="#444" fontSize="3.5">
          0
        </text>

        {/* Grid */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={PADDING.left}
            y1={PADDING.top + plotH * (1 - pct)}
            x2={PADDING.left + plotW}
            y2={PADDING.top + plotH * (1 - pct)}
            stroke="#1a1a1a"
            strokeWidth="0.3"
          />
        ))}

        {/* Fill between p50 and p95 */}
        {data.fillPath && <path d={data.fillPath} fill="rgba(249,115,22,0.08)" />}

        {/* p50 line */}
        {data.p50Line && <path d={data.p50Line} fill="none" stroke="#a78bfa" strokeWidth="0.8" />}

        {/* p95 line */}
        {data.p95Line && <path d={data.p95Line} fill="none" stroke="#f97316" strokeWidth="0.8" />}

        {/* X axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={PADDING.left + (i / (xLabels.length - 1)) * plotW}
            y={HEIGHT - 4}
            textAnchor="middle"
            fill="#444"
            fontSize="3"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
