import { AutopilotSpan } from '../collector/processor.js';

// The state hook to grab the processor (shared with vercel)
import { getInstrumentationState } from './state.js';

type AnyFunction = (...args: any[]) => any;

/**
 * Common wrapper for OpenAI-compatible clients (OpenAI, Groq).
 * Intercepts `client.chat.completions.create`.
 */
export function observeOpenAI<T extends any>(client: T): T {
  if (!client || typeof client !== 'object') return client;

  // Find chat.completions.create
  const chat = (client as any).chat;
  if (!chat || !chat.completions || typeof chat.completions.create !== 'function') {
    console.warn('[llm-autopilot] observeOpenAI: Could not find chat.completions.create on the provided client.');
    return client;
  }

  const originalCreate = chat.completions.create.bind(chat.completions);

  chat.completions.create = async function wrappedCreate(...args: any[]) {
    const state = getInstrumentationState();
    if (!state) return originalCreate(...args); // Fallback if autopilot isn't init'd

    const options = args[0] || {};
    const modelId = options.model || 'unknown';

    const span = new AutopilotSpan({
      name: `chat.completions.create ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'chat.completions.create',
      },
    });

    if (options.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.messages));
      } catch { /* ignore */ }
    }

    try {
      // Execute the actual SDK call
      const result = await originalCreate(...args);

      // Extract usage
      if (result.usage) {
        span.setAttribute('ai.usage.promptTokens', result.usage.prompt_tokens ?? 0);
        span.setAttribute('ai.usage.completionTokens', result.usage.completion_tokens ?? 0);
        span.setAttribute('ai.usage.totalTokens', result.usage.total_tokens ?? 0);
      }

      // Extract response text
      const choice = result.choices?.[0];
      if (choice) {
        if (choice.finish_reason) {
          span.setAttribute('ai.finishReason', choice.finish_reason);
        }
        if (choice.message?.content) {
          span.setAttribute('ai.response.text', choice.message.content.slice(0, 500));
        }
      }

      span.setStatus(0); // Success
      state.processor.onEnd(span);

      return result;
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus(2, message); // Error
      state.processor.onEnd(span);
      throw err;
    }
  };

  return client;
}

/**
 * Groq uses the exact same API surface as OpenAI.
 * Exporting as a separate alias for developer clarity.
 */
export const observeGroq = observeOpenAI;
