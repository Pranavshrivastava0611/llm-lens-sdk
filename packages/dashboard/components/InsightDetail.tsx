"use client";

import type { InsightReport } from "@/hooks/useWebSocket";

interface InsightDetailProps {
  insight: InsightReport;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#4ade80",
  info: "#60a5fa",
};

export default function InsightDetail({ insight }: InsightDetailProps) {
  const scoreColor =
    insight.healthScore >= 80 ? "#4ade80" :
    insight.healthScore >= 60 ? "#eab308" :
    insight.healthScore >= 40 ? "#f97316" : "#ef4444";

  const latColor =
    insight.latencyAnalysis.assessment === "healthy" ? "#4ade80" :
    insight.latencyAnalysis.assessment === "degraded" ? "#eab308" : "#ef4444";

  return (
    <div className="rounded-lg p-4" style={{ background: "#111", border: "1px solid #222" }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-sm"
          style={{
            width: 36, height: 36,
            border: `2px solid ${scoreColor}`,
            color: scoreColor,
          }}
        >
          {insight.healthScore}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-snug">{insight.headline}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "#555" }} suppressHydrationWarning>
            {new Date(insight.windowStart).toLocaleTimeString()} — {new Date(insight.windowEnd).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#aaa" }}>
        {insight.summary}
      </p>

      {/* Findings */}
      {insight.findings.length > 0 && (
        <div className="mb-3">
          {insight.findings.slice(0, 4).map((f, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: SEVERITY_COLORS[f.severity] ?? "#888" }}
              />
              <div className="min-w-0">
                <div className="text-xs text-white">{f.title}</div>
                <div className="text-[11px]" style={{ color: "#666" }}>{f.detail}</div>
                {f.recommendation && (
                  <div className="text-[11px]" style={{ color: "#4ade80" }}>→ {f.recommendation}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Watch For */}
      {insight.watchFor.length > 0 && (
        <div className="rounded-md p-2.5 mb-3" style={{ background: "#0d1117" }}>
          <div className="text-[10px] mb-1.5 font-medium" style={{ color: "#555" }}>
            Watch for next window:
          </div>
          {insight.watchFor.map((item, i) => (
            <div key={i} className="text-[11px] leading-relaxed" style={{ color: "#888" }}>
              → {item}
            </div>
          ))}
        </div>
      )}

      {/* Analysis cards */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-md px-2.5 py-2" style={{ background: "#0d0d0d" }}>
          <div className="text-[9px] tracking-wider mb-1" style={{ color: "#555" }}>TOKENS</div>
          <div className="text-[11px]" style={{ color: "#60a5fa" }}>
            Trend: {insight.tokenAnalysis.trend}
          </div>
          {insight.tokenAnalysis.concern && (
            <div className="text-[10px] mt-0.5" style={{ color: "#f97316" }}>{insight.tokenAnalysis.concern}</div>
          )}
        </div>
        <div className="flex-1 rounded-md px-2.5 py-2" style={{ background: "#0d0d0d" }}>
          <div className="text-[9px] tracking-wider mb-1" style={{ color: "#555" }}>LATENCY</div>
          <div className="text-[11px]" style={{ color: latColor }}>
            {insight.latencyAnalysis.assessment} · p95: {Math.round(insight.latencyAnalysis.p95Ms)}ms
          </div>
        </div>
        <div className="flex-1 rounded-md px-2.5 py-2" style={{ background: "#0d0d0d" }}>
          <div className="text-[9px] tracking-wider mb-1" style={{ color: "#555" }}>TOOLS</div>
          <div className="text-[11px]" style={{ color: "#34d399" }}>
            Top: {insight.toolAnalysis.mostUsed || "none"}
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] mt-3 text-right" style={{ color: "#444" }} suppressHydrationWarning>
        Generated at {new Date(insight.windowEnd).toLocaleTimeString()}
      </div>
    </div>
  );
}
