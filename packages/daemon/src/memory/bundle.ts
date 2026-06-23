import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { MemoryStore, Memory } from './store.js';
import { getRecentInsights } from '../store/insights.js';
import { getRecentMetrics } from '../store/metrics.js';

export interface MemoryBundle {
  bundleId: string;
  version: '1.0';
  exportedAt: string;
  exportedBy: string;
  description: string;

  summary: {
    totalMemories: number;
    topPatterns: string[];
    avgHealthScore: number;
    services: string[];
  };

  memories: Array<{
    type: string;
    content: string;
    confidence: string;
    isRecurring: boolean;
    metric?: string;
    tags: string[];
    reinforceCount: number;
    firstSeen: string;
    lastSeen: string;
  }>;

  recentInsights: Array<{
    headline: string;
    summary: string;
    healthScore: number;
    windowDate: string;
  }>;
}

export interface ImportResult {
  bundleId: string;
  memoriesImported: number;
  memoriesSkipped: number;
  source: string;
}

export class BundleManager {
  constructor(
    private memoryStore: MemoryStore,
    private db: Database.Database
  ) {}

  async exportBundle(
    serviceName: string,
    description: string = ''
  ): Promise<MemoryBundle> {
    const memories = this.memoryStore.getAllForService(serviceName);
    const insights = getRecentInsights(5);

    const bundle: MemoryBundle = {
      bundleId: randomUUID(),
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: serviceName,
      description,

      summary: {
        totalMemories: memories.length,
        topPatterns: this.getTopPatterns(memories),
        avgHealthScore: insights.reduce((acc, i) => acc + i.healthScore, 0) / (insights.length || 1),
        services: [serviceName],
      },

      memories: memories.map(m => ({
        type: m.type,
        content: m.content,
        confidence: m.confidence,
        isRecurring: m.isRecurring,
        metric: m.metric,
        tags: m.tags,
        reinforceCount: m.reinforceCount,
        firstSeen: m.firstSeenAt.toISOString(),
        lastSeen: m.lastSeenAt.toISOString(),
      })),

      recentInsights: insights.map(i => ({
        headline: i.headline,
        summary: i.summary,
        healthScore: i.healthScore,
        windowDate: i.windowStart,
      })),
    };

    // Save export record
    this.db.prepare(`
      INSERT INTO memory_exports (
        bundleId, serviceName, memoryCount,
        payload, description
      ) VALUES (
        @bundleId, @serviceName, @memoryCount,
        @payload, @description
      )
    `).run({
      bundleId: bundle.bundleId,
      serviceName,
      memoryCount: memories.length,
      payload: JSON.stringify(bundle),
      description,
    });

    return bundle;
  }

  importBundle(bundle: MemoryBundle): ImportResult {
    if (bundle.version !== '1.0') {
      throw new Error(`Unsupported bundle version: ${bundle.version}`);
    }

    const imported: ImportResult = {
      bundleId: bundle.bundleId,
      memoriesImported: 0,
      memoriesSkipped: 0,
      source: bundle.exportedBy,
    };

    const saveMemory = this.db.transaction(() => {
      for (const memory of bundle.memories) {
        const existing = this.db.prepare(`
          SELECT id FROM memories
          WHERE content = @content AND serviceName = @serviceName
        `).get({
          content: memory.content,
          serviceName: bundle.exportedBy,
        }) as { id: number } | undefined;

        if (existing) {
          this.memoryStore.reinforce(existing.id);
          imported.memoriesSkipped++;
        } else {
          this.memoryStore.save({
            type: memory.type,
            content: memory.content,
            confidence: memory.confidence as 'high' | 'medium' | 'low',
            isRecurring: memory.isRecurring,
            metric: memory.metric,
            tags: memory.tags,
            serviceName: bundle.exportedBy,
            windowId: -1,
          });
          imported.memoriesImported++;
        }
      }
    });

    saveMemory();
    return imported;
  }

  private getTopPatterns(memories: Memory[]): string[] {
    const typeCounts = memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);
  }
}
