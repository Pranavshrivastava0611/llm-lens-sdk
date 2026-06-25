"use client";

import { useState, useEffect } from "react";
import type { AggregatedWindow, TraceCompleteEvent, PatternAlert } from "@/hooks/useWebSocket";

interface WindowProgressProps {
  windowStart: number;
  windowEnd: number;
  currentWindow: AggregatedWindow | null;
  completedTraces: TraceCompleteEvent[];
  patternAlerts: PatternAlert[];
  isGenerating: boolean;
}

export default function WindowProgress({
  windowStart, windowEnd, currentWindow, completedTraces, patternAlerts, isGenerating
}: WindowProgressProps) {
  const [pct, setPct] = useState(0);
  const [remaining, setRemaining] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = Date.now();
      const total = windowEnd - windowStart;
      const elapsed = Math.max(0, now - windowStart);
      setPct(Math.min(100, (elapsed / total) * 100));

      const left = Math.max(0, windowEnd - now);
      const min = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowStart, windowEnd]);

  if (!mounted) {
    return (
      <div className="rounded-lg p-3 bg-[var(--color-surface)] border border-[var(--color-border)] h-[210px]">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-2 bg-[var(--color-border)] rounded"></div>
            <div className="space-y-3">
              <div className="h-2 bg-[var(--color-border)] rounded"></div>
              <div className="h-2 bg-[var(--color-border)] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const w = currentWindow;
  const traces = w?.totalTraces ?? completedTraces.length;
  const tokens = w?.totalTokens ?? completedTraces.reduce((a, t) => a + t.totalTokens, 0);
  const errors = w?.totalErrors ?? completedTraces.filter(t => t.hasError).length;
  const patterns = patternAlerts.length;

  const startTime = new Date(windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = new Date(windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-lg p-3 bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[2px] text-[var(--color-dim)] font-semibold">
          CURRENT WINDOW
        </span>
        <span className="text-[10px] text-[var(--color-muted)]">
          {startTime} – {endTime}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden mb-2 bg-[var(--color-panel)] border border-[var(--color-border)]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--color-muted)]">
          {Math.round(pct)}% complete
        </span>
        <span className="text-[11px] font-mono text-[var(--color-dim)]">
          Closes in: {remaining}
        </span>
      </div>

      {/* 2x2 stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <StatCell label="Traces" value={traces.toLocaleString()} color="var(--color-content)" />
        <StatCell label="Tokens" value={tokens.toLocaleString()} color="var(--color-blue)" />
        <StatCell label="Errors" value={String(errors)} color={errors > 0 ? "var(--color-red)" : "var(--color-green)"} />
        <StatCell label="Patterns" value={String(patterns)} color={patterns > 0 ? "var(--color-yellow)" : "var(--color-dim)"} />
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('forceAnalysis'))}
          disabled={isGenerating}
          className={`w-full py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-content)] ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 hover:bg-[var(--color-hover)]'}`}
        >
          {isGenerating ? "ANALYZING..." : "QUICK ANALYSIS"}
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('forceDeepAnalysis'))}
          disabled={isGenerating}
          className={`w-full py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]'}`}
          style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          {isGenerating ? "AGENT WORKING..." : "✨ DEEP AGENTIC ANALYSIS"}
        </button>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md px-2.5 py-1.5 bg-[var(--color-panel)] border border-[var(--color-border)] shadow-sm">
      <div className="text-[9px] tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className="text-sm font-semibold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}
