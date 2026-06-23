import Database from 'better-sqlite3';

export interface Memory {
  id: number;
  type: string;
  content: string;
  confidence: 'high' | 'medium' | 'low';
  isRecurring: boolean;
  metric?: string;
  tags: string[];
  serviceName: string;
  windowId: number;
  reinforceCount: number;   // how many times this memory was seen again
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export class MemoryStore {
  private db: Database.Database;
  private insert!: Database.Statement;
  private reinforceStmt!: Database.Statement;
  private getAll!: Database.Statement;

  constructor(db: Database.Database) {
    this.db = db;
    this.migrate();
    this.prepare();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        confidence TEXT NOT NULL,
        isRecurring INTEGER DEFAULT 0,
        metric TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        serviceName TEXT NOT NULL,
        windowId INTEGER,
        reinforceCount INTEGER DEFAULT 1,
        firstSeenAt INTEGER DEFAULT (strftime('%s', 'now')),
        lastSeenAt INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_memories_service ON memories(serviceName);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);

      CREATE TABLE IF NOT EXISTS memory_exports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bundleId TEXT UNIQUE NOT NULL,
        serviceName TEXT NOT NULL,
        exportedAt INTEGER DEFAULT (strftime('%s', 'now')),
        memoryCount INTEGER,
        windowCount INTEGER,
        payload TEXT NOT NULL,
        description TEXT
      );
    `);
  }

  private prepare() {
    this.insert = this.db.prepare(`
      INSERT INTO memories (
        type, content, confidence, isRecurring,
        metric, tags, serviceName, windowId
      ) VALUES (
        @type, @content, @confidence, @isRecurring,
        @metric, @tags, @serviceName, @windowId
      )
    `);

    this.reinforceStmt = this.db.prepare(`
      UPDATE memories SET
        reinforceCount = reinforceCount + 1,
        isRecurring = 1,
        lastSeenAt = strftime('%s', 'now')
      WHERE id = @id
    `);

    this.getAll = this.db.prepare(`
      SELECT * FROM memories
      WHERE serviceName = @serviceName
      ORDER BY reinforceCount DESC, lastSeenAt DESC
      LIMIT @limit
    `);
  }

  save(memory: Omit<Memory, 'id' | 'reinforceCount' | 'firstSeenAt' | 'lastSeenAt'>) {
    this.insert.run({
      ...memory,
      tags: JSON.stringify(memory.tags),
      isRecurring: memory.isRecurring ? 1 : 0,
      metric: memory.metric ?? null,
    });
  }

  reinforce(id: number) {
    this.reinforceStmt.run({ id });
  }

  getAllForService(serviceName: string, limit = 100): Memory[] {
    return (this.getAll.all({ serviceName, limit }) as any[]).map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      isRecurring: row.isRecurring === 1,
      firstSeenAt: new Date(row.firstSeenAt * 1000),
      lastSeenAt: new Date(row.lastSeenAt * 1000),
    }));
  }

  getMemoryContext(serviceName: string): string {
    const memories = this.getAllForService(serviceName, 50);

    if (memories.length === 0) return '';

    const grouped = memories.reduce((acc, m) => {
      if (!acc[m.type]) acc[m.type] = [];
      acc[m.type].push(m);
      return acc;
    }, {} as Record<string, Memory[]>);

    return `
## Long-term Memory for ${serviceName}
${Object.entries(grouped).map(([type, mems]) => `
### ${type.replace(/_/g, ' ').toUpperCase()}
${mems.map(m =>
  `- ${m.content}` +
  (m.metric ? ` (${m.metric})` : '') +
  (m.isRecurring ? ' [recurring]' : '') +
  (m.reinforceCount > 1 ? ` [seen ${m.reinforceCount}x]` : '')
).join('\n')}
`).join('\n')}
    `.trim();
  }
}
