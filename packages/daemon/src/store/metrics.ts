import { getDb } from './traces.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TraceMetrics {
  traceId: string;
  serviceName: string;
  timestamp: number;
  totalDurationMs: number;
  spanCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  models: string[];
  toolCallCount: number;
  toolNames: string[];
  toolCallsPerTool: Record<string, number>;
  hasError: boolean;
  errorCount: number;
  errorTypes: string[];
  finishReasons: string[];
  patterns: TracePatterns;
}

export interface TracePatterns {
  hasLoop: boolean;
  hasRepetitiveTool: boolean;
  hasTokenSpike: boolean;
  hasContextOverflow: boolean;
  hasMaxStepsReached: boolean;
  hasSilentFailure: boolean;
  hasHighLatency: boolean;
}

// ── Store Operations ─────────────────────────────────────────────────────────

export function insertTraceMetrics(metrics: TraceMetrics): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO trace_metrics (
      traceId, serviceName, timestamp,
      totalDurationMs, spanCount,
      promptTokens, completionTokens, totalTokens,
      models, toolCallCount, toolNames, toolCallsPerTool,
      hasError, errorCount, errorTypes, finishReasons,
      patterns
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    metrics.traceId,
    metrics.serviceName,
    metrics.timestamp,
    metrics.totalDurationMs,
    metrics.spanCount,
    metrics.promptTokens,
    metrics.completionTokens,
    metrics.totalTokens,
    JSON.stringify(metrics.models),
    metrics.toolCallCount,
    JSON.stringify(metrics.toolNames),
    JSON.stringify(metrics.toolCallsPerTool),
    metrics.hasError ? 1 : 0,
    metrics.errorCount,
    JSON.stringify(metrics.errorTypes),
    JSON.stringify(metrics.finishReasons),
    JSON.stringify(metrics.patterns)
  );
}

export function getMetricsInRange(startMs: number, endMs: number): TraceMetrics[] {
  const database = getDb();
  const rows = database.prepare(`
    SELECT * FROM trace_metrics
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `).all(startMs, endMs) as Array<Record<string, unknown>>;

  return rows.map(rowToMetrics);
}

export function getRecentMetrics(hours: number): TraceMetrics[] {
  const startMs = Date.now() - hours * 60 * 60 * 1000;
  return getMetricsInRange(startMs, Date.now());
}

export function getMetricsCount(): number {
  const database = getDb();
  const row = database.prepare('SELECT COUNT(*) as count FROM trace_metrics').get() as { count: number };
  return row.count;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToMetrics(row: Record<string, unknown>): TraceMetrics {
  return {
    traceId: row.traceId as string,
    serviceName: row.serviceName as string,
    timestamp: row.timestamp as number,
    totalDurationMs: row.totalDurationMs as number,
    spanCount: row.spanCount as number,
    promptTokens: row.promptTokens as number,
    completionTokens: row.completionTokens as number,
    totalTokens: row.totalTokens as number,
    models: JSON.parse(row.models as string) as string[],
    toolCallCount: row.toolCallCount as number,
    toolNames: JSON.parse(row.toolNames as string) as string[],
    toolCallsPerTool: JSON.parse(row.toolCallsPerTool as string) as Record<string, number>,
    hasError: (row.hasError as number) === 1,
    errorCount: row.errorCount as number,
    errorTypes: JSON.parse(row.errorTypes as string) as string[],
    finishReasons: JSON.parse(row.finishReasons as string) as string[],
    patterns: JSON.parse(row.patterns as string) as TracePatterns,
  };
}
