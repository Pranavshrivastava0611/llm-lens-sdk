"use client";

import type { InsightReport } from "@/hooks/useWebSocket";
import InsightDetail from "./InsightDetail";

interface InsightListProps {
  insights: InsightReport[];
  windowEnd: number;
}

export default function InsightList({ insights, windowEnd }: InsightListProps) {
  const latest = insights[0] ?? null;
  const previous = insights.slice(1);

  if (!latest) {
    return <NoInsightsYet windowEnd={windowEnd} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[2px]" style={{ color: "#444" }}>
          AI INSIGHTS
        </span>
        <span className="text-[9px]" style={{ color: "#333" }}>
          Updates every 15 min
        </span>
      </div>

      {/* Latest insight */}
      <div className="relative">
        <InsightDetail insight={latest} />
        {latest.windowId && (
          <div className="absolute top-4 right-4">
            <a
              href={`${process.env.NEXT_PUBLIC_DAEMON_URL || "http://localhost:7777"}/report/download/${latest.windowId}`}
              download
              className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-bold transition-colors border border-blue-500/30 flex items-center gap-2"
            >
              <span>📥</span> Download Full Report
            </a>
          </div>
        )}
      </div>

      {/* Previous insights */}
      {previous.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
          {previous.map((insight, i) => {
            const scoreColor =
              insight.healthScore >= 80 ? "#4ade80" :
              insight.healthScore >= 60 ? "#eab308" :
              insight.healthScore >= 40 ? "#f97316" : "#ef4444";

            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
              >
                <span className="text-xs font-bold" style={{ color: scoreColor }}>
                  {insight.healthScore}
                </span>
                <span className="flex-1 text-[11px] truncate" style={{ color: "#999" }}>
                  {insight.headline}
                </span>
                <span className="text-[9px] flex-shrink-0" style={{ color: "#444" }} suppressHydrationWarning>
                  {new Date(insight.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NoInsightsYet({ windowEnd }: { windowEnd: number }) {
  const now = Date.now();
  const totalMs = 15 * 60 * 1000;
  const elapsed = totalMs - Math.max(0, windowEnd - now);
  const pct = Math.min(100, (elapsed / totalMs) * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[2px]" style={{ color: "#444" }}>
          AI INSIGHTS
        </span>
      </div>
      <div className="rounded-lg p-6 text-center" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
        <div className="text-sm mb-2" style={{ color: "#555" }}>
          First analysis in progress...
        </div>
        <div className="text-xs mb-3" style={{ color: "#333" }}>
          Window {Math.round(pct)}% complete
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
