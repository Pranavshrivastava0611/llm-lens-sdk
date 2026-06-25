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
      className="rounded-lg flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] h-[240px] overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <span className="text-[10px] tracking-[2px] text-[var(--color-dim)] font-semibold">
          TOOL CALLS (this window)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-[11px] text-center py-8 text-[var(--color-dim)]">
            No tool calls yet
          </div>
        ) : (
            <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--color-muted)] border-b border-[var(--color-border)]">
                <th className="text-left font-normal px-3 py-1.5">Tool Name</th>
                <th className="text-right font-normal px-3 py-1.5 font-mono">Calls</th>
                <th className="text-right font-normal px-3 py-1.5 font-mono">/ Trace</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, count], i) => {
                const perTrace = count / totalTraces;
                const isSuspicious = perTrace > 5;
                return (
                  <tr
                    key={name}
                    className={`${isSuspicious ? 'bg-[var(--color-red)]/10' : i % 2 === 1 ? 'bg-[var(--color-panel)]' : 'bg-transparent'}`}
                  >
                    <td className="px-3 py-1 truncate text-[var(--color-content)] max-w-[120px]">
                      {name}
                    </td>
                    <td
                      className={`px-3 py-1 text-right font-mono ${isSuspicious ? 'text-[var(--color-red)]' : 'text-[var(--color-content)]'}`}
                    >
                      {count}
                    </td>
                    <td
                      className={`px-3 py-1 text-right font-mono ${isSuspicious ? 'text-[var(--color-red)]' : 'text-[var(--color-muted)]'}`}
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
