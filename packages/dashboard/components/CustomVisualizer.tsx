"use client";

import { useState, useMemo } from "react";
import type { SpanEvent } from "@/hooks/useWebSocket";

interface CustomVisualizerProps {
  spans: SpanEvent[];
}

type Metric = 'durationMs' | 'totalTokens' | 'promptTokens' | 'completionTokens';
type GroupBy = 'time' | 'model';
type ChartType = 'line' | 'bar';

export default function CustomVisualizer({ spans }: CustomVisualizerProps) {
  const [metric, setMetric] = useState<Metric>('durationMs');
  const [groupBy, setGroupBy] = useState<GroupBy>('time');
  const [chartType, setChartType] = useState<ChartType>('line');

  const WIDTH = 800;
  const HEIGHT = 240;
  const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // Process data based on controls
  const chartData = useMemo(() => {
    // We only care about traces that actually have numeric values for the selected metric
    let extracted = spans.map(s => {
      let val = 0;
      if (metric === 'durationMs') val = s.durationMs ?? 0;
      else if (metric === 'totalTokens') val = s.attributes?.['ai.usage.totalTokens'] as number ?? 0;
      else if (metric === 'promptTokens') val = s.attributes?.['ai.usage.promptTokens'] as number ?? 0;
      else if (metric === 'completionTokens') val = s.attributes?.['ai.usage.completionTokens'] as number ?? 0;
      
      const model = (s.attributes?.['ai.model.id'] as string) || 'unknown';
      const time = s.events?.[0]?.timestamp ?? Date.now();
      return { val, model, time };
    }).filter(d => d.val > 0);

    // Grouping
    let points: { label: string; value: number }[] = [];
    
    if (groupBy === 'time') {
      // Sort oldest to newest
      extracted.sort((a, b) => a.time - b.time);
      points = extracted.map((e, i) => ({
        label: new Date(e.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
        value: e.val
      }));
    } else if (groupBy === 'model') {
      // Average per model
      const byModel: Record<string, { sum: number; count: number }> = {};
      extracted.forEach(e => {
        if (!byModel[e.model]) byModel[e.model] = { sum: 0, count: 0 };
        byModel[e.model].sum += e.val;
        byModel[e.model].count += 1;
      });
      points = Object.keys(byModel).map(model => ({
        label: model.replace('llama-3.3-70b-versatile', 'llama-3.3-70b'),
        value: byModel[model].sum / byModel[model].count
      }));
      // Force bar chart for categorical data if not line
    }

    if (points.length === 0) return { points: [], maxVal: 100 };
    const maxVal = Math.max(...points.map(p => p.value)) * 1.1; // 10% headroom

    return { points, maxVal };
  }, [spans, metric, groupBy]);

  const { points, maxVal } = chartData;

  // Render SVG paths
  const renderChart = () => {
    if (points.length === 0) {
      return <text x={WIDTH/2} y={HEIGHT/2} textAnchor="middle" fill="#666" fontSize="12">No data available for this configuration.</text>;
    }

    if (chartType === 'line' && groupBy === 'time') {
      const linePath = points.map((p, i) => {
        const x = PADDING.left + (i / Math.max(1, points.length - 1)) * plotW;
        const y = PADDING.top + plotH - (p.value / maxVal) * plotH;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(" ");

      const fillPath = `${linePath} L${PADDING.left + plotW},${PADDING.top + plotH} L${PADDING.left},${PADDING.top + plotH} Z`;

      return (
        <>
          <path d={fillPath} fill="rgba(59, 130, 246, 0.1)" />
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
          {points.map((p, i) => {
            const x = PADDING.left + (i / Math.max(1, points.length - 1)) * plotW;
            const y = PADDING.top + plotH - (p.value / maxVal) * plotH;
            return <circle key={i} cx={x} cy={y} r="3" fill="#0a0a0a" stroke="#3b82f6" strokeWidth="2" />;
          })}
        </>
      );
    } else {
      // Bar Chart
      const barWidth = Math.min(60, plotW / Math.max(1, points.length) * 0.8);
      return (
        <>
          {points.map((p, i) => {
            const xOffset = PADDING.left + (i + 0.5) * (plotW / points.length) - barWidth / 2;
            const barH = (p.value / maxVal) * plotH;
            const y = PADDING.top + plotH - barH;
            return (
              <g key={i}>
                <rect x={xOffset} y={y} width={barWidth} height={barH} fill="#3b82f6" rx="2" className="hover:opacity-80 transition-opacity" />
                <text x={xOffset + barWidth/2} y={y - 5} textAnchor="middle" fill="#aaa" fontSize="10">{Math.round(p.value)}</text>
              </g>
            );
          })}
        </>
      );
    }
  };

  return (
    <div className="flex flex-col bg-[#0d0d0d] rounded-lg border border-[#222] overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 border-b border-[#222] bg-[#111] flex flex-wrap items-center gap-6">
        <div>
          <label className="block text-[10px] text-[#666] uppercase tracking-wider mb-1 font-bold">Metric</label>
          <select 
            value={metric} 
            onChange={e => setMetric(e.target.value as Metric)}
            className="bg-[#1a1a1a] text-sm text-[#eee] border border-[#333] rounded px-2 py-1 outline-none"
          >
            <option value="durationMs">Latency (ms)</option>
            <option value="totalTokens">Total Tokens</option>
            <option value="promptTokens">Prompt Tokens</option>
            <option value="completionTokens">Completion Tokens</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[#666] uppercase tracking-wider mb-1 font-bold">Group By</label>
          <select 
            value={groupBy} 
            onChange={e => {
              const val = e.target.value as GroupBy;
              setGroupBy(val);
              if (val === 'model') setChartType('bar'); // auto switch for categorical
            }}
            className="bg-[#1a1a1a] text-sm text-[#eee] border border-[#333] rounded px-2 py-1 outline-none"
          >
            <option value="time">Trace Time (Chronological)</option>
            <option value="model">AI Model</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[#666] uppercase tracking-wider mb-1 font-bold">Chart Type</label>
          <div className="flex bg-[#1a1a1a] rounded border border-[#333] overflow-hidden">
            <button 
              onClick={() => setChartType('line')} 
              disabled={groupBy === 'model'}
              className={`px-3 py-1 text-xs transition-colors ${chartType === 'line' ? 'bg-[#333] text-white' : 'text-[#888] hover:text-[#ccc]'} ${groupBy==='model' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              Line
            </button>
            <button 
              onClick={() => setChartType('bar')} 
              className={`px-3 py-1 text-xs transition-colors border-l border-[#333] ${chartType === 'bar' ? 'bg-[#333] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 flex-1">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full" style={{ minHeight: '300px' }}>
          {/* Y Axis Labels */}
          <text x={PADDING.left - 10} y={PADDING.top + 4} textAnchor="end" fill="#555" fontSize="10">{Math.round(maxVal)}</text>
          <text x={PADDING.left - 10} y={PADDING.top + plotH/2 + 4} textAnchor="end" fill="#555" fontSize="10">{Math.round(maxVal/2)}</text>
          <text x={PADDING.left - 10} y={PADDING.top + plotH + 4} textAnchor="end" fill="#555" fontSize="10">0</text>

          {/* Grid lines */}
          <line x1={PADDING.left} y1={PADDING.top} x2={WIDTH - PADDING.right} y2={PADDING.top} stroke="#1a1a1a" strokeWidth="1" />
          <line x1={PADDING.left} y1={PADDING.top + plotH/2} x2={WIDTH - PADDING.right} y2={PADDING.top + plotH/2} stroke="#1a1a1a" strokeWidth="1" />
          <line x1={PADDING.left} y1={PADDING.top + plotH} x2={WIDTH - PADDING.right} y2={PADDING.top + plotH} stroke="#1a1a1a" strokeWidth="1" />

          {/* Chart Rendering */}
          {renderChart()}

          {/* X Axis Labels */}
          {points.length > 0 && groupBy === 'model' && points.map((p, i) => (
            <text 
              key={i} 
              x={PADDING.left + (i + 0.5) * (plotW / points.length)} 
              y={HEIGHT - 10} 
              textAnchor="middle" 
              fill="#888" 
              fontSize="10"
            >
              {p.label}
            </text>
          ))}
          {points.length > 0 && groupBy === 'time' && (
            <>
              <text x={PADDING.left} y={HEIGHT - 10} textAnchor="start" fill="#888" fontSize="10">{points[0].label}</text>
              <text x={WIDTH - PADDING.right} y={HEIGHT - 10} textAnchor="end" fill="#888" fontSize="10">{points[points.length-1].label}</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
