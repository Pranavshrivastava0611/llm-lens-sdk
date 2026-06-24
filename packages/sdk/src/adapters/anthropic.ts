import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from './state.js';

/**
 * Wrapper for the official Anthropic SDK (`@anthropic-ai/sdk`).
 * Intercepts `client.messages.create`.
 */
export function wrapAnthropic<T extends any>(client: T): T {
  if (!client || typeof client !== 'object') return client;

  const messages = (client as any).messages;
  if (!messages || typeof messages.create !== 'function') {
    console.warn('[llm-autopilot] wrapAnthropic: Could not find messages.create on the provided client.');
    return client;
  }

  const originalCreate = messages.create.bind(messages);

  messages.create = async function wrappedCreate(...args: any[]) {
    const state = getInstrumentationState();
    if (!state) return originalCreate(...args);

    const options = args[0] || {};
    const modelId = options.model || 'unknown';

    const span = new AutopilotSpan({
      name: `anthropic.messages.create ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'messages.create',
      },
    });

    if (options.system) {
      span.setAttribute('ai.prompt.system', String(options.system));
    }
    if (options.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.messages));
      } catch { /* ignore */ }
    }

    try {
      const result = await originalCreate(...args);

      if (result.usage) {
        span.setAttribute('ai.usage.promptTokens', result.usage.input_tokens ?? 0);
        span.setAttribute('ai.usage.completionTokens', result.usage.output_tokens ?? 0);
        const total = (result.usage.input_tokens ?? 0) + (result.usage.output_tokens ?? 0);
        span.setAttribute('ai.usage.totalTokens', total);
      }

      if (result.stop_reason) {
        span.setAttribute('ai.finishReason', result.stop_reason);
      }

      if (result.content && result.content.length > 0) {
        const textBlocks = result.content.filter((c: any) => c.type === 'text');
        if (textBlocks.length > 0) {
          span.setAttribute('ai.response.text', textBlocks[0].text.slice(0, 500));
        }
      }
      span.setStatus(0);
      state.processor.onEnd(span);
      return result;
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus(2, message);
      state.processor.onEnd(span);
      throw err;
    }
  };
  return client;
}
