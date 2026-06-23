#!/usr/bin/env node

import { Command } from 'commander';
import { startDaemon } from './index.js';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

const program = new Command();

program
  .name('llm-lens')
  .description('LLM Lens — local LLM observability dashboard')
  .version('0.1.0');

program
  .command('dashboard')
  .description('Start the daemon and dashboard')
  .option('--port <number>', 'Dashboard port', '8493')
  .option('--daemon-port <number>', 'Daemon port', '7777')
  .option('--no-open', 'Don\'t open browser')
  .option('--key <key>', 'API key')
  .option('--model <model>', 'Model to use', 'anthropic/claude-sonnet-4-6')
  .option('--provider <provider>', 'Provider (openrouter|openai|anthropic)', 'openrouter')
  .action(async (opts) => {
    const daemonPort = parseInt(opts.daemonPort, 10);
    const dashboardPort = parseInt(opts.port, 10);

    console.log('');
    console.log('  🔭 LLM Lens');
    console.log('');

    // Start daemon
    startDaemon({
      port: daemonPort,
      provider: opts.provider,
      apiKey: opts.key,
      model: opts.model,
    });

    console.log(`  ✓ Daemon listening on  http://localhost:${daemonPort}`);

    // Start dashboard using Express
    import('express').then((expressModule) => {
      const express = expressModule.default;
      const app = express();
      const dashboardDir = resolve(__dirname, '../ui');

      app.use(express.static(dashboardDir));

      // Fallback for single-page application routing
      app.use((req, res) => {
        res.sendFile(resolve(dashboardDir, 'index.html'));
      });

      app.listen(dashboardPort, () => {
        console.log(`  ✓ Dashboard ready on http://localhost:${dashboardPort}`);
        if (opts.open !== false) {
          // Attempt to open browser
          const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
          spawn(startCmd, [`http://localhost:${dashboardPort}`], { detached: true, stdio: 'ignore' }).unref();
        }
      });
    }).catch(err => {
      console.error('  ❌ Failed to start dashboard express server:', err);
    });
  });

program
  .command('init')
  .description('Initialize LLM Autopilot configuration')
  .action(() => {
    console.log('');
    console.log('  🔭 LLM Lens Setup');
    console.log('');
    console.log('  1. Install the SDK:');
    console.log('     npm install llm-lens-sdk');
    console.log('');
    console.log('  2. Add to your app entry (before anything else):');
    console.log("     import { initAutopilot, instrumentVercelAI } from 'llm-lens-sdk'");
    console.log("     initAutopilot({ serviceName: 'my-app' })");
    console.log('     instrumentVercelAI()');
    console.log('');
    console.log('  3. Start the dashboard:');
    console.log('     npx llm-lens dashboard');
    console.log('');
    console.log('  4. Optional — set your judge model API key:');
    console.log('     npx llm-lens dashboard --key sk-... --provider openrouter');
    console.log('');
  });

const memory = program.command('memory').description('Manage long-term memory context');

memory
  .command('export')
  .option('--service <name>', 'Service name')
  .option('--description <desc>', 'Bundle description', '')
  .action(async (opts) => {
    if (!opts.service) {
      console.error('Missing --service <name>');
      process.exit(1);
    }
    try {
      const res = await fetch(`http://localhost:7777/memory/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: opts.service,
          description: opts.description,
        }),
      });
      const { bundle, success, error } = await res.json() as any;
      if (!success) throw new Error(error);
      
      const fs = await import('node:fs');
      const filename = `llm-lens-memory-${bundle.bundleId.slice(0, 8)}.json`;
      fs.writeFileSync(filename, JSON.stringify(bundle, null, 2));
      console.log(`✓ Exported ${bundle.summary.totalMemories} memories → ${filename}`);
    } catch (err: any) {
      console.error('Export failed:', err.message);
    }
  });

memory
  .command('import <file>')
  .action(async (file) => {
    try {
      const fs = await import('node:fs');
      const bundle = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const res = await fetch(`http://localhost:7777/memory/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });
      const result = await res.json() as any;
      if (!result.success) throw new Error(result.error);
      console.log(`✓ Imported ${result.memoriesImported} memories (${result.memoriesSkipped} skipped)`);
    } catch (err: any) {
      console.error('Import failed:', err.message);
    }
  });

memory
  .command('context')
  .option('--service <name>', 'Service name')
  .action(async (opts) => {
    if (!opts.service) {
      console.error('Missing --service <name>');
      process.exit(1);
    }
    try {
      const res = await fetch(`http://localhost:7777/memory/context/${opts.service}`);
      const { context } = await res.json() as any;
      console.log(context || 'No memory context found.');
    } catch (err: any) {
      console.error('Fetch failed:', err.message);
    }
  });

function getNextWindowTime(): string {
  const now = new Date();
  const next = new Date(now.getTime() + 15 * 60 * 1000);
  return next.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

program.parse();
