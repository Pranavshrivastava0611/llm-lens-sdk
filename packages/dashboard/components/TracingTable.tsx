"use client";

import { useMemo, useState } from "react";
import type { SpanEvent } from "@/hooks/useWebSocket";
import { Filter, Search, ChevronDown, Activity, XCircle, CheckCircle2 } from "lucide-react";

interface TracingTableProps {
  spans: SpanEvent[];
  onSpanClick: (span: SpanEvent) => void;
}

export default function TracingTable({ spans, onSpanClick }: TracingTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "error" | "success">("all");

  // Group spans into traces
  const traces = useMemo(() => {
    const traceMap = new Map<string, SpanEvent[]>();
    spans.forEach(s => {
      if (!traceMap.has(s.traceId)) traceMap.set(s.traceId, []);
      traceMap.get(s.traceId)!.push(s);
    });

    const getSpanTime = (s: SpanEvent) => s.events?.[0]?.timestamp ?? Date.now();

    return Array.from(traceMap.values()).map(traceSpans => {
      // Sort to find root (earliest start time or no parentSpanId)
      traceSpans.sort((a, b) => getSpanTime(a) - getSpanTime(b));
      const root = traceSpans.find(s => !s.parentSpanId) || traceSpans[0];
      
      const isError = traceSpans.some(s => s.status?.code === 2);
      
      const totalTokens = traceSpans.reduce((sum, s) => {
        const pt = (s.attributes?.['ai.usage.inputTokens'] ?? s.attributes?.['ai.usage.promptTokens'] ?? 0) as number;
        const ct = (s.attributes?.['ai.usage.outputTokens'] ?? s.attributes?.['ai.usage.completionTokens'] ?? 0) as number;
        return sum + pt + ct;
      }, 0);

      const startTime = getSpanTime(root);
      const endTime = Math.max(...traceSpans.map(s => {
        const start = getSpanTime(s);
        return start + (s.durationMs ?? 0);
      }));
      const durationMs = endTime - startTime;

      return {
        traceId: root.traceId,
        rootSpan: root,
        spanCount: traceSpans.length,
        isError,
        totalTokens,
        durationMs,
        timestamp: startTime
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [spans]);

  const filteredTraces = useMemo(() => {
    return traces.filter(t => {
      if (statusFilter === "error" && !t.isError) return false;
      if (statusFilter === "success" && t.isError) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.rootSpan.name.toLowerCase().includes(q) && 
            !t.traceId.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [traces, searchQuery, statusFilter]);

  const truncateString = (str: string, maxLen: number) => {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  };

  const getPreview = (str: string | undefined, type: 'input' | 'output') => {
    if (!str) return '—';
    try {
      const parsed = JSON.parse(str);
      return truncateString(JSON.stringify(parsed), 100);
    } catch {
      return truncateString(str, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] overflow-hidden shadow-2xl">
      {/* Header Toolbar (Langfuse Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-dim)]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traces by name or ID..." 
              className="w-full md:w-[320px] bg-[var(--color-panel)] border border-[var(--color-border)] text-sm text-[var(--color-content)] pl-9 pr-3 py-1.5 rounded-md outline-none focus:border-[var(--color-blue)] font-mono transition-colors"
            />
          </div>
          
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-[var(--color-dim)] mr-2" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[var(--color-panel)] border border-[var(--color-border)] text-sm text-[var(--color-content)] pl-2 pr-8 py-1.5 rounded-md outline-none focus:border-[var(--color-blue)] appearance-none font-mono"
            >
              <option value="all">Status: All</option>
              <option value="success">Status: Success</option>
              <option value="error">Status: Error</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 text-[var(--color-dim)] pointer-events-none" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--color-muted)]">Showing</span>
          <span className="bg-[var(--color-panel)] border border-[var(--color-border)] px-2 py-0.5 rounded-full text-[var(--color-content)] font-mono font-medium">
            {filteredTraces.length} / {traces.length} Traces
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-[var(--color-surface)] sticky top-0 z-10 shadow-sm border-b border-[var(--color-border)]">
            <tr>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] w-10 text-center">ST</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] min-w-[120px]">START TIME</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] min-w-[200px]">TRACE NAME</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] max-w-[300px]">INPUT (ROOT)</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] max-w-[300px]">OUTPUT (ROOT)</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] min-w-[100px]">SPANS</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[var(--color-muted)] tracking-wider border-r border-[var(--color-border)] w-24">LATENCY</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {filteredTraces.map(({ traceId, rootSpan, isError, totalTokens, durationMs, spanCount, timestamp }, idx) => {
              const timeStr = new Date(timestamp).toLocaleString('en-US', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit' });
              
              const inputSnippet = getPreview(rootSpan.attributes?.['ai.prompt'] as string, 'input');
              const outputSnippet = getPreview(rootSpan.attributes?.['ai.response.text'] as string, 'output');
              
              return (
                <tr 
                  key={`${traceId}-${idx}`}
                  onClick={() => onSpanClick(rootSpan)}
                  className="cursor-pointer border-b border-[var(--color-border-light)] hover:bg-[var(--color-hover)] transition-colors group"
                >
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] text-center">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${isError ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}>
                      {isError ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] text-[var(--color-muted)]">{timeStr}</td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] text-[var(--color-content)] max-w-[200px] truncate font-medium" title={rootSpan.name}>
                    {rootSpan.name}
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] max-w-[300px] truncate overflow-hidden">
                    <span style={{ color: "var(--color-string)" }}>{inputSnippet}</span>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] max-w-[300px] truncate overflow-hidden">
                    <span style={{ color: "var(--color-key)" }}>{outputSnippet}</span>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)] text-[var(--color-muted)]">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-[var(--color-dim)]" /> {spanCount} spans</span>
                      {totalTokens > 0 && <span className="text-[10px] text-[var(--color-dim)] mt-0.5">{totalTokens} tokens</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--color-border-light)]">
                    <span className={`${isError ? "text-[var(--color-red)]" : durationMs == null ? "text-[var(--color-muted)]" : "text-[var(--color-content)]"}`}>
                      {durationMs != null ? `${(durationMs/1000).toFixed(2)}s` : 'pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {filteredTraces.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-[var(--color-dim)]">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 opacity-20" />
                    <span className="font-medium text-sm">No traces found matching your criteria.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
