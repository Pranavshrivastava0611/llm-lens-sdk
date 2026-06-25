const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const dbPath = path.join(os.homedir(), '.llm-autopilot', 'autopilot.db');
const db = new Database(dbPath);

const winRow = db.prepare('SELECT data, patternAlerts FROM aggregated_windows WHERE id = ?').get(92);
const insRow = db.prepare('SELECT healthScore, headline, summary, findings, tokenAnalysis, latencyAnalysis, toolAnalysis, watchFor FROM insight_reports WHERE windowId = ?').get(92);

console.log('winRow exists:', !!winRow);
console.log('insRow exists:', !!insRow);

