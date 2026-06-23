import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoredTrace {
  id?: number;
  traceId: string;
  serviceName: string;
  spans: string;          // JSON
  durationMs: number;
  spanCount: number;
  hasError: boolean;
  createdAt: string;
}

// ── Database Initialization ──────────────────────────────────────────────────

let db: Database.Database | null = null;

export function getDbPath(): string {
  const dir = join(homedir(), '.llm-autopilot');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'autopilot.db');
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ── Schema ───────────────────────────────────────────────────────────────────

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS traces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traceId TEXT NOT NULL UNIQUE,
      serviceName TEXT NOT NULL,
      spans TEXT NOT NULL,
      durationMs REAL NOT NULL,
      spanCount INTEGER NOT NULL,
      hasError INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_traces_traceId ON traces(traceId);
    CREATE INDEX IF NOT EXISTS idx_traces_createdAt ON traces(createdAt);

    CREATE TABLE IF NOT EXISTS trace_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traceId TEXT NOT NULL UNIQUE,
      serviceName TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      totalDurationMs REAL NOT NULL,
      spanCount INTEGER NOT NULL,
      promptTokens INTEGER NOT NULL DEFAULT 0,
      completionTokens INTEGER NOT NULL DEFAULT 0,
      totalTokens INTEGER NOT NULL DEFAULT 0,
      models TEXT NOT NULL DEFAULT '[]',
      toolCallCount INTEGER NOT NULL DEFAULT 0,
      toolNames TEXT NOT NULL DEFAULT '[]',
      toolCallsPerTool TEXT NOT NULL DEFAULT '{}',
      hasError INTEGER NOT NULL DEFAULT 0,
      errorCount INTEGER NOT NULL DEFAULT 0,
      errorTypes TEXT NOT NULL DEFAULT '[]',
      finishReasons TEXT NOT NULL DEFAULT '[]',
      patterns TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trace_metrics_timestamp ON trace_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_trace_metrics_createdAt ON trace_metrics(createdAt);

    CREATE TABLE IF NOT EXISTS aggregated_windows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      windowStart TEXT NOT NULL,
      windowEnd TEXT NOT NULL,
      data TEXT NOT NULL,
      patternAlerts TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS insight_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      windowId INTEGER,
      healthScore INTEGER NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      findings TEXT NOT NULL DEFAULT '[]',
      tokenAnalysis TEXT NOT NULL DEFAULT '{}',
      latencyAnalysis TEXT NOT NULL DEFAULT '{}',
      toolAnalysis TEXT NOT NULL DEFAULT '{}',
      watchFor TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (windowId) REFERENCES aggregated_windows(id)
    );

    CREATE TABLE IF NOT EXISTS agent_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL DEFAULT 'openrouter',
      keys TEXT NOT NULL DEFAULT '{}',
      model TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4-6',
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    database.exec("ALTER TABLE agent_config ADD COLUMN keys TEXT NOT NULL DEFAULT '{}'");
  } catch (e) {
    // Ignore if column already exists
  }

  database.exec(`
    INSERT OR IGNORE INTO agent_config (id, provider, keys, model)
    VALUES (1, 'openrouter', '{}', 'anthropic/claude-sonnet-4-6');
  `);
}

// ── Trace Operations ─────────────────────────────────────────────────────────

export function insertTrace(trace: Omit<StoredTrace, 'id' | 'createdAt'>): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO traces (traceId, serviceName, spans, durationMs, spanCount, hasError)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    trace.traceId,
    trace.serviceName,
    trace.spans,
    trace.durationMs,
    trace.spanCount,
    trace.hasError ? 1 : 0
  );
}

export function getTrace(traceId: string): StoredTrace | undefined {
  const database = getDb();
  return database.prepare('SELECT * FROM traces WHERE traceId = ?').get(traceId) as StoredTrace | undefined;
}

export function getRecentRawSpans(limit: number = 100): Array<any> {
  const database = getDb();
  // Fetch recent traces
  const rows = database.prepare(`
    SELECT spans, serviceName FROM traces
    ORDER BY createdAt DESC
    LIMIT ?
  `).all(limit) as Array<{ spans: string; serviceName: string }>;

  const recentSpans: Array<any> = [];
  
  for (const row of rows) {
    try {
      const parsedSpans = JSON.parse(row.spans);
      for (const span of parsedSpans) {
        recentSpans.push({
          name: span.name,
          traceId: span.traceId,
          serviceName: row.serviceName,
          status: span.status,
          durationMs: span.endTime ? span.endTime - span.startTime : undefined,
          attributes: span.attributes,
          events: span.events,
        });
      }
    } catch {
      // Ignore parse errors
    }
    
    if (recentSpans.length >= limit) break;
  }
  
  // Return the most recent ones up to the limit
  return recentSpans.slice(0, limit);
}

// ── Retention Cleanup ────────────────────────────────────────────────────────

export function cleanupOldData(): void {
  const database = getDb();

  // Keep last 7 days of traces and trace_metrics
  database.prepare(`
    DELETE FROM traces WHERE createdAt < datetime('now', '-7 days')
  `).run();

  database.prepare(`
    DELETE FROM trace_metrics WHERE createdAt < datetime('now', '-7 days')
  `).run();

  // Keep last 30 days of insight_reports and aggregated_windows
  database.prepare(`
    DELETE FROM insight_reports WHERE createdAt < datetime('now', '-30 days')
  `).run();

  database.prepare(`
    DELETE FROM aggregated_windows WHERE createdAt < datetime('now', '-30 days')
  `).run();
}
