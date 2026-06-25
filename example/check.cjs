const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), '.llm-autopilot', 'autopilot.db');
const db = new Database(dbPath);

const row = db.prepare('SELECT spans FROM traces ORDER BY id DESC LIMIT 1').get();
if (row) {
    const spans = JSON.parse(row.spans);
    console.log(JSON.stringify(spans, null, 2));
} else {
    console.log('No traces found');
}
db.close();
