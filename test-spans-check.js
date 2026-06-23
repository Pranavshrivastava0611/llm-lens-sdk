import { getMetricsInRange } from './packages/daemon/dist/store/metrics.js';
import { getDb } from './packages/daemon/dist/store/traces.js';

const db = getDb();
const rows = db.prepare('SELECT timestamp FROM trace_metrics ORDER BY timestamp DESC LIMIT 5').all();
console.log("Recent DB timestamps:", rows.map(r => r.timestamp));
console.log("Current time:", Date.now());
