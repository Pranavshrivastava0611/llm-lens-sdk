import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from './state.js';

/**
 * Wrapper for the new Google GenAI SDK (`@google/genai`).
 * Intercepts `client.models.generateContent`.
 */
export function wrapGemini<T extends any>(client: T): T {
  if (!client || typeof client !== 'object') return client;

  const models = (client as any).models;
  if (!models || typeof models.generateContent !== 'function') {
    console.warn('[llm-autopilot] wrapGemini: Could not find models.generateContent on the provided client.');
    return client;
  }

  const originalGenerate = models.generateContent.bind(models);

  models.generateContent = async function wrappedGenerate(...args: any[]) {
    const state = getInstrumentationState();
    if (!state) return originalGenerate(...args);

    const options = args[0] || {};
    const modelId = options.model || 'unknown';

    const span = new AutopilotSpan({
      name: `gemini.models.generateContent ${modelId}`,
      attributes: {
        'ai.model.id': modelId,
        'ai.operation': 'models.generateContent',
      },
    });

    if (options.contents) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(options.contents));
      } catch { /* ignore */ }
    }

    try {
      const result = await originalGenerate(...args);

      if (result.usageMetadata) {
        span.setAttribute('ai.usage.promptTokens', result.usageMetadata.promptTokenCount ?? 0);
        span.setAttribute('ai.usage.completionTokens', result.usageMetadata.candidatesTokenCount ?? 0);
        span.setAttribute('ai.usage.totalTokens', result.usageMetadata.totalTokenCount ?? 0);
      }

      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.finishReason) {
          span.setAttribute('ai.finishReason', candidate.finishReason);
        }
        if (candidate.content && candidate.content.parts) {
          const textPart = candidate.content.parts.find((p: any) => p.text);
          if (textPart) {
            span.setAttribute('ai.response.text', textPart.text.slice(0, 500));
          }
        }
      } else if (result.text) {
        span.setAttribute('ai.response.text', result.text.slice(0, 500));
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
