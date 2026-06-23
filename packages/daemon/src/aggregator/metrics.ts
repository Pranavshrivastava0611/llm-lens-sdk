import type { IngestSpan } from '../receiver.js';
import { insertTraceMetrics, type TraceMetrics, type TracePatterns } from '../store/metrics.js';

// ── Metric Extractor ─────────────────────────────────────────────────────────

export interface CompletedTrace {
  traceId: string;
  serviceName: string;
  spans: IngestSpan[];
  durationMs: number;
  spanCount: number;
  hasError: boolean;
}

export function extractMetrics(trace: CompletedTrace): TraceMetrics {
  const spans = trace.spans;

  // Token extraction
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  // Model tracking
  const modelSet = new Set<string>();

  // Tool tracking
  let toolCallCount = 0;
  const toolCalls: Record<string, number> = {};
  const toolNameSet = new Set<string>();

  // Error tracking
  let errorCount = 0;
  const errorTypes: string[] = [];
  const finishReasons: string[] = [];

  // Span name counting (for loop detection)
  const spanNameCounts: Record<string, number> = {};

  // Event tracking
  let hasMaxStepsReached = false;
  let hasSilentFailure = false;

  for (const span of spans) {
    const attrs = span.attributes;

    // Tokens
    const pt = (attrs['ai.usage.promptTokens'] as number) ?? 0;
    const ct = (attrs['ai.usage.completionTokens'] as number) ?? 0;
    const tt = (attrs['ai.usage.totalTokens'] as number) ?? 0;
    promptTokens += pt;
    completionTokens += ct;
    totalTokens += tt;

    // Models
    const modelId = attrs['ai.model.id'] as string | undefined;
    if (modelId) modelSet.add(modelId);

    // Tool calls from attributes
    const tcCount = (attrs['ai.toolCallCount'] as number) ?? 0;
    toolCallCount += tcCount;

    const tcNames = attrs['ai.toolCallNames'] as string | undefined;
    if (tcNames) {
      for (const name of tcNames.split(',').filter(Boolean)) {
        toolNameSet.add(name);
        toolCalls[name] = (toolCalls[name] ?? 0) + 1;
      }
    }

    // Errors
    if (span.status.code === 2) {
      errorCount++;
      if (span.status.message) {
        errorTypes.push(span.status.message);
      }
    }

    // Finish reasons
    const fr = attrs['ai.finishReason'] as string | undefined;
    if (fr) finishReasons.push(fr);

    // Span name counting
    spanNameCounts[span.name] = (spanNameCounts[span.name] ?? 0) + 1;

    // Events
    for (const event of span.events) {
      if (event.name === 'maxSteps.reached') {
        hasMaxStepsReached = true;
      }
      if (event.name === 'tool.called') {
        const toolName = event.attributes.toolName as string | undefined;
        toolCallCount++; // Increment for each tool event
        if (toolName) {
          toolNameSet.add(toolName);
          toolCalls[toolName] = (toolCalls[toolName] ?? 0) + 1;
        }
      }
    }

    // Silent failure: no error status, but no output
    const responseText = attrs['ai.response.text'] as string | undefined;
    if (span.status.code !== 2 && (!responseText || responseText === 'null' || responseText === '')) {
      hasSilentFailure = true;
    }
  }

  // Compute patterns
  const hasLoop = Object.values(spanNameCounts).some((count) => count >= 3);
  const hasRepetitiveTool = Object.values(toolCalls).some((count) => count >= 3);
  const hasTokenSpike = totalTokens > 10000;
  const hasContextOverflow = finishReasons.includes('length');
  const hasHighLatency = trace.durationMs > 15000;

  const patterns: TracePatterns = {
    hasLoop,
    hasRepetitiveTool,
    hasTokenSpike,
    hasContextOverflow,
    hasMaxStepsReached,
    hasSilentFailure,
    hasHighLatency,
  };

  const metrics: TraceMetrics = {
    traceId: trace.traceId,
    serviceName: trace.serviceName,
    timestamp: Date.now(),
    totalDurationMs: trace.durationMs,
    spanCount: trace.spanCount,
    promptTokens,
    completionTokens,
    totalTokens,
    models: [...modelSet],
    toolCallCount,
    toolNames: [...toolNameSet],
    toolCallsPerTool: toolCalls,
    hasError: trace.hasError,
    errorCount,
    errorTypes,
    finishReasons,
    patterns,
  };

  // Store in SQLite
  insertTraceMetrics(metrics);

  return metrics;
}
