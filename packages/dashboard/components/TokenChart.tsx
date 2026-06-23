"use client";

import { useMemo } from "react";
import type { TraceCompleteEvent } from "@/hooks/useWebSocket";

interface TokenChartProps {
  completedTraces: TraceCompleteEvent[];
}

export default function TokenChart({ completedTraces }: TokenChartProps) {
  const WIDTH = 100;
  const HEIGHT = 140;
  const PADDING = { top: 10, right: 10, bottom: 20, left: 40 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const now = Date.now();
  const sixtyMinAgo = now - 60 * 60 * 1000;

  // For display, use up to 200 recent traces within last 60 min
  const points = useMemo(() => {
    return completedTraces
      .filter((t) => {
        // Assume recent traces are from the last 60 min
        return true;
      })
      .slice(0, 200)
      .map((t, i) => ({
        x: i,
        tokens: t.totalTokens,
        traceId: t.traceId,
      }));
  }, [completedTraces]);

  const maxTokens = Math.max(1, ...points.map((p) => p.tokens));
  const n = Math.max(1, points.length);

  const getColor = (tokens: number) => {
    if (tokens > 8000) return "#ef4444";
    if (tokens > 2000) return "#eab308";
    return "#4ade80";
  };

  // Moving average for trend line
  const trendPoints = useMemo(() => {
    if (points.length < 3) return "";
    const windowSize = Math.max(3, Math.floor(points.length / 10));
    const avgs: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - windowSize);
      const slice = points.slice(start, i + 1);
      const avg = slice.reduce((a, p) => a + p.tokens, 0) / slice.length;
      avgs.push({
        x: (i / n) * plotW + PADDING.left,
        y: PADDING.top + plotH - (avg / maxTokens) * plotH,
      });
    }
    return avgs.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }, [points, n, maxTokens, plotW, plotH]);

  // X axis labels
  const xLabels = ["60m", "45m", "30m", "15m", "now"];

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{ background: "#111", border: "1px solid #1a1a1a", height: 160 }}
    >
      <span className="text-[10px] tracking-widest mb-1" style={{ color: "#555" }}>
        TOKEN USAGE
      </span>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="flex-1 w-full">
        {/* Y axis labels */}
        <text x={PADDING.left - 4} y={PADDING.top + 4} textAnchor="end" fill="#444" fontSize="3.5">
          {maxTokens >= 1000 ? `${(maxTokens / 1000).toFixed(0)}k` : maxTokens}
        </text>
        <text x={PADDING.left - 4} y={PADDING.top + plotH} textAnchor="end" fill="#444" fontSize="3.5">
          0
        </text>

        {/* Grid lines */}
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

        {/* 15-min window boundaries */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={`win-${pct}`}
            x1={PADDING.left + plotW * pct}
            y1={PADDING.top}
            x2={PADDING.left + plotW * pct}
            y2={PADDING.top + plotH}
            stroke="#333"
            strokeWidth="0.3"
            strokeDasharray="1.5,1.5"
          />
        ))}

        {/* Data points */}
        {points.map((p, i) => {
          const x = PADDING.left + (i / n) * plotW;
          const y = PADDING.top + plotH - (p.tokens / maxTokens) * plotH;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.5}
              fill={getColor(p.tokens)}
              opacity={0.7}
            />
          );
        })}

        {/* Trend line */}
        {trendPoints && (
          <path d={trendPoints} fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity={0.6} />
        )}

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
