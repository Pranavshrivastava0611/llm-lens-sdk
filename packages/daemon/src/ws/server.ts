import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import { getRecentInsights, getAgentConfig, updateAgentConfig } from '../store/insights.js';
import { getRecentMetrics } from '../store/metrics.js';

import { EventEmitter } from 'node:events';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WsMessage {
  type: string;
  data: unknown;
}

// ── WebSocket Server ─────────────────────────────────────────────────────────

export class DashboardWsServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private getRecentSpans: () => any[];
  private getCurrentWindow: () => any | null;

  constructor(server: Server, getRecentSpans: () => any[] = () => [], getCurrentWindow: () => any | null = () => null) {
    super();
    this.getRecentSpans = getRecentSpans;
    this.getCurrentWindow = getCurrentWindow;
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send init data
      this.sendInit(ws);

      ws.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString()) as WsMessage;
          this.handleClientMessage(ws, msg);
        } catch {
          // Ignore invalid messages
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  // ── Broadcast Methods ──────────────────────────────────────────────────

  broadcast(type: string, data: unknown): void {
    const message = JSON.stringify({ type, data });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastSpan(spanData: unknown): void {
    this.broadcast('span', spanData);
  }

  broadcastTraceComplete(traceData: unknown): void {
    this.broadcast('trace:complete', traceData);
  }

  broadcastMetricsUpdate(metricsData: unknown): void {
    this.broadcast('metrics:update', metricsData);
  }

  broadcastPatternAlert(alert: unknown): void {
    this.broadcast('pattern:alert', alert);
  }

  broadcastInsightReady(insight: unknown): void {
    this.broadcast('insight:ready', insight);
  }

  broadcastConfigUpdated(config: { provider: string; model: string }): void {
    this.broadcast('config:updated', config);
  }

  get clientCount(): number {
    return this.clients.size;
  }

  // ── Private ────────────────────────────────────────────────────────────

  private sendInit(ws: WebSocket): void {
    const recentMetrics = getRecentMetrics(24);
    const recentInsights = getRecentInsights(10);
    const agentConfig = getAgentConfig();

    const initData = {
      recentMetrics,
      recentInsights,
      recentSpans: this.getRecentSpans(),
      currentWindowStats: this.getCurrentWindow(),
      agentConfig: {
        provider: agentConfig.provider,
        model: agentConfig.model,
        hasApiKey: Boolean(agentConfig.keys[agentConfig.provider] && agentConfig.keys[agentConfig.provider].length > 0),
        keys: agentConfig.keys,
      },
    };

    ws.send(JSON.stringify({ type: 'init', data: initData }));
  }

  private handleClientMessage(_ws: WebSocket, msg: WsMessage): void {
    switch (msg.type) {
      case 'config:agent': {
        const data = msg.data as { provider?: string; apiKey?: string; model?: string; keys?: Record<string, string> };
        const validProviders = ['openrouter', 'openai', 'anthropic', 'groq'];

        if (data.provider && !validProviders.includes(data.provider)) return;

        const current = getAgentConfig();
        const keys = { ...current.keys };
        if (data.keys) Object.assign(keys, data.keys);
        if (data.apiKey && data.provider) keys[data.provider] = data.apiKey;
        else if (data.apiKey) keys[current.provider] = data.apiKey;

        updateAgentConfig({
          provider: data.provider ?? current.provider,
          keys,
          model: data.model ?? current.model,
        });

        const updated = getAgentConfig();
        this.broadcastConfigUpdated({
          provider: updated.provider,
          model: updated.model,
        });
        break;
      }

      case 'request:history': {
        const data = msg.data as { hours?: number } | undefined;
        const hours = data?.hours ?? 24;
        const metrics = getRecentMetrics(hours);
        _ws.send(JSON.stringify({ type: 'history', data: { metrics } }));
        break;
      }

      case 'force:analysis': {
        this.emit('force:analysis');
        break;
      }

      case 'force:deep_analysis': {
        this.emit('force:deep_analysis');
        break;
      }
    }
  }
}
