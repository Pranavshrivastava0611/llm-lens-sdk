import { useState, useMemo } from "react";
import type { SpanEvent } from "@/hooks/useWebSocket";

interface SpanDetailModalProps {
  span: SpanEvent | null;
  onClose: () => void;
}

export default function SpanDetailModal({ span, onClose }: SpanDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'scores'>('preview');
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

  if (!span) return null;

  const isError = span.status.code === 2;
  const attrs = span.attributes || {};
  const events = span.events || [];

  const modelId = attrs['ai.model.id'] as string;
  const promptText = attrs['ai.prompt'] as string;
  const responseText = attrs['ai.response.text'] as string;
  
  const promptTokens = attrs['ai.usage.promptTokens'] as number ?? 0;
  const compTokens = attrs['ai.usage.completionTokens'] as number ?? 0;
  const totalTokens = attrs['ai.usage.totalTokens'] as number ?? 0;

  const toolCalls = events.filter(e => e.name === 'tool.called');

  // Syntax highlighting helper for JSON
  const SyntaxHighlightedJson = ({ data, label }: { data?: string; label: string }) => {
    if (!data) return null;
    let parsed: any;
    let formatted = data;
    try {
      parsed = JSON.parse(data);
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      // not JSON
    }

    return (
      <div className="mb-6 rounded-md overflow-hidden border border-[#2a2a2a]">
        <div className="bg-[#1e1e1e] px-3 py-1.5 flex justify-between items-center border-b border-[#2a2a2a]">
          <span className="text-[11px] font-mono font-bold text-[#e0e0e0]">{label}</span>
          <div className="flex gap-2">
            <button className="text-[#888] hover:text-[#ccc] text-[11px] transition-colors">⎘ Copy</button>
            <span className="text-[11px] bg-[#2d2d2d] text-[#aaa] px-2 py-0.5 rounded">JSON</span>
          </div>
        </div>
        <div className="bg-[#111111] p-4 overflow-auto max-h-[400px] custom-scrollbar">
          <pre className="text-[12px] font-mono leading-relaxed" style={{ color: "#9cdcfe" }}>
            {formatted}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div
        className="w-[95vw] h-[95vh] flex flex-col rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid #222" }}
      >
        {/* Top Minimal Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#222]">
          <div className="flex items-center gap-3">
            <span className="text-[#888]">≡ Trace</span>
            <span className="font-mono text-sm text-[#ddd]">{span.name}: {span.traceId}</span>
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors p-1">
            ✕
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Pane: Timeline Tree */}
          <div className="w-[300px] bg-[#0d0d0d] border-r border-[#222] flex flex-col">
            <div className="p-3 border-b border-[#222]">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-[#1a1a1a] border border-[#333] text-xs text-white px-3 py-1.5 rounded outline-none focus:border-[#555]"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <div 
                onClick={() => setSelectedEventIndex(null)}
                className={`p-2 mb-1 rounded cursor-pointer border text-xs font-mono transition-colors ${
                  selectedEventIndex === null 
                    ? "bg-[#1a2b3c] border-[#2b4c6e] text-blue-300" 
                    : "bg-transparent border-transparent text-[#aaa] hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="truncate">↔ {span.name}</span>
                </div>
                <span className="text-[10px] opacity-70">{span.durationMs ? `${span.durationMs.toFixed(1)}ms` : 'pending'}</span>
              </div>

              <div className="pl-4 border-l border-[#333] ml-2 mt-2 space-y-1">
                {events.map((e, idx) => {
                  const isTool = e.name === 'tool.called';
                  const toolName = e.attributes?.toolName as string;
                  const title = isTool ? `🛠️ ${toolName}` : `⚡ ${e.name}`;
                  const isSelected = selectedEventIndex === idx;

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedEventIndex(idx)}
                      className={`p-2 rounded cursor-pointer border text-xs font-mono transition-colors relative ${
                        isSelected 
                          ? "bg-[#1a2b3c] border-[#2b4c6e] text-blue-300" 
                          : "bg-transparent border-transparent text-[#aaa] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {/* Timeline connecting line */}
                      <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-[#333]" />
                      <div className="flex justify-between items-center">
                        <span className="truncate">{title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pane: Inspector */}
          <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
            {/* Rich Metrics Header */}
            <div className="p-4 border-b border-[#222]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-[#f0f0f0] flex items-center gap-2">
                  <span className="text-[#666]">{selectedEventIndex === null ? "↔" : "↳"}</span>
                  {selectedEventIndex === null ? span.name : (events[selectedEventIndex].name === 'tool.called' ? `Tool: ${events[selectedEventIndex].attributes?.toolName}` : events[selectedEventIndex].name)}
                </h2>
                <div className="flex gap-2">
                  <button className="bg-[#222] hover:bg-[#333] text-[#ddd] px-3 py-1.5 rounded text-xs transition-colors">+ Add to datasets</button>
                  <button className="bg-[#222] hover:bg-[#333] text-[#ddd] px-3 py-1.5 rounded text-xs transition-colors">Annotate ⌄</button>
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                {selectedEventIndex === null ? (
                  <>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-2 py-1 rounded flex gap-2">
                      <span className="text-[#666]">Latency:</span> 
                      {span.durationMs ? `${(span.durationMs / 1000).toFixed(2)}s` : '—'}
                    </span>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-2 py-1 rounded flex gap-2">
                      <span className="text-[#666]">Session:</span> 
                      {span.traceId}
                    </span>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-2 py-1 rounded flex gap-2">
                      <span className="text-[#666]">Tokens:</span> 
                      {promptTokens} prompt → {compTokens} completion (Σ {totalTokens})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-2 py-1 rounded flex gap-2">
                      <span className="text-[#666]">Timestamp:</span> 
                      {new Date(events[selectedEventIndex].timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#ccc] px-2 py-1 rounded flex gap-2">
                      <span className="text-[#666]">Type:</span> 
                      Event
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono mt-2">
                {selectedEventIndex === null && (
                  <>
                    <span className="bg-blue-900/20 border border-blue-900/40 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                      🤖 {modelId || 'unknown-model'}
                    </span>
                    <span className="bg-[#1a1a1a] border border-[#333] text-[#aaa] px-2 py-1 rounded">
                      system: {modelId?.includes('llama') ? 'groq.chat' : 'openai.chat'}
                    </span>
                    {isError && (
                      <span className="bg-red-900/20 border border-red-900/40 text-red-400 px-2 py-1 rounded">
                        Error: {span.status.message}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Inspector Tabs */}
            <div className="flex items-center gap-4 px-4 border-b border-[#222]">
              {['Preview', 'Scores', 'Logs'].map(tab => {
                const id = tab.toLowerCase() as any;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(id)}
                    className={`py-3 text-[13px] font-semibold transition-colors border-b-2 ${
                      activeTab === id 
                        ? "border-blue-500 text-[#f0f0f0]" 
                        : "border-transparent text-[#777] hover:text-[#bbb]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'preview' && (
                <div className="max-w-5xl">
                  {selectedEventIndex === null ? (
                    <>
                      {/* Tags */}
                      <div className="mb-6">
                        <h3 className="text-[11px] uppercase text-[#666] font-bold tracking-wider mb-2">Tags</h3>
                        <div className="flex gap-2">
                          <span className="bg-[#1a1a1a] text-[#888] border border-[#333] px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            🏷️ {span.traceId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Inputs & Outputs */}
                      <SyntaxHighlightedJson label="Input" data={promptText} />
                      <SyntaxHighlightedJson label="Output" data={responseText} />
                    </>
                  ) : (
                    <>
                      {/* Event Details */}
                      <div className="mb-6">
                        <h3 className="text-[11px] uppercase text-[#666] font-bold tracking-wider mb-2">Event Attributes</h3>
                        <div className="bg-[#111] border border-[#2a2a2a] rounded-md p-4 overflow-auto custom-scrollbar">
                           <pre className="text-[12px] font-mono text-[#9cdcfe]">
                             {JSON.stringify(events[selectedEventIndex].attributes, null, 2)}
                           </pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="text-[#888] text-sm flex items-center justify-center h-full">
                  No execution logs available for this context.
                </div>
              )}
              {activeTab === 'scores' && (
                <div className="text-[#888] text-sm flex items-center justify-center h-full">
                  No evaluations or scores assigned to this trace.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
