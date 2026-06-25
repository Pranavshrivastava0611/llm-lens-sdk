import { useState, useMemo } from "react";
import type { SpanEvent } from "@/hooks/useWebSocket";
import { 
  Copy, X, Braces, AlignLeft, BarChart2, Activity, Cpu, 
  Wrench, Search, Zap, Tag, Hash, Clock, ShieldAlert,
  GitCommit, ChevronRight, CheckCircle2, XCircle, DollarSign,
  Network
} from "lucide-react";

interface SpanDetailModalProps {
  span: SpanEvent | null;
  allSpans?: SpanEvent[];
  onClose: () => void;
}

const COST_MAP: Record<string, { in: number, out: number }> = {
  'openai/gpt-4o': { in: 5.0, out: 15.0 },
  'openai/gpt-4o-mini': { in: 0.15, out: 0.6 },
  'openai/gpt-4-turbo': { in: 10.0, out: 30.0 },
  'anthropic/claude-3.5-sonnet': { in: 3.0, out: 15.0 },
  'anthropic/claude-3-opus': { in: 15.0, out: 75.0 },
  'anthropic/claude-3-haiku': { in: 0.25, out: 1.25 },
  'meta-llama/llama-3-70b-instruct': { in: 0.5, out: 0.5 },
  'meta-llama/llama-3-8b-instruct': { in: 0.05, out: 0.05 },
  'google/gemini-1.5-pro': { in: 3.5, out: 10.5 },
  'google/gemini-1.5-flash': { in: 0.075, out: 0.3 },
  'qwen/qwen-2.5-72b-instruct': { in: 0.4, out: 0.4 },
};

function calculateCost(modelId: string, inputTokens: number, outputTokens: number): string {
  const rates = COST_MAP[modelId] ?? COST_MAP[modelId.toLowerCase()] ?? null;
  if (!rates) return 'Unknown Cost';
  
  const costIn = (inputTokens / 1_000_000) * rates.in;
  const costOut = (outputTokens / 1_000_000) * rates.out;
  const total = costIn + costOut;
  
  if (total < 0.0001) return `< $0.0001`;
  return `$${total.toFixed(4)}`;
}

type TreeNode = {
  type: 'span' | 'event';
  id: string;
  data: SpanEvent | any;
  children: TreeNode[];
  depth: number;
};

