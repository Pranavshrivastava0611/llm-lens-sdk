import { generateText } from 'ai';
import { z } from 'zod';
import type { InsightReport } from '../store/insights.js';
import type { AggregatedWindow } from '../aggregator/patterns.js';
import { getConfig, hasValidConfig } from '../agent/config.js';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Memory } from './store.js';

const MemorySchema = z.object({
  memories: z.array(z.object({
    type: z.enum([
      'recurring_pattern',
      'model_behavior',
      'cost_pattern',
      'latency_pattern',
      'error_signature',
      'fix_applied',
      'regression',
      'improvement',
    ]),
    content: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    isRecurring: z.boolean(),
    metric: z.string().optional(),
    tags: z.array(z.string()),
  })),
});

export type ExtractedMemory = z.infer<typeof MemorySchema>['memories'][0] & {
  serviceName: string;
  windowId: number;
};

export class MemoryExtractor {
  private buildModel(config: ReturnType<typeof getConfig>) {
    const apiKey = config.keys[config.provider] || '';

    if (config.provider === 'openrouter' || config.provider === 'openai' || config.provider === 'groq') {
      let baseURL = 'https://api.openai.com/v1';
      if (config.provider === 'openrouter') baseURL = 'https://openrouter.ai/api/v1';
      if (config.provider === 'groq') baseURL = 'https://api.groq.com/openai/v1';

      const client = createOpenAI({ baseURL, apiKey });
      return client(config.model);
    }

    if (config.provider === 'anthropic') {
      const client = createAnthropic({ apiKey });
      return client(config.model);
    }

    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  async extractFromInsight(
    insight: InsightReport,
    window: AggregatedWindow,
    windowId: number,
    previousMemories: Memory[]
  ): Promise<ExtractedMemory[]> {
    if (!hasValidConfig()) {
      return [];
    }

    const config = getConfig();

    try {
      const result = await generateText({
        model: this.buildModel(config),
        prompt: `
You are building a long-term memory for an LLM observability system.

Your job is to extract TIMELESS, REUSABLE facts from this analysis window
that would still be useful weeks from now when diagnosing future issues.

## Current Window Insight
Health Score: ${insight.healthScore}
Headline: ${insight.headline}
Summary: ${insight.summary}

Findings:
${insight.findings.map(f => `- [${f.severity}] ${f.title}: ${f.detail}`).join('\n')}

Token Trend: ${insight.tokenAnalysis.trend}
Latency: ${insight.latencyAnalysis.assessment} (p95: ${window.p95LatencyMs}ms)

Tool Usage:
${JSON.stringify(window.toolCallsByName, null, 2)}

## Existing Memories (don't duplicate these)
${previousMemories.slice(0, 20).map(m => `- [${m.type}] ${m.content}`).join('\n') || 'None yet'}

## Rules
1. Extract 2-5 memories maximum. Quality over quantity.
2. Each memory must be a SPECIFIC, FACTUAL statement.
   Good: "Token spikes occur when toolCallCount > 8 per trace"
   Bad:  "There were token issues in this window"
3. Only extract memories with confidence — don't guess.
4. Mark isRecurring=true only if this matches a pattern
   you see in existing memories.
5. Don't duplicate existing memories — extend or reinforce them.
6. Include actual numbers where available.

Ensure your output is a JSON object wrapped inside a \`\`\`json block. It must perfectly match this schema:
{
  "memories": [
    {
      "type": "recurring_pattern"|"model_behavior"|"cost_pattern"|"latency_pattern"|"error_signature"|"fix_applied"|"regression"|"improvement",
      "content": "string",
      "confidence": "high"|"medium"|"low",
      "isRecurring": boolean,
      "metric": "string",
      "tags": ["string"]
    }
  ]
}
        `,
      });
      
      const text = result.text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error("Failed to parse JSON");
      const object = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return object.memories.map((m: any) => ({
        ...m,
        serviceName: window.serviceName,
        windowId,
      }));
    } catch (err) {
      console.error('[daemon] Memory extraction failed:', err);
      return [];
    }
  }
}
