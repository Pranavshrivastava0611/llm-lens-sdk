"use client";

import { useMemo } from "react";
import type { SpanEvent } from "@/hooks/useWebSocket";

interface TracingTableProps {
  spans: SpanEvent[];
  onSpanClick: (span: SpanEvent) => void;
}

export default function TracingTable({ spans, onSpanClick }: TracingTableProps) {
  // Sort spans by newest first
  const sortedSpans = useMemo(() => {
    return [...spans].sort((a, b) => {
      const timeA = a.events?.[0]?.timestamp ?? Date.now();
      const timeB = b.events?.[0]?.timestamp ?? Date.now();
      return timeB - timeA;
    });
  }, [spans]);

  const truncateString = (str: string, maxLen: number) => {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  };

  const getPreview = (str: string | undefined, type: 'input' | 'output') => {
    if (!str) return '—';
    try {
      // If it parses as JSON, compact it
      const parsed = JSON.parse(str);
      const compact = JSON.stringify(parsed);
      return truncateString(compact, 100);
    } catch {
      return truncateString(str, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] rounded-lg border border-[#222] overflow-hidden shadow-2xl">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-[#222] bg-[#111]">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search traces... (e.g. latency:>2s, error:true)" 
            className="w-[400px] bg-[#1a1a1a] border border-[#333] text-sm text-white px-3 py-1.5 rounded-md outline-none focus:border-[#555] font-mono"
          />
          <div className="flex gap-2">
            <button className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-3 py-1.5 rounded-md text-xs hover:bg-[#222]">Hide filters</button>
            <button className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-3 py-1.5 rounded-md text-xs hover:bg-[#222]">Views</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#666]">Past 24 hours</span>
          <span className="text-[10px] bg-[#222] border border-[#333] px-2 py-0.5 rounded-full text-[#888] font-mono">
            {spans.length} total
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-[#111] sticky top-0 z-10 shadow-sm border-b border-[#222]">
            <tr>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] w-10 text-center">ST</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] min-w-[120px]">START TIME</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] w-20">TYPE</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] min-w-[200px]">TRACE NAME</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] max-w-[300px]">INPUT</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] max-w-[300px]">OUTPUT</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] min-w-[100px]">METADATA</th>
              <th className="px-4 py-2 text-[11px] font-bold text-[#888] tracking-wider border-r border-[#222] w-24">LATENCY</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {sortedSpans.map((span, idx) => {
              const isError = span.status.code === 2;
              const timestamp = span.events?.[0]?.timestamp ?? Date.now();
              const timeStr = new Date(timestamp).toLocaleString('en-US', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit' });
              
              const promptTokens = span.attributes?.['ai.usage.promptTokens'] as number;
              const compTokens = span.attributes?.['ai.usage.completionTokens'] as number;
              
              const inputSnippet = getPreview(span.attributes?.['ai.prompt'] as string, 'input');
              const outputSnippet = getPreview(span.attributes?.['ai.response.text'] as string, 'output');
              
              const modelId = span.attributes?.['ai.model.id'] as string;
              
              return (
                <tr 
                  key={`${span.traceId}-${idx}`}
                  onClick={() => onSpanClick(span)}
                  className="cursor-pointer border-b border-[#1a1a1a] hover:bg-[#181818] transition-colors"
                >
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-[10px] font-bold ${isError ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {isError ? "✗" : "✓"}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-[#aaa]">{timeStr}</td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a]">
                    <span className="text-[#60a5fa]">↔ SPAN</span>
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-[#ddd] max-w-[200px] truncate" title={span.name}>
                    {span.name}
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-[#888] max-w-[300px] truncate overflow-hidden">
                    <span className="text-[#ce9178]">{inputSnippet}</span>
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-[#888] max-w-[300px] truncate overflow-hidden">
                    <span className="text-[#9cdcfe]">{outputSnippet}</span>
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a] text-[#888] max-w-[150px] truncate">
                    {modelId ? `model="${modelId}"` : '—'} {promptTokens ? `tks=${promptTokens+compTokens}` : ''}
                  </td>
                  <td className="px-4 py-2 border-r border-[#1a1a1a]">
                    <span className={`${isError ? "text-red-400" : span.durationMs == null ? "text-[#888]" : "text-emerald-400"}`}>
                      {span.durationMs != null ? `${(span.durationMs/1000).toFixed(2)}s` : 'pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {spans.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#555]">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📡</span>
                    <span>Waiting for tracing data...</span>
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
