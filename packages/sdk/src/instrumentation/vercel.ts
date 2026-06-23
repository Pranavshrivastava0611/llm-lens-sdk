import { AutopilotSpan } from '../collector/processor.js';

type AnyFunction = (...args: unknown[]) => unknown;

import { getInstrumentationState } from './state.js';

// ── Caller Location Extraction ───────────────────────────────────────────────

function getCallerLocation(): { filepath: string; lineno: number } | null {
  const err = new Error();
  const stack = err.stack;
  if (!stack) return null;

  const lines = stack.split('\n');
  // Frame 0: Error, Frame 1: getCallerLocation, Frame 2: wrapper, Frame 3: caller
  const frame = lines[4]; // adjusted for wrapper nesting
  if (!frame) return null;

  const match = frame.match(/\((.+):(\d+):\d+\)/) ??
                frame.match(/at\s+(.+):(\d+):\d+/);
  if (!match) return null;

  return {
    filepath: match[1],
    lineno: parseInt(match[2], 10),
  };
}

// ── Tool Info Extraction ─────────────────────────────────────────────────────

function extractToolInfo(options: Record<string, unknown>): {
  toolCount: number;
  toolNames: string[];
  maxSteps?: number;
} {
  const tools = options.tools as Record<string, unknown> | undefined;
  const toolNames = tools ? Object.keys(tools) : [];
  const maxSteps = options.maxSteps as number | undefined;

  return {
    toolCount: toolNames.length,
    toolNames,
    maxSteps,
  };
}

// ── Wrap generateText ────────────────────────────────────────────────────────

function wrapGenerateText(original: AnyFunction): AnyFunction {
  return async function wrappedGenerateText(...args: unknown[]) {
    const state = getInstrumentationState();
    if (!state) return original(...args);

    const options = (args[0] ?? {}) as Record<string, unknown>;
    const model = options.model as { modelId?: string } | undefined;
    const modelId = model?.modelId ?? 'unknown';
    const caller = getCallerLocation();
    const toolInfo = extractToolInfo(options);

    const span = new AutopilotSpan({
      name: `generateText ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'generateText',
        ...(caller ? { 'code.filepath': caller.filepath, 'code.lineno': caller.lineno } : {}),
        ...(toolInfo.maxSteps != null ? { 'ai.maxSteps': toolInfo.maxSteps } : {}),
        'ai.toolCount': toolInfo.toolCount,
        'ai.toolNames': toolInfo.toolNames.join(','),
      },
    });

    if (options.prompt) {
      span.setAttribute('ai.prompt', String(options.prompt));
    } else if (options.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.messages));
      } catch { /* ignore */ }
    }

    try {
      const result = await (original(...args) as Promise<Record<string, unknown>>);

      // Extract usage
      const usage = result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;
      if (usage) {
        span.setAttribute('ai.usage.promptTokens', usage.promptTokens ?? 0);
        span.setAttribute('ai.usage.completionTokens', usage.completionTokens ?? 0);
        span.setAttribute('ai.usage.totalTokens', usage.totalTokens ?? 0);
      }

      // Extract finish reason
      const finishReason = result.finishReason as string | undefined;
      if (finishReason) {
        span.setAttribute('ai.finishReason', finishReason);
      }

      // Extract text
      const text = result.text as string | undefined;
      if (text) {
        span.setAttribute('ai.response.text', text.slice(0, 500));
      }

      // Extract steps
      const steps = result.steps as Array<Record<string, unknown>> | undefined;
      if (steps) {
        span.setAttribute('ai.stepCount', steps.length);

        // Track tool calls
        let totalToolCalls = 0;
        const calledTools: string[] = [];

        for (const step of steps) {
          const toolCalls = step.toolCalls as Array<{ toolName: string; args: unknown }> | undefined;
          if (toolCalls) {
            totalToolCalls += toolCalls.length;
            for (const tc of toolCalls) {
              calledTools.push(tc.toolName);
              span.addEvent('tool.called', {
                toolName: tc.toolName,
                args: JSON.stringify(tc.args).slice(0, 200),
              });
            }
          }
        }

        span.setAttribute('ai.toolCallCount', totalToolCalls);
        span.setAttribute('ai.toolCallNames', calledTools.join(','));

        // Check maxSteps reached
        if (toolInfo.maxSteps != null && steps.length >= toolInfo.maxSteps) {
          span.addEvent('maxSteps.reached', {
            maxSteps: toolInfo.maxSteps,
            actualSteps: steps.length,
          });
        }
      }

      span.setStatus(0);
      state.processor.onEnd(span);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus(2, message);
      state!.processor.onEnd(span);
      throw err;
    }
  };
}

// ── Wrap streamText ──────────────────────────────────────────────────────────

function wrapStreamText(original: AnyFunction): AnyFunction {
  return function wrappedStreamText(...args: unknown[]) {
    const state = getInstrumentationState();
    if (!state) return original(...args);

    const options = (args[0] ?? {}) as Record<string, unknown>;
    const model = options.model as { modelId?: string } | undefined;
    const modelId = model?.modelId ?? 'unknown';
    const caller = getCallerLocation();
    const toolInfo = extractToolInfo(options);

    const span = new AutopilotSpan({
      name: `streamText ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'streamText',
        ...(caller ? { 'code.filepath': caller.filepath, 'code.lineno': caller.lineno } : {}),
        ...(toolInfo.maxSteps != null ? { 'ai.maxSteps': toolInfo.maxSteps } : {}),
        'ai.toolCount': toolInfo.toolCount,
        'ai.toolNames': toolInfo.toolNames.join(','),
      },
    });

    if (options.prompt) {
      span.setAttribute('ai.prompt', String(options.prompt));
    } else if (options.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.messages));
      } catch { /* ignore */ }
    }

    const result = original(...args) as Record<string, unknown>;

    // streamText returns a StreamResult — hook into its promise properties
    const originalResponse = result.response as Promise<Record<string, unknown>> | undefined;
    const originalUsage = result.usage as Promise<Record<string, unknown>> | undefined;

    if (originalUsage && typeof (originalUsage as Promise<unknown>).then === 'function') {
      void (originalUsage as Promise<Record<string, unknown>>).then((usage) => {
        if (usage) {
          span.setAttribute('ai.usage.promptTokens', (usage.promptTokens as number) ?? 0);
          span.setAttribute('ai.usage.completionTokens', (usage.completionTokens as number) ?? 0);
          span.setAttribute('ai.usage.totalTokens', (usage.totalTokens as number) ?? 0);
        }
      }).catch(() => { /* ignore */ });
    }

    if (originalResponse && typeof (originalResponse as Promise<unknown>).then === 'function') {
      void (originalResponse as Promise<Record<string, unknown>>).then(() => {
        span.setStatus(0);
        state!.processor.onEnd(span);
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        span.setStatus(2, message);
        state!.processor.onEnd(span);
      });
    } else {
      // Fallback — end span after a reasonable delay
      setTimeout(() => {
        span.setStatus(0);
        state!.processor.onEnd(span);
      }, 100);
    }

    return result;
  };
}

