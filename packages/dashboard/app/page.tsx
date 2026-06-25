"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import TopBar from "@/components/TopBar";
import MetricsBar from "@/components/MetricsBar";
import TokenChart from "@/components/TokenChart";
import LatencyChart from "@/components/LatencyChart";
import PatternAlerts from "@/components/PatternAlerts";
import LiveSpanFeed from "@/components/LiveSpanFeed";
import ToolUsageTable from "@/components/ToolUsageTable";
import InsightList from "@/components/InsightList";
import WindowProgress from "@/components/WindowProgress";
import ConfigModal from "@/components/ConfigModal";
import MemoryPanel from "@/components/MemoryPanel";

import SpanDetailModal from "@/components/SpanDetailModal";
import CustomVisualizer from "@/components/CustomVisualizer";
import type { SpanEvent } from "@/hooks/useWebSocket";

import Sidebar from "@/components/Sidebar";
import TracingTable from "@/components/TracingTable";
import type { SectionTab } from "@/components/Sidebar";

// Helper to get WebSocket URL from environment or default
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:7777/ws";

export default function Dashboard() {
  const { state, sendMessage } = useWebSocket(wsUrl);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionTab>('overview');
  const [rightTab, setRightTab] = useState<'insights' | 'memory'>('insights');
  const [selectedSpan, setSelectedSpan] = useState<SpanEvent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSaveConfig = (config: { provider: string; model: string; apiKey: string }) => {
    sendMessage("config:agent", config);
  };

  useEffect(() => {
    const onForce = () => {
      setIsGenerating(true);
      sendMessage("force:analysis", {});
    };
    const onForceDeep = () => {
      setIsGenerating(true);
      sendMessage("force:deep_analysis", {});
    };
    window.addEventListener("forceAnalysis", onForce);
    window.addEventListener("forceDeepAnalysis", onForceDeep);
    return () => {
      window.removeEventListener("forceAnalysis", onForce);
      window.removeEventListener("forceDeepAnalysis", onForceDeep);
    };
  }, [sendMessage]);

  // Reset generating state when a new insight arrives
  useEffect(() => {
    setIsGenerating(false);
  }, [state.insights.length]);

  const windowEnd = state.currentWindow
    ? new Date(state.currentWindow.windowEnd).getTime()
    : Date.now() + 15 * 60 * 1000;

  const windowStart = state.currentWindow
    ? new Date(state.currentWindow.windowStart).getTime()
    : Date.now();

  const p50 = state.currentWindow?.p50LatencyMs ?? 0;
  const p95 = state.currentWindow?.p95LatencyMs ?? 0;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[var(--color-bg)] pb-[60px] md:pb-0">
      <Sidebar 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onOpenSettings={() => setIsConfigOpen(true)} 
      />

      <div className="flex flex-col flex-1 min-w-0">
        <SpanDetailModal span={selectedSpan} allSpans={state.spans} onClose={() => setSelectedSpan(null)} />
        
        {/* Fixed top area */}
        <div className="flex-none">
          <TopBar
            healthScore={state.healthScore}
            connected={state.connected}
            windowEnd={windowEnd}
            onOpenSettings={() => setIsConfigOpen(true)}
          />
          <MetricsBar
            currentWindow={state.currentWindow}
            completedTraces={state.completedTraces}
            patternAlerts={state.patternAlerts}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-5 min-h-0">
          
          {/* SECTION: TRACING */}
          {activeTab === 'tracing' && (
            <TracingTable spans={state.spans} onSpanClick={setSelectedSpan} />
          )}

          {/* SECTION: AI REPORTS */}
          {activeTab === 'insights' && (
            <div className="h-full flex flex-col md:flex-row gap-5">
              <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 overflow-auto custom-scrollbar">
                <h2 className="text-xl font-bold mb-4 text-[var(--color-content)]">AI Insight Reports</h2>
                <InsightList insights={state.insights} windowEnd={windowEnd} />
              </div>
              <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-4">
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 overflow-auto custom-scrollbar">
                  <h2 className="text-xl font-bold mb-4 text-[var(--color-content)]">Long-Term Memory</h2>
                  <MemoryPanel serviceName={state.spans[0]?.serviceName ?? 'default'} />
                </div>
                <div className="flex-none">
                  <WindowProgress
                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    currentWindow={state.currentWindow}
                    completedTraces={state.completedTraces}
                    patternAlerts={state.patternAlerts}
                    isGenerating={isGenerating}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: VISUALIZATIONS */}
          {activeTab === 'visualizations' && (
            <div className="flex flex-col gap-5 h-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-5 flex-none md:h-[220px]">
                <div className="flex-1 min-w-0">
                  <TokenChart completedTraces={state.completedTraces} />
                </div>
                <div className="flex-1 min-w-0">
                  <LatencyChart completedTraces={state.completedTraces} p50={p50} p95={p95} />
                </div>
              </div>
              
              <div className="flex-none">
                <CustomVisualizer spans={state.spans} />
              </div>
            </div>
          )}

          {/* SECTION: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col lg:flex-row gap-5 h-full">
              {/* LEFT COLUMN */}
              <div className="w-full lg:w-[60%] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {/* Section B: Pattern Alerts */}
                <div className="flex-none">
                  <PatternAlerts alerts={state.patternAlerts} />
                </div>

                {/* Section C: Live Feed & Tools */}
                <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[240px]">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <LiveSpanFeed spans={state.spans} onSpanClick={setSelectedSpan} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <ToolUsageTable currentWindow={state.currentWindow} />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:pl-2 overflow-y-auto custom-scrollbar">
                {/* Section D: Tabs for Insights & Memory */}
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <div className="flex gap-2 mb-1">
                    <button 
                      onClick={() => setRightTab('insights')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors ${rightTab === 'insights' ? 'bg-[var(--color-hover)] text-[var(--color-content)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-content)] hover:bg-[var(--color-surface)]'}`}
                    >
                      AI INSIGHTS
                    </button>
                    <button 
                      onClick={() => setRightTab('memory')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors ${rightTab === 'memory' ? 'bg-[var(--color-hover)] text-[var(--color-content)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-content)] hover:bg-[var(--color-surface)]'}`}
                    >
                      LONG-TERM MEMORY
                    </button>
                  </div>
                  
                  {rightTab === 'insights' ? (
                    <InsightList insights={state.insights} windowEnd={windowEnd} />
                  ) : (
                    <MemoryPanel serviceName={state.spans[0]?.serviceName ?? 'default'} />
                  )}
                </div>

                {/* Section E: Progress */}
                <div className="flex-none">
                  <WindowProgress
                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    currentWindow={state.currentWindow}
                    completedTraces={state.completedTraces}
                    patternAlerts={state.patternAlerts}
                    isGenerating={isGenerating}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          currentConfig={state.agentConfig}
          onSave={handleSaveConfig}
        />
      </div>
    </div>
  );
}
