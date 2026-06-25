"use client";

import type { SpanEvent } from "@/hooks/useWebSocket";

interface LiveSpanFeedProps {
  spans: SpanEvent[];
  onSpanClick?: (span: SpanEvent) => void;
}



export default function LiveSpanFeed({ spans, onSpanClick }: LiveSpanFeedProps) {
  return (
    <div
      className="rounded-lg flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden transition-all duration-300 h-full min-h-[240px] shadow-sm"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)" }}></div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[var(--color-muted)]">
            LIVE SPAN FEED
          </span>
        </div>
        <span className="text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full text-[var(--color-dim)] font-mono">
          {spans.length} active
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {spans.length === 0 ? (
          <div className="text-[11px] text-center py-12 text-[var(--color-muted)] font-mono flex flex-col items-center justify-center h-full">
            <span className="text-xl mb-2 opacity-50">📡</span>
            Waiting for live traces...
          </div>
        ) : (
          spans.map((span, i) => {
            const isError = span.status.code === 2;
            const duration = span.durationMs != null ? `${Math.round(span.durationMs)}ms` : "pending...";
            const tokens = span.attributes?.["ai.usage.totalTokens"] as number | undefined;
            const modelId = span.attributes?.["ai.model.id"] as string | undefined;
            const toolNamesStr = span.attributes?.["ai.toolNames"] as string | undefined;
            const tools = toolNamesStr ? toolNamesStr.split(',') : [];
            const prompt = span.attributes?.["ai.prompt"] as string | undefined;
            
            // Format the most recent event time
            let timeString = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            if (span.events && span.events.length > 0) {
              const lastTime = span.events[span.events.length - 1].timestamp;
              timeString = new Date(lastTime).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            }

            return (
              <div
                key={`${span.traceId}-${i}`}
                onClick={() => onSpanClick?.(span)}
                className="group flex flex-col p-2.5 animate-fade-in cursor-pointer border-b border-[var(--color-border-light)] hover:bg-[var(--color-hover)] transition-all font-mono"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Status & Name & Metadata */}
                  <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-sm text-[9px] font-bold ${isError ? "bg-[var(--color-red)]/20 text-[var(--color-red)]" : "bg-[var(--color-green)]/20 text-[var(--color-green)]"}`}>
                        {isError ? "✗" : "✓"}
                      </span>
                      <span className="text-[12px] font-semibold truncate text-[var(--color-content)] group-hover:text-[var(--color-blue)] transition-colors">
                        {span.name}
                      </span>
                      {modelId && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-panel)] text-[var(--color-muted)] border border-[var(--color-border)] truncate max-w-[120px]">
                          {modelId.replace('llama-3.3-70b-versatile', 'llama-3.3-70b')}
                        </span>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {tokens !== undefined && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-panel)] text-[var(--color-muted)] flex items-center gap-1 border border-[var(--color-border)]">
                          <span className="opacity-70">🪙</span> {tokens}
                        </span>
                      )}
                      {tools.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-400 flex items-center gap-1 border border-blue-900/40">
                          <span className="opacity-70">🛠️</span> {t.trim()}
                        </span>
                      ))}
                      {isError && span.status.message && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/20 text-red-400 truncate max-w-[200px] border border-red-900/40">
                          {span.status.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Timing & Latency */}
                  <div className="flex flex-col items-end flex-shrink-0 ml-4">
                    <span className="text-[10px] text-[var(--color-dim)]">
                      {timeString}
                    </span>
                    <span className={`text-[11px] font-bold ${isError ? "text-[var(--color-red)]" : span.durationMs == null ? "text-[var(--color-dim)] animate-pulse" : "text-[var(--color-muted)]"}`}>
                      {duration}
                    </span>
                  </div>
                </div>

                {prompt && (
                  <div className="mt-2 text-[10px] text-[var(--color-dim)] truncate opacity-70 italic border-l-2 border-[var(--color-border-light)] pl-2 ml-5">
                    "{prompt.replace(/\n/g, ' ')}"
                  </div>
                )}

                {span.events && span.events.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex flex-col gap-1.5 ml-5">
                    <span className="text-[8px] text-[var(--color-dim)] uppercase tracking-widest font-bold">
                      Event Timeline
                    </span>
                    <div className="space-y-1">
                      {span.events.slice(-3).map((e, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[9px]">
                          <span className="text-[var(--color-dim)] w-12 flex-shrink-0 font-mono">
                            {new Date(e.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                          </span>
                          <span className="text-[var(--color-muted)] flex-1 truncate">
                            {e.name === "tool.called" ? <span className="text-[var(--color-blue)]">↳ Tool: {e.attributes.toolName as string}</span> : `↳ ${e.name}`}
                          </span>
                        </div>
                      ))}
                      {span.events.length > 3 && (
                        <div className="text-[8px] text-[var(--color-dim)] pl-14">
                          + {span.events.length - 3} more events...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--scroll-thumb-hover); }
      `}} />
    </div>
  );
}
