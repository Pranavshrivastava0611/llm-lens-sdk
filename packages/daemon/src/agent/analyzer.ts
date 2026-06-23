import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { getConfig, hasValidConfig } from './config.js';
import { insertInsightReport, type InsightReport } from '../store/insights.js';
import type { AggregatedWindow, PatternAlert } from '../aggregator/patterns.js';

// ── Zod Schema ───────────────────────────────────────────────────────────────

const InsightReportSchema = z.object({
  healthScore: z.number().min(0).max(100),
  headline: z.string(),
  summary: z.string(),
  findings: z.array(z.object({
    type: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    title: z.string(),
    detail: z.string(),
    metric: z.string(),
    recommendation: z.string(),
  })),
  tokenAnalysis: z.object({
    trend: z.string(),
    concern: z.union([z.string(), z.null()]),
    recommendation: z.union([z.string(), z.null()]),
  }),
  latencyAnalysis: z.object({
    assessment: z.enum(['healthy', 'degraded', 'critical']),
    p95Ms: z.number(),
    concern: z.union([z.string(), z.null()]),
    recommendation: z.union([z.string(), z.null()]),
  }),
  toolAnalysis: z.object({
    mostUsed: z.union([z.string(), z.null()]),
    concern: z.union([z.string(), z.null()]),
    recommendation: z.union([z.string(), z.null()]),
  }),
  watchFor: z.array(z.string()),
});

// ── Model Builder ────────────────────────────────────────────────────────────

