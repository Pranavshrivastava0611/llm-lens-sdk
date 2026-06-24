import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from './state.js';

/**
 * LlamaIndex Callback Handler to trace LLM calls.
 * Implements the LlamaIndex BaseCallbackHandler interface.
 */
export class LlamaIndexTracer {
  private activeSpans = new Map<string, AutopilotSpan>();

  constructor() {
    // Duck-typing the LlamaIndex callback structure
  }

  // Hook for the global callback manager
  onLLMStart(event: any): void {
    const state = getInstrumentationState();
    if (!state) return;

    const runId = event.id || Math.random().toString();
    const model = event.llm?.model || 'unknown';

    const span = new AutopilotSpan({
      name: `llamaindex.llm ${model}`,
      attributes: {
        'ai.model.id': model,
        'ai.operation': 'generate',
        'llamaindex.runId': runId,
      },
    });

    if (event.messages) {
      try {
        span.setAttribute('ai.prompt', JSON.stringify(event.messages));
      } catch { /* ignore */ }
    }

    this.activeSpans.set(runId, span);
  }

  onLLMEnd(event: any): void {
    const state = getInstrumentationState();
    if (!state) return;

    const runId = event.id;
    const span = this.activeSpans.get(runId);
    if (!span) return;

    if (event.response) {
      const text = event.response.message?.content || event.response.text;
      if (text) {
        span.setAttribute('ai.response.text', text.slice(0, 500));
      }
      
      // LlamaIndex sometimes includes usage inside raw response
      if (event.response.raw?.usage) {
        const usage = event.response.raw.usage;
        span.setAttribute('ai.usage.promptTokens', usage.prompt_tokens ?? 0);
        span.setAttribute('ai.usage.completionTokens', usage.completion_tokens ?? 0);
        span.setAttribute('ai.usage.totalTokens', usage.total_tokens ?? 0);
      }
    }

    span.setStatus(0);
    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }

  onLLMError(event: any): void {
    const state = getInstrumentationState();
    if (!state) return;

    const runId = event.id;
    const span = this.activeSpans.get(runId);
    if (!span) return;

    const message = event.error?.message || String(event.error);
    span.setStatus(2, message);
    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }
}
