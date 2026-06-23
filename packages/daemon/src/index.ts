import { createServer } from 'node:http';
import { SpanReceiver } from './receiver.js';
import { DashboardWsServer } from './ws/server.js';
import { AggregationWindowManager } from './aggregator/window.js';
import { extractMetrics, type CompletedTrace } from './aggregator/metrics.js';
import { detectTracePatterns } from './aggregator/patterns.js';
import { analyzeWindow } from './agent/analyzer.js';
import { setConfig, getPublicConfig } from './agent/config.js';
import { getDb, cleanupOldData } from './store/traces.js';
import { MemoryStore } from './memory/store.js';
import { BundleManager } from './memory/bundle.js';

export interface DaemonOptions {
  port: number;
  provider?: string;
  apiKey?: string;
  model?: string;
}

export let memoryStore: MemoryStore | null = null;
export let bundleManager: BundleManager | null = null;

export function startDaemon(options: DaemonOptions): { close: () => void } {
  const { port } = options;

  // Initialize database and cleanup
  const database = getDb();
  cleanupOldData();

  memoryStore = new MemoryStore(database);
  bundleManager = new BundleManager(memoryStore, database);

  // Set agent config from CLI args if provided
  if (options.apiKey) {
    setConfig({
      provider: options.provider ?? 'openrouter',
      apiKey: options.apiKey,
      model: options.model ?? 'anthropic/claude-sonnet-4-6',
    });
  }

  // Create receiver
  const receiver = new SpanReceiver();

  // Create HTTP server
  const server = createServer(async (req, res) => {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (req.url?.startsWith('/memory/')) {
      if (req.method === 'GET' && req.url.startsWith('/memory/context/')) {
        const serviceName = req.url.split('/')[3];
        const context = memoryStore!.getMemoryContext(serviceName);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ context }));
        return;
      }

      if (req.method === 'GET' && req.url.startsWith('/memory/service/')) {
        try {
          const serviceName = req.url.split('/')[3];
          const memories = memoryStore!.getAllForService(serviceName);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ memories }));
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.method === 'POST' && req.url === '/memory/export') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { serviceName, description } = JSON.parse(body);
            const bundle = await bundleManager!.exportBundle(serviceName, description);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: true, bundle, downloadUrl: `/memory/download/${bundle.bundleId}` }));
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.method === 'GET' && req.url.startsWith('/memory/download/')) {
        try {
          const bundleId = req.url.split('/')[3];
          const row = database.prepare('SELECT payload FROM memory_exports WHERE bundleId = ?').get(bundleId) as any;
          if (!row) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Bundle not found' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Disposition', `attachment; filename="llm-autopilot-memory-${bundleId.slice(0, 8)}.json"`);
          res.writeHead(200);
          res.end(row.payload);
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.method === 'POST' && req.url === '/memory/import') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const bundle = JSON.parse(body);
            const result = bundleManager!.importBundle(bundle);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: true, ...result }));
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.method === 'GET' && req.url.startsWith('/report/download/')) {
        const windowIdStr = req.url.split('/')[3];
        if (!windowIdStr) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Missing windowId' }));
          return;
        }

        const windowId = parseInt(windowIdStr, 10);
        
        try {
          const winRow = database.prepare('SELECT data, patternAlerts FROM aggregated_windows WHERE id = ?').get(windowId) as any;
          const insRow = database.prepare('SELECT healthScore, headline, summary, findings, tokenAnalysis, latencyAnalysis, toolAnalysis, watchFor FROM insight_reports WHERE windowId = ?').get(windowId) as any;

          if (!winRow || !insRow) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }

          const windowData = JSON.parse(winRow.data);
          const alerts = JSON.parse(winRow.patternAlerts);
          const insight = {
            healthScore: insRow.healthScore,
            headline: insRow.headline,
            summary: insRow.summary,
            findings: JSON.parse(insRow.findings),
            tokenAnalysis: JSON.parse(insRow.tokenAnalysis),
            latencyAnalysis: JSON.parse(insRow.latencyAnalysis),
            toolAnalysis: JSON.parse(insRow.toolAnalysis),
            watchFor: JSON.parse(insRow.watchFor),
          };

          import('./agent/report.js').then(({ generateMarkdownReport }) => {
            const md = generateMarkdownReport(windowData, alerts, insight as any);
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Disposition', `attachment; filename="llm-autopilot-report-${windowId}.md"`);
            res.writeHead(200);
            res.end(md);
          }).catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: err.message }));
          });
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      res.end();
      return;
    }

    receiver.handleRequest(req, res);
  });

  // Create WebSocket server
  let windowManager: AggregationWindowManager | null = null;
  const wsServer = new DashboardWsServer(server, () => receiver.getRecentSpans(), () => windowManager?.computeCurrentWindow() ?? null);

  // Create aggregation window manager
  windowManager = new AggregationWindowManager({
    onWindowClose: async (window, alerts) => {
      console.log(`[daemon] Window closed: ${window.totalTraces} traces, ${alerts.length} alerts`);

      // Store and run AI analysis
      const { insertAggregatedWindow } = await import('./store/insights.js');
      const windowId = insertAggregatedWindow(window.windowStart, window.windowEnd, window, alerts);

      const insight = await analyzeWindow(window, alerts, windowId);

      if (insight) {
        wsServer.broadcastInsightReady(insight);
        console.log(`[daemon] Insight generated: ${insight.headline} (score: ${insight.healthScore})`);
      }
    },
    onPartialUpdate: (partial) => {
      wsServer.broadcastMetricsUpdate({ currentWindow: partial });
    },
  });

  // Wire up events
  receiver.on('span', (spanData) => {
    wsServer.broadcastSpan(spanData);
  });

  receiver.on('trace:complete', (traceData: CompletedTrace) => {
    // Extract metrics
    const metrics = extractMetrics(traceData);

    // Broadcast trace complete
    wsServer.broadcastTraceComplete({
      traceId: traceData.traceId,
      durationMs: traceData.durationMs,
      spanCount: traceData.spanCount,
      hasError: traceData.hasError,
      patterns: metrics.patterns,
      totalTokens: metrics.totalTokens,
    });

    // Check for immediate pattern alerts
    const immediateAlerts = detectTracePatterns(metrics);
    for (const alert of immediateAlerts) {
      wsServer.broadcastPatternAlert(alert);
    }
  });

  receiver.on('config:update', (config: { provider: string; model: string }) => {
    wsServer.broadcastConfigUpdated(config);
  });

  wsServer.on('force:analysis', () => {
    console.log('[daemon] Force analysis requested by client');
    windowManager?.forceCloseWindow();
  });

  wsServer.on('force:deep_analysis', async () => {
    console.log('[daemon] Deep Agentic Analysis requested by client');
    const { runDeepAgenticAnalysis } = await import('./agent/deepAnalyzer.js');
    const insight = await runDeepAgenticAnalysis();
    if (insight) {
      wsServer.broadcastInsightReady(insight);
      console.log(`[daemon] Deep Agentic Insight generated: ${insight.headline} (score: ${insight.healthScore})`);
    } else {
      // In case it fails, we still want to unblock the frontend. We can broadcast a mock insight or something, or handle error properly.
      // But for now, we just broadcast a default insight
      wsServer.broadcastInsightReady({
        id: -1,
        timestamp: new Date().toISOString(),
        type: 'deep_analysis',
        healthScore: 0,
        headline: 'Deep Analysis Failed',
        data: {
          headline: 'Deep Analysis Failed',
          healthScore: 0,
          summary: 'The agent encountered an error or no API key was provided.',
          findings: [],
          tokenAnalysis: { trend: 'unknown', concern: null, recommendation: null },
          latencyAnalysis: { assessment: 'unknown', p95Ms: 0, concern: null, recommendation: null },
          toolAnalysis: { mostUsed: 'none', concern: null, recommendation: null },
          watchFor: ['Check daemon console logs for API key or rate limit issues.']
        }
      } as any);
    }
  });

  // Start
  windowManager.start();

  server.listen(port, () => {
    const config = getPublicConfig();
    console.log(`[daemon] Listening on http://localhost:${port}`);
    console.log(`[daemon] Judge model: ${config.provider} / ${config.model} ${config.hasApiKey ? '✓' : '(no key)'}`);
  });

  return {
    close: () => {
      windowManager.stop();
      server.close();
    },
  };
}