function buildModel(config: { provider: string; keys: Record<string, string>; model: string }) {
  const apiKey = config.keys[config.provider] || '';

  if (config.provider === 'openrouter' || config.provider === 'openai' || config.provider === 'groq') {
    let baseURL = 'https://api.openai.com/v1';
    if (config.provider === 'openrouter') baseURL = 'https://openrouter.ai/api/v1';
    if (config.provider === 'groq') baseURL = 'https://api.groq.com/openai/v1';

    const client = createOpenAI({
      baseURL,
      apiKey,
    });
    return client(config.model);
  }

  if (config.provider === 'anthropic') {
    const client = createAnthropic({ apiKey });
    return client(config.model);
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

// ── Analyzer ─────────────────────────────────────────────────────────────────

export async function analyzeWindow(
  window: AggregatedWindow,
  alerts: PatternAlert[],
  windowId: number
): Promise<InsightReport | null> {
  if (!hasValidConfig()) {
    console.warn('[daemon] No valid agent config — skipping AI analysis');
    const report = generateFallbackReport(window, alerts, windowId);
    insertInsightReport(windowId, report);
    return report;
  }

  const config = getConfig();

  try {
    const model = buildModel(config);
    
    // Fetch memory context dynamically
    let memoryContext = '';
    let previousInsightContext = '';
    try {
      const { memoryStore } = await import('../index.js');
      if (memoryStore) {
        memoryContext = memoryStore.getMemoryContext(window.serviceName);
      }
      
      const { getRecentInsights } = await import('../store/insights.js');
      const recent = getRecentInsights(1);
      if (recent && recent.length > 0) {
        previousInsightContext = `\n## Previous Window Insight\nHeadline: ${recent[0].headline}\nSummary: ${recent[0].summary}\nFindings: ${JSON.stringify(recent[0].findings, null, 2)}\n`;
      }
    } catch (e) {
      console.warn('[daemon] Failed to fetch previous context:', e);
    }

    const prompt = buildPrompt(window, alerts, memoryContext, previousInsightContext);

    const result = await generateText({
      model,
      prompt,
    });
    
    const text = result.text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON");
    const object = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    const report: InsightReport = {
      windowId,
      windowStart: window.windowStart,
      windowEnd: window.windowEnd,
      healthScore: object.healthScore,
      headline: object.headline,
      summary: object.summary,
      findings: object.findings,
      tokenAnalysis: object.tokenAnalysis,
      latencyAnalysis: object.latencyAnalysis,
      toolAnalysis: object.toolAnalysis,
      watchFor: object.watchFor,
    };

    insertInsightReport(windowId, report);

    try {
      const { MemoryExtractor } = await import('../memory/extractor.js');
      const { memoryStore } = await import('../index.js');
      
      const extractor = new MemoryExtractor();
      const previousMemories = memoryStore ? memoryStore.getAllForService(window.serviceName) : [];
      
      const newMemories = await extractor.extractFromInsight(report, window, windowId, previousMemories);
      if (memoryStore && newMemories.length > 0) {
        for (const m of newMemories) {
          memoryStore.save(m);
        }
      }
    } catch (err) {
      console.error('[daemon] Error extracting memory:', err);
    }

    return report;
  } catch (err) {
    console.error('[daemon] AI analysis failed:', err);
    const report = generateFallbackReport(window, alerts, windowId);
    insertInsightReport(windowId, report);
    return report;
  }
}

// ── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(window: AggregatedWindow, alerts: PatternAlert[], memoryContext: string, previousInsightContext: string): string {
  return `You are an LLM observability expert analyzing a ${window.durationMinutes}-minute window of LLM traces.

Your job is to surface actionable insights, not just restate the numbers.
Provide a COMPREHENSIVE, HIGHLY DETAILED report analyzing the whole context.
Explain WHAT the patterns mean, WHY they matter, and HOW they compare to previous data.
Be specific — reference actual numbers from the data.

${memoryContext ? memoryContext + '\n  ← agent now knows what happened in past windows' : ''}
${previousInsightContext}

## Window Data
${JSON.stringify(window, null, 2)}

## Pattern Alerts Detected
${alerts.length > 0 ? JSON.stringify(alerts, null, 2) : 'No pattern alerts detected.'}

## Instructions
1. Assign a health score (0-100) based on error rate, latency, patterns, and token efficiency.
2. Write a concise headline summarizing the window.
3. Provide a DETAILED summary paragraph analyzing the overall state.
4. List specific, detailed findings with actionable recommendations.
5. Provide deep analysis of token usage trends, latency health, and tool usage patterns.
6. Suggest specific things to watch for in the next window.

Score Guidelines:
- 90-100: Everything healthy, no concerns
- 70-89: Minor issues worth monitoring
- 50-69: Notable problems requiring attention
- 30-49: Significant issues, action needed
- 0-29: Critical problems, immediate action required

Ensure your output is a JSON object wrapped inside a \`\`\`json block. It must perfectly match this schema:
{
  "healthScore": number,
  "headline": string,
  "summary": string,
  "findings": [ { "type": "string", "severity": "critical"|"high"|"medium"|"low"|"info", "title": "string", "detail": "string", "metric": "string", "recommendation": "string" } ],
  "tokenAnalysis": { "trend": "string", "concern": string | null, "recommendation": string | null },
  "latencyAnalysis": { "assessment": "healthy"|"degraded"|"critical", "p95Ms": number, "concern": string | null, "recommendation": string | null },
  "toolAnalysis": { "mostUsed": string | null, "concern": string | null, "recommendation": string | null },
  "watchFor": ["string"]
}
`;
}

// ── Fallback Report ──────────────────────────────────────────────────────────

function generateFallbackReport(window: AggregatedWindow, alerts: PatternAlert[], windowId?: number): InsightReport {
  const errorPct = Math.round(window.errorRate * 100);
  let healthScore = 90;
  if (window.errorRate > 0.3) healthScore -= 40;
  else if (window.errorRate > 0.15) healthScore -= 25;
  else if (window.errorRate > 0.05) healthScore -= 10;
  if (window.p95LatencyMs > 10000) healthScore -= 15;
  if (alerts.some(a => a.severity === 'critical')) healthScore -= 20;
  else if (alerts.some(a => a.severity === 'high')) healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const mostUsedTool = Object.entries(window.toolCallsByName).sort(([,a], [,b]) => b - a)[0];

  return {
    windowId,
    windowStart: window.windowStart, windowEnd: window.windowEnd,
    healthScore,
    headline: window.totalTraces === 0
      ? 'No traces received this window'
      : `${window.totalTraces} traces processed — ${alerts.length > 0 ? `${alerts.length} patterns detected` : 'no issues detected'}`,
    summary: `Processed ${window.totalTraces} traces over ${window.durationMinutes} minutes. Error rate: ${errorPct}%. Average latency: ${Math.round(window.avgLatencyMs)}ms. Token trend: ${window.tokenTrend}.`,
    findings: alerts.map(a => ({
      type: a.type, severity: a.severity as InsightReport['findings'][0]['severity'],
      title: a.title, detail: a.description,
      metric: `${a.affectedTraces.length} traces affected`,
      recommendation: 'Configure an AI model in settings for detailed recommendations.',
    })),
    tokenAnalysis: { trend: window.tokenTrend, concern: window.tokenTrend === 'spiking' ? 'Token usage is spiking' : null, recommendation: null },
    latencyAnalysis: {
      assessment: window.p95LatencyMs > 10000 ? 'critical' : window.p95LatencyMs > 5000 ? 'degraded' : 'healthy',
      p95Ms: window.p95LatencyMs,
      concern: window.p95LatencyMs > 5000 ? `p95 latency is ${Math.round(window.p95LatencyMs)}ms` : null,
      recommendation: null,
    },
    toolAnalysis: { mostUsed: mostUsedTool?.[0] ?? 'none', concern: null, recommendation: null },
    watchFor: ['Configure an AI model in dashboard settings for proactive insights.'],
  };
}
