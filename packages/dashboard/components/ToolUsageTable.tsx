"use client";

import type { AggregatedWindow } from "@/hooks/useWebSocket";

interface ToolUsageTableProps {
  currentWindow: AggregatedWindow | null;
}

export default function ToolUsageTable({ currentWindow }: ToolUsageTableProps) {
  const tools = currentWindow?.toolCallsByName ?? {};
  const entries = Object.entries(tools)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const totalTraces = currentWindow?.totalTraces ?? 1;

  return (
    <div
      className="rounded-lg flex flex-col"
      style={{ background: "#111", border: "1px solid #1a1a1a", height: 240, overflow: "hidden" }}
    >
      <div className="px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <span className="text-[10px] tracking-[2px]" style={{ color: "#444" }}>
          TOOL CALLS (this window)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-[11px] text-center py-8" style={{ color: "#333" }}>
            No tool calls yet
          </div>
        ) : (
          <table className="w-full" style={{ fontSize: 11 }}>
            <thead>
              <tr style={{ color: "#555" }}>
                <th className="text-left font-normal px-3 py-1.5">Tool Name</th>
                <th className="text-right font-normal px-3 py-1.5" style={{ fontFamily: "var(--font-mono)" }}>Calls</th>
                <th className="text-right font-normal px-3 py-1.5" style={{ fontFamily: "var(--font-mono)" }}>/ Trace</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, count], i) => {
                const perTrace = count / totalTraces;
                const isSuspicious = perTrace > 5;
                return (
                  <tr
                    key={name}
                    style={{
                      background: isSuspicious ? "#1a0a0a" : i % 2 === 1 ? "#0d0d0d" : "transparent",
                    }}
                  >
                    <td className="px-3 py-1 truncate" style={{ color: "#ccc", maxWidth: 120 }}>
                      {name}
                    </td>
                    <td
                      className="px-3 py-1 text-right"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: isSuspicious ? "#ef4444" : "#ccc",
                      }}
                    >
                      {count}
                    </td>
                    <td
                      className="px-3 py-1 text-right"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: isSuspicious ? "#ef4444" : "#666",
                      }}
                    >
                      {perTrace.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
