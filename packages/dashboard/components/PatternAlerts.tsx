"use client";

import type { PatternAlert } from "@/hooks/useWebSocket";

interface PatternAlertsProps {
  alerts: PatternAlert[];
}

const PATTERN_ICONS: Record<string, string> = {
  token_spike: "📈",
  loop_detected: "🔄",
  repetitive_tool_call: "🔁",
  error_rate_surge: "🚨",
  latency_regression: "🐢",
  context_overflow_cluster: "📏",
  model_cost_anomaly: "💰",
  silent_failure_cluster: "👻",
  max_steps_cluster: "⚡",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#4ade80",
};

export default function PatternAlerts({ alerts }: PatternAlertsProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] tracking-[2px] text-[var(--color-dim)] font-semibold">
          PATTERN ALERTS
        </span>
        {alerts.length > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: alerts.some((a) => a.severity === "critical") ? "#7f1d1d" : "#78350f",
              color: alerts.some((a) => a.severity === "critical") ? "#fca5a5" : "#fde68a",
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-xs py-3 text-center text-[var(--color-dim)]">
          ✓ No patterns detected this window
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          {alerts.map((alert, i) => {
            const color = SEVERITY_COLORS[alert.severity] ?? "#888";
            const isCritical = alert.severity === "critical";
            return (
              <div
                key={`${alert.type}-${i}`}
                className={`flex-shrink-0 rounded-md p-2.5 animate-slide-in ${isCritical ? "animate-pulse-border" : ""}`}
                style={{
                  width: 240,
                  minHeight: 80,
                  background: `${color}14`,
                  borderLeft: `3px solid ${color}`,
                  border: `1px solid ${color}4d`,
                  borderLeftWidth: 3,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{PATTERN_ICONS[alert.type] ?? "⚠️"}</span>
                  <span className="text-[11px] font-medium text-[var(--color-content)] truncate">{alert.title}</span>
                </div>
                <div className="text-[10px] mb-1.5 truncate text-[var(--color-muted)]">
                  {alert.description.slice(0, 60)}
                  {alert.description.length > 60 ? "…" : ""}
                </div>
                <div className="text-[10px] font-medium" style={{ color }}>
                  {alert.affectedTraces.length > 0
                    ? `${alert.affectedTraces.length} traces affected`
                    : `metric: ${alert.metric}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