// ── Wrap generateObject ──────────────────────────────────────────────────────

function wrapGenerateObject(original: AnyFunction): AnyFunction {
  return async function wrappedGenerateObject(...args: unknown[]) {
    const state = getInstrumentationState();
    if (!state) return original(...args);

    const options = (args[0] ?? {}) as Record<string, unknown>;
    const model = options.model as { modelId?: string } | undefined;
    const modelId = model?.modelId ?? 'unknown';
    const caller = getCallerLocation();

    const span = new AutopilotSpan({
      name: `generateObject ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'generateObject',
        ...(caller ? { 'code.filepath': caller.filepath, 'code.lineno': caller.lineno } : {}),
      },
    });

    if (options.prompt) {
      span.setAttribute('ai.prompt', String(options.prompt));
    } else if (options.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.messages));
      } catch { /* ignore */ }
    }

    try {
      const result = await (original(...args) as Promise<Record<string, unknown>>);

      const usage = result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;
      if (usage) {
        span.setAttribute('ai.usage.promptTokens', usage.promptTokens ?? 0);
        span.setAttribute('ai.usage.completionTokens', usage.completionTokens ?? 0);
        span.setAttribute('ai.usage.totalTokens', usage.totalTokens ?? 0);
      }

      const finishReason = result.finishReason as string | undefined;
      if (finishReason) {
        span.setAttribute('ai.finishReason', finishReason);
      }

      // Capture object preview
      const object = result.object as unknown;
      if (object) {
        span.setAttribute('ai.response.text', JSON.stringify(object).slice(0, 500));
      }

      span.setStatus(0);
      state.processor.onEnd(span);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus(2, message);
      state!.processor.onEnd(span);
      throw err;
    }
  };
}

// ── instrumentVercelAI ───────────────────────────────────────────────────────

import { createRequire } from 'node:module';

let instrumented = false;

export function instrumentVercelAI(): void {
  if (instrumented) return;
  const state = getInstrumentationState();
  if (!state) {
    console.warn('[llm-autopilot] Call initAutopilot() before instrumentVercelAI()');
    return;
  }

  try {
    const require = createRequire(import.meta.url);
    const aiModule = require('ai') as Record<string, AnyFunction>;

    if (typeof aiModule.generateText === 'function') {
      const original = aiModule.generateText;
      Object.defineProperty(aiModule, 'generateText', {
        value: wrapGenerateText(original) as typeof aiModule.generateText,
        writable: true,
        configurable: true
      });
    }

    if (typeof aiModule.streamText === 'function') {
      const original = aiModule.streamText;
      Object.defineProperty(aiModule, 'streamText', {
        value: wrapStreamText(original) as typeof aiModule.streamText,
        writable: true,
        configurable: true
      });
    }

    if (typeof aiModule.generateObject === 'function') {
      const original = aiModule.generateObject;
      Object.defineProperty(aiModule, 'generateObject', {
        value: wrapGenerateObject(original) as typeof aiModule.generateObject,
        writable: true,
        configurable: true
      });
    }

    instrumented = true;

    if (state.debug) {
      console.log('[llm-autopilot] Vercel AI SDK instrumented successfully (CommonJS)');
    }
  } catch (err: any) {
    if (state?.debug) {
      console.log(`[llm-autopilot] Auto-instrumentation bypassed (Native ESM detected): ${err.message}`);
    }
  }
}

export function withAutopilot<T extends AnyFunction>(fn: T): T {
  if (fn.name === 'generateText' || fn.name === 'wrappedGenerateText') return wrapGenerateText(fn) as unknown as T;
  if (fn.name === 'streamText' || fn.name === 'wrappedStreamText') return wrapStreamText(fn) as unknown as T;
  if (fn.name === 'generateObject' || fn.name === 'wrappedGenerateObject') return wrapGenerateObject(fn) as unknown as T;
  return fn;
}
