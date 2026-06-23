import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { insertInsightReport, type InsightReport } from '../store/insights.js';
import { getConfig } from './config.js';
import { getDb } from '../store/traces.js';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export async function runDeepAgenticAnalysis() {
  console.log('[daemon] Starting deep agentic analysis...');
  const config = getConfig();
  if (!config.keys[config.provider]) {
    console.warn('[daemon] Cannot run deep analysis without API key');
    return null;
  }

  // Set up model
  let model: any;
  if (config.provider === 'groq') {
    model = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: config.keys.groq })(config.model);
  } else if (config.provider === 'openai') {
    model = createOpenAI({ apiKey: config.keys.openai })(config.model);
  } else if (config.provider === 'anthropic') {
    model = createAnthropic({ apiKey: config.keys.anthropic })(config.model);
  } else {
    model = createOpenAI({ apiKey: config.keys.openrouter, baseURL: 'https://openrouter.ai/api/v1' })(config.model);
  }

  const db = getDb();

  // Define tools for the agent
  const tools = {
    get_error_traces: tool({
      description: 'Query recent traces that failed or contained errors.',
      inputSchema: z.object({
        limit: z.number().default(10),
      }),
      execute: async ({ limit }) => {
        const stmt = db.prepare(`SELECT traceId, serviceName, durationMs, createdAt FROM traces WHERE hasError = 1 ORDER BY createdAt DESC LIMIT ?`);
        return stmt.all(limit);
      },
    }),
    get_slowest_traces: tool({
      description: 'Query the traces with the highest latency (durationMs).',
      inputSchema: z.object({
        limit: z.number().default(10),
      }),
      execute: async ({ limit }) => {
        const stmt = db.prepare(`SELECT traceId, serviceName, durationMs, createdAt FROM traces ORDER BY durationMs DESC LIMIT ?`);
        return stmt.all(limit);
      },
    }),
    get_model_usage: tool({
      description: 'Query token counts and usage grouped by model name from the spans data.',
      inputSchema: z.object({
        limit: z.number().default(10),
      }),
      execute: async ({ limit }) => {
        // This tool requires extracting the model name from the spans JSON
        // Since sqlite JSON processing can be heavy, we will just fetch the last 100 traces and compute it in code.
        const stmt = db.prepare(`SELECT spans FROM traces ORDER BY createdAt DESC LIMIT 100`);
        const rows = stmt.all() as { spans: string }[];
        const usage: Record<string, number> = {};
        for (const row of rows) {
          const spans = JSON.parse(row.spans) as any[];
          for (const s of spans) {
            const model = s.attributes?.['ai.model.id'] as string;
            const tokens = s.attributes?.['ai.usage.totalTokens'] as number;
            if (model && tokens) {
              usage[model] = (usage[model] || 0) + tokens;
            }
          }
        }
        return usage;
      },
    }),
    get_trace_details: tool({
      description: 'Fetch the full massive JSON payload for a specific traceId to deep dive into exactly why it broke.',
      inputSchema: z.object({
        traceId: z.string(),
      }),
      execute: async ({ traceId }) => {
        const stmt = db.prepare(`SELECT spans FROM traces WHERE traceId = ?`);
        const row = stmt.get(traceId) as { spans: string };
        if (!row) return { error: 'Trace not found' };
        return JSON.parse(row.spans);
      },
    }),
    get_traces_by_time_range: tool({
      description: 'Fetches traces within a specific time window to identify patterns.',
      inputSchema: z.object({
        startTimeIso: z.string(),
        endTimeIso: z.string(),
        limit: z.number().default(20),
      }),
      execute: async ({ startTimeIso, endTimeIso, limit }) => {
        const stmt = db.prepare(`SELECT traceId, serviceName, durationMs, hasError, createdAt FROM traces WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC LIMIT ?`);
        return stmt.all(startTimeIso, endTimeIso, limit);
      },
    }),
    search_prompt_content: tool({
      description: 'Searches for specific keywords within prompt inputs or responses to find contextual issues.',
      inputSchema: z.object({
        keyword: z.string(),
        limit: z.number().default(10),
      }),
      execute: async ({ keyword, limit }) => {
        const stmt = db.prepare(`SELECT traceId, serviceName, createdAt FROM traces WHERE spans LIKE ? ORDER BY createdAt DESC LIMIT ?`);
        return stmt.all(`%${keyword}%`, limit);
      },
    }),
  };

  try {
    const result = await generateText({
      model,
      system: `You are an elite AI observability engineer. Your job is to perform a deep agentic analysis of a local LLM application's trace data.
You have access to a SQLite database of OpenTelemetry traces through your tools.
You MUST use your tools to investigate errors, performance bottlenecks, and token usage.

CRITICAL INSTRUCTIONS:
1. You MUST call tools first to gather data. DO NOT output your final JSON report immediately.
2. Start by calling 'get_error_traces' or 'get_slowest_traces'. Wait for the tool result.
3. If you find an interesting trace, use 'get_trace_details' to investigate further.
4. ONLY after you have gathered enough data from your tools, produce your final comprehensive report.

The final report MUST be formatted as a JSON object inside a \`\`\`json block that perfectly matches this schema:
{
  "headline": string,
  "healthScore": number, // 0-100
  "summary": string, // Extremely detailed markdown analysis using your findings
  "findings": [ { "type": "error"|"performance"|"cost", "severity": "critical"|"warning"|"info", "title": string, "detail": string, "metric": string, "recommendation": string } ],
  "tokenAnalysis": { "trend": string, "concern": string | null, "recommendation": string | null },
  "latencyAnalysis": { "assessment": string, "p95Ms": number, "concern": string | null, "recommendation": string | null },
  "toolAnalysis": { "mostUsed": string, "concern": string | null, "recommendation": string | null },
  "watchFor": string[]
}
DO NOT output the final JSON block until you are done investigating!`,
      prompt: 'Begin your deep agentic analysis of the system.',
      tools,
      stopWhen : stepCountIs(10)
    });

    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from deep analysis output");
    }

    const reportData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // Insert as deep_analysis
    const insightId = insertInsightReport(
      null,
      {
        windowId: undefined,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
        ...reportData
      }
    );

    return {
      id: insightId,
      timestamp: new Date().toISOString(),
      type: 'deep_analysis',
      windowId: null,
      windowStart: new Date().toISOString(),
      windowEnd: new Date().toISOString(),
      ...reportData
    };
  } catch (err: any) {
    console.error('[daemon] Deep Agentic Analysis failed:', err);
    return null;
  }
}