// Recursive Graph Component
function VisualGraphNode({ node, isLast }: { node: TreeNode, isLast: boolean }) {
  const isSpan = node.type === 'span';
  const isTool = !isSpan && node.data.name === 'tool.called';
  const title = isSpan ? node.data.name : (isTool ? `Tool Call: ${node.data.attributes?.toolName}` : node.data.name);
  const Icon = isSpan ? Activity : (isTool ? Wrench : Zap);
  const iconColor = isSpan ? 'text-[var(--color-blue)]' : (isTool ? 'text-[var(--color-green)]' : 'text-[var(--color-yellow)]');
  
  return (
    <div className="relative flex flex-col">
      <div className="flex items-start gap-4 my-2 relative z-10 group">
        <div className={`w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center shrink-0 bg-[var(--color-surface)] shadow-sm z-10`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-sm hover:border-[var(--color-border-light)] transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[var(--color-content)]">{title}</span>
            {isSpan && node.data.durationMs != null && (
              <span className="text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-panel)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                {node.data.durationMs.toFixed(1)}ms
              </span>
            )}
          </div>
          {!isSpan && node.data.attributes && Object.keys(node.data.attributes).length > 0 && (
            <div className="mt-2 text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-panel)] p-2 rounded">
              {JSON.stringify(node.data.attributes)}
            </div>
          )}
        </div>
      </div>
      
      {node.children.length > 0 && (
        <div className="ml-4 pl-4 border-l-2 border-[var(--color-border)] relative flex flex-col pt-2 pb-2">
          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              <div className="absolute top-6 -left-4 w-4 border-t-2 border-[var(--color-border)] z-0" />
              <VisualGraphNode node={child} isLast={idx === node.children.length - 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpanDetailModal({ span: activeSpan, allSpans = [], onClose }: SpanDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'scores' | 'graph'>('preview');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const traceSpans = useMemo(() => {
    if (!activeSpan) return [];
    const related = allSpans.filter(s => s.traceId === activeSpan.traceId);
    if (!related.find(s => s.id === activeSpan.id)) {
      related.push(activeSpan);
    }
    return related;
  }, [activeSpan, allSpans]);

  const { tree, flat } = useMemo(() => {
    if (traceSpans.length === 0) return { tree: [], flat: [] };

    const spanMap = new Map<string, TreeNode>();
    traceSpans.forEach(s => {
      if (s.id) {
        spanMap.set(s.id, { type: 'span', id: s.id, data: s, children: [], depth: 0 });
      }
    });

    const roots: TreeNode[] = [];

    traceSpans.forEach(s => {
      if (!s.id) return;
      const node = spanMap.get(s.id)!;
      
      (s.events || []).forEach((e, idx) => {
        node.children.push({
          type: 'event',
          id: `${s.id}-ev-${idx}`,
          data: e,
          children: [],
          depth: 0
        });
      });

      if (s.parentSpanId && spanMap.has(s.parentSpanId)) {
        spanMap.get(s.parentSpanId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const setDepth = (nodes: TreeNode[], depth: number) => {
      nodes.forEach(n => {
        n.depth = depth;
        setDepth(n.children, depth + 1);
      });
    };
    setDepth(roots, 0);

    const flatArr: TreeNode[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        flatArr.push(n);
        flatten(n.children);
      });
    };
    flatten(roots);

    return { tree: roots, flat: flatArr };
  }, [traceSpans]);

  if (!activeSpan) return null;

  const activeSelectionId = selectedNodeId ?? activeSpan.id ?? flat[0]?.id ?? null;
  const selectedNode = flat.find(n => n.id === activeSelectionId);

  const selectedSpan = selectedNode?.type === 'span' ? (selectedNode.data as SpanEvent) : activeSpan;
  const isError = selectedSpan.status?.code === 2;
  const attrs = selectedSpan.attributes || {};
  
  const modelId = attrs['ai.model.id'] as string;
  const provider = attrs['ai.model.provider'] as string;
  const promptText = attrs['ai.prompt'] as string;
  const responseText = attrs['ai.response.text'] as string;
  const finishReason = attrs['ai.response.finishReason'] as string;
  
  const promptTokens = (attrs['ai.usage.inputTokens'] ?? attrs['ai.usage.promptTokens'] ?? 0) as number;
  const compTokens = (attrs['ai.usage.outputTokens'] ?? attrs['ai.usage.completionTokens'] ?? 0) as number;
  const totalTokens = promptTokens + compTokens;
  const cost = modelId ? calculateCost(modelId, promptTokens, compTokens) : '—';

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
      <div className="mb-6 rounded-lg overflow-hidden border border-[var(--color-border)] shadow-sm">
        <div className="bg-[var(--color-surface)] px-4 py-2 flex justify-between items-center border-b border-[var(--color-border)]">
          <span className="text-xs font-semibold text-[var(--color-content)] flex items-center gap-2">
            <Braces className="w-3.5 h-3.5 text-[var(--color-dim)]" /> {label}
          </span>
          <div className="flex gap-2 items-center">
            <button className="text-[var(--color-dim)] hover:text-[var(--color-content)] transition-colors flex items-center gap-1 text-[11px] font-medium bg-[var(--color-panel)] px-2 py-1 rounded border border-[var(--color-border)]">
              <Copy className="w-3 h-3" /> Copy
            </button>
            <span className="text-[10px] bg-[var(--color-panel)] text-[var(--color-muted)] px-1.5 py-0.5 rounded font-mono border border-[var(--color-border)]">JSON</span>
          </div>
        </div>
        <div className="bg-[var(--color-code-bg)] p-4 overflow-auto max-h-[400px] custom-scrollbar">
          <pre className="text-[12px] font-mono leading-relaxed" style={{ color: "var(--color-key)" }}>
            {formatted}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div
        className="w-[95vw] h-[95vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-content)]"
      >
        {/* Top Minimal Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="font-medium text-sm text-[var(--color-content)]">Trace Inspector</span>
            <div className="h-4 w-px bg-[var(--color-border)]"></div>
            <span className="font-mono text-xs text-[var(--color-muted)] flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> {activeSpan.traceId}
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-content)] transition-colors p-1 rounded-md hover:bg-[var(--color-hover)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Pane: Timeline Tree */}
          <div className="w-[320px] bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col">
            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--color-dim)]" />
                <input 
                  type="text" 
                  placeholder="Search traces & events..." 
                  className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] text-xs text-[var(--color-content)] pl-8 pr-3 py-2 rounded-md outline-none focus:border-[var(--color-blue)] transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {flat.map(node => {
                const isSelected = activeSelectionId === node.id;
                
                if (node.type === 'span') {
                  const span = node.data as SpanEvent;
                  const isErr = span.status?.code === 2;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
                      className={`py-2 pr-2 mb-1 rounded-md cursor-pointer border text-xs font-mono transition-all ${
                        isSelected 
                          ? "bg-[var(--color-blue)]/10 border-[var(--color-blue)]/30 text-[var(--color-blue)] shadow-sm" 
                          : "bg-transparent border-transparent text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-content)]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate flex items-center gap-1.5 font-semibold tracking-tight">
                          <Activity className={`w-3.5 h-3.5 ${isErr ? 'text-[var(--color-red)]' : ''}`} /> {span.name}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {span.durationMs ? `${span.durationMs.toFixed(1)}ms` : 'pending'}
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  const ev = node.data;
                  const isTool = ev.name === 'tool.called';
                  const title = isTool ? (ev.attributes?.toolName as string) : ev.name;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
                      className={`py-1.5 pr-2 rounded-md cursor-pointer border text-[11px] font-mono transition-all relative group ${
                        isSelected 
                          ? "bg-[var(--color-blue)]/10 border-[var(--color-blue)]/30 text-[var(--color-blue)] shadow-sm" 
                          : "bg-transparent border-transparent text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-content)]"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate flex items-center gap-1.5">
                          {isTool ? <Wrench className="w-3 h-3 text-[var(--color-green)]" /> : <Zap className="w-3 h-3 text-[var(--color-yellow)]" />}
                          {title}
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Right Pane: Inspector */}
          <div className="flex-1 flex flex-col bg-[var(--color-bg)] min-w-0">
            {/* Rich Metrics Header */}
            <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-content)] flex items-center gap-2.5">
                  {selectedNode?.type === 'span' ? <Activity className="w-5 h-5 text-[var(--color-muted)]" /> : <GitCommit className="w-5 h-5 text-[var(--color-muted)]" />}
                  {selectedNode?.type === 'span' ? (selectedNode.data as SpanEvent).name : (selectedNode?.data.name === 'tool.called' ? `Tool: ${selectedNode?.data.attributes?.toolName}` : selectedNode?.data.name)}
                </h2>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2.5 text-[11px] font-mono">
                {selectedNode?.type === 'span' ? (
                  <>
                    <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-content)] px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-dim)]" />
                      {selectedSpan.durationMs ? `${(selectedSpan.durationMs / 1000).toFixed(2)}s` : '—'}
                    </span>
                    <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-content)] px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                      <Activity className="w-3.5 h-3.5 text-[var(--color-dim)]" />
                      {promptTokens} pt <ChevronRight className="w-3 h-3 text-[var(--color-muted)]" /> {compTokens} ct <ChevronRight className="w-3 h-3 text-[var(--color-muted)]" /> Σ {totalTokens}
                    </span>
                    <span className="bg-[var(--color-panel)] border border-[var(--color-border)] px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm text-[var(--color-green)] font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--color-green)]" />
                      {cost}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-content)] px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-dim)]" />
                      {new Date(selectedNode?.data.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}
                    </span>
                    <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-content)] px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-[var(--color-dim)]" />
                      Event
                    </span>
                  </>
                )}
              </div>
              
              {/* Secondary Details Row */}
              <div className="flex flex-wrap gap-2.5 text-[11px] font-mono mt-2.5">
                {selectedNode?.type === 'span' && (
                  <>
                    {modelId && (
                      <span className="bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 text-[var(--color-blue)] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm font-medium">
                        <Cpu className="w-3.5 h-3.5" /> {modelId}
                      </span>
                    )}
                    {provider && (
                      <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)] px-2.5 py-1.5 rounded-md flex items-center shadow-sm">
                        provider: {provider}
                      </span>
                    )}
                    {finishReason && (
                      <span className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)] px-2.5 py-1.5 rounded-md flex items-center shadow-sm">
                        reason: {finishReason}
                      </span>
                    )}
                    {isError && (
                      <span className="bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 text-[var(--color-red)] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> {selectedSpan.status?.message}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Inspector Tabs */}
            <div className="flex items-center gap-6 px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              {['Preview', 'Scores', 'Graph', 'Logs'].map(tab => {
                const id = tab.toLowerCase() as any;
                const Icon = tab === 'Preview' ? AlignLeft : tab === 'Scores' ? BarChart2 : tab === 'Graph' ? Network : Braces;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(id)}
                    className={`py-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === id 
                        ? "border-[var(--color-blue)] text-[var(--color-content)]" 
                        : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-content)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg)] custom-scrollbar">
              {activeTab === 'preview' && (
                <div className="max-w-5xl mx-auto">
                  {selectedNode?.type === 'span' ? (
                    <>
                      <SyntaxHighlightedJson label="Input Payload / Prompt" data={promptText} />
                      <SyntaxHighlightedJson label="Model Output Response" data={responseText} />
                      
                      <div className="mb-6">
                        <h3 className="text-[11px] uppercase text-[var(--color-dim)] font-bold tracking-wider mb-2">Raw Attributes</h3>
                        <div className="bg-[var(--color-code-bg)] border border-[var(--color-border)] rounded-lg p-4 overflow-auto custom-scrollbar">
                           <pre className="text-[11px] font-mono text-[var(--color-key)]">
                             {JSON.stringify(attrs, null, 2)}
                           </pre>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-[11px] uppercase text-[var(--color-dim)] font-bold tracking-wider mb-2">Event Attributes</h3>
                        <div className="bg-[var(--color-code-bg)] border border-[var(--color-border)] rounded-lg p-4 overflow-auto custom-scrollbar">
                           <pre className="text-[11px] font-mono text-[var(--color-key)]">
                             {JSON.stringify(selectedNode?.data.attributes, null, 2)}
                           </pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {activeTab === 'graph' && (
                <div className="max-w-5xl mx-auto flex flex-col gap-4">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 shadow-sm overflow-auto">
                    <h3 className="text-sm font-semibold text-[var(--color-content)] mb-6 flex items-center gap-2 pb-4 border-b border-[var(--color-border)]">
                      <Network className="w-4 h-4 text-[var(--color-blue)]" /> Visual Execution Flow
                    </h3>
                    <div className="flex flex-col relative w-full pt-2">
                      {tree.map((rootNode, idx) => (
                        <VisualGraphNode key={rootNode.id} node={rootNode} isLast={idx === tree.length - 1} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="text-[var(--color-muted)] text-sm flex items-center justify-center h-full">
                  No execution logs available for this context.
                </div>
              )}
              {activeTab === 'scores' && (
                <div className="text-[var(--color-muted)] text-sm flex items-center justify-center h-full">
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
