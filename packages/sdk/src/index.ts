import { SpanExporter } from './collector/exporter.js';
import { AutopilotSpanProcessor, AutopilotSpan } from './collector/processor.js';
import { setInstrumentationState, instrumentVercelAI } from './instrumentation/vercel.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface JudgeModelConfig {
  provider: 'openrouter' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

export interface AutopilotConfig {
  serviceName: string;
  daemonUrl?: string;
  codebasePath?: string;
  judgeModel?: JudgeModelConfig;
  debug?: boolean;
}

// ── State ────────────────────────────────────────────────────────────────────

let processor: AutopilotSpanProcessor | null = null;
let initialized = false;

// ── initAutopilot ────────────────────────────────────────────────────────────

export function initAutopilot(config: AutopilotConfig): void {
  if (initialized) {
    if (config.debug) {
      console.warn('[llm-autopilot] Already initialized — skipping');
    }
    return;
  }

  const daemonUrl = config.daemonUrl ?? 'http://localhost:7777';
  const codebasePath = config.codebasePath ?? process.cwd();

  const exporter = new SpanExporter(daemonUrl, {
    serviceName: config.serviceName,
    codebasePath,
    judgeModel: config.judgeModel,
  });

  processor = new AutopilotSpanProcessor(exporter);

  setInstrumentationState({
    processor: {
      onEnd: (span: AutopilotSpan) => processor!.onEnd(span),
    },
    debug: config.debug ?? false,
  });

  initialized = true;

  if (config.debug) {
    console.log(`[llm-autopilot] Initialized — service: ${config.serviceName}, daemon: ${daemonUrl}`);
  }
}

// ── Manual Span API ──────────────────────────────────────────────────────────

export function createSpan(name: string, attributes?: Record<string, unknown>): AutopilotSpan | null {
  if (!processor) return null;

  const span = new AutopilotSpan({ name, attributes });
  return span;
}

export function endSpan(span: AutopilotSpan): void {
  if (!processor) return;
  processor.onEnd(span);
}

// ── Shutdown ─────────────────────────────────────────────────────────────────

export async function shutdown(): Promise<void> {
  if (processor) {
    await processor.shutdown();
  }
}

// ── Re-exports ───────────────────────────────────────────────────────────────

export { instrumentVercelAI } from './instrumentation/vercel.js';
export { AutopilotSpan } from './collector/processor.js';
export type { QueuedSpan } from './queue/SpanQueue.js';
