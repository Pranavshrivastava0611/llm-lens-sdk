import { getDb } from './traces.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface InsightReport {
  windowId?: number;
  windowStart: string;
  windowEnd: string;
  healthScore: number;
  headline: string;
  summary: string;
  findings: InsightFinding[];
  tokenAnalysis: {
    trend: string;
    concern: string | null;
    recommendation: string | null;
  };
  latencyAnalysis: {
    assessment: 'healthy' | 'degraded' | 'critical';
    p95Ms: number;
    concern: string | null;
    recommendation: string | null;
  };
  toolAnalysis: {
    mostUsed: string | null;
    concern: string | null;
    recommendation: string | null;
  };
  watchFor: string[];
}

export interface InsightFinding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  detail: string;
  metric: string;
  recommendation: string;
}

export interface AgentConfig {
  provider: string;
  keys: Record<string, string>;
  model: string;
  updatedAt: string;
}

// ── Insight Report Store ─────────────────────────────────────────────────────

export function insertAggregatedWindow(
  windowStart: string,
  windowEnd: string,
  data: unknown,
  patternAlerts: unknown[]
): number {
  const database = getDb();
  const result = database.prepare(`
    INSERT INTO aggregated_windows (windowStart, windowEnd, data, patternAlerts)
    VALUES (?, ?, ?, ?)
  `).run(windowStart, windowEnd, JSON.stringify(data), JSON.stringify(patternAlerts));

  return result.lastInsertRowid as number;
}

export function insertInsightReport(windowId: number | null, report: InsightReport): number {
  const database = getDb();
  const result = database.prepare(`
    INSERT INTO insight_reports (
      windowId, healthScore, headline, summary,
      findings, tokenAnalysis, latencyAnalysis, toolAnalysis, watchFor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    windowId,
    report.healthScore,
    report.headline,
    report.summary,
    JSON.stringify(report.findings),
    JSON.stringify(report.tokenAnalysis),
    JSON.stringify(report.latencyAnalysis),
    JSON.stringify(report.toolAnalysis),
    JSON.stringify(report.watchFor)
  );
  return result.lastInsertRowid as number;
}

export function getRecentInsights(limit: number = 10): InsightReport[] {
  const database = getDb();
  const rows = database.prepare(`
    SELECT * FROM insight_reports
    ORDER BY createdAt DESC
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>;

  return rows.map(rowToInsight);
}

// ── Agent Config Store ───────────────────────────────────────────────────────

export function getAgentConfig(): AgentConfig {
  const database = getDb();
  const row = database.prepare('SELECT * FROM agent_config WHERE id = 1').get() as Record<string, unknown> | undefined;

  if (!row) {
    return {
      provider: 'openrouter',
      keys: {},
      model: 'anthropic/claude-sonnet-4-6',
      updatedAt: new Date().toISOString(),
    };
  }

  let keys = {};
  try {
    keys = JSON.parse(row.keys as string);
  } catch {
    // Ignore invalid JSON
  }

  return {
    provider: row.provider as string,
    keys,
    model: row.model as string,
    updatedAt: row.updatedAt as string,
  };
}

export function updateAgentConfig(config: Omit<AgentConfig, 'updatedAt'>): void {
  const database = getDb();
  database.prepare(`
    UPDATE agent_config SET
      provider = ?,
      keys = ?,
      model = ?,
      updatedAt = datetime('now')
    WHERE id = 1
  `).run(config.provider, JSON.stringify(config.keys), config.model);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToInsight(row: Record<string, unknown>): InsightReport {
  return {
    windowId: row.windowId as number,
    windowStart: (row.createdAt as string) ?? '',
    windowEnd: (row.createdAt as string) ?? '',
    healthScore: row.healthScore as number,
    headline: row.headline as string,
    summary: row.summary as string,
    findings: JSON.parse(row.findings as string) as InsightFinding[],
    tokenAnalysis: JSON.parse(row.tokenAnalysis as string) as InsightReport['tokenAnalysis'],
    latencyAnalysis: JSON.parse(row.latencyAnalysis as string) as InsightReport['latencyAnalysis'],
    toolAnalysis: JSON.parse(row.toolAnalysis as string) as InsightReport['toolAnalysis'],
    watchFor: JSON.parse(row.watchFor as string) as string[],
  };
}
