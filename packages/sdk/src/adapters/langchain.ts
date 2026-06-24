import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from './state.js';

export class LangChainTracer {
  name = 'llm_lens_callback_handler';
  
  // Track active spans by LangChain runId
  private activeSpans = new Map<string, AutopilotSpan>();

  constructor() {}

  async handleLLMStart(
    llm: { id: string[]; [key: string]: any },
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    // e.g. ["langchain", "chat_models", "openai", "ChatOpenAI"]
    const modelClass = llm.id ? llm.id[llm.id.length - 1] : 'UnknownModel';
    // Often stored in invocationParams
    const modelName = (extraParams?.invocation_params as any)?.model || metadata?.model_name || modelClass;

    const span = new AutopilotSpan({
      name: `langchain.llm ${modelName}`,
      attributes: {
        'ai.model.id': String(modelName),
        'ai.operation': 'generateText',
        'langchain.runId': runId,
        ...(parentRunId ? { 'langchain.parentRunId': parentRunId } : {}),
      },
    });

    if (prompts && prompts.length > 0) {
      span.setAttribute('ai.prompt', prompts[0]);
    }

    this.activeSpans.set(runId, span);
  }

  async handleLLMEnd(
    output: { generations: any[][]; llmOutput?: Record<string, any> },
    runId: string
  ): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    const span = this.activeSpans.get(runId);
    if (!span) return;

    // Extract text
    if (output.generations && output.generations.length > 0 && output.generations[0].length > 0) {
      const text = output.generations[0][0].text || output.generations[0][0].message?.content;
      if (text) {
        span.setAttribute('ai.response.text', text.slice(0, 500));
      }
    }

    // Extract usage
    if (output.llmOutput && output.llmOutput.tokenUsage) {
      const usage = output.llmOutput.tokenUsage;
      span.setAttribute('ai.usage.promptTokens', usage.promptTokens ?? 0);
      span.setAttribute('ai.usage.completionTokens', usage.completionTokens ?? 0);
      span.setAttribute('ai.usage.totalTokens', usage.totalTokens ?? 0);
    }

    span.setStatus(0);
    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }

  async handleLLMError(err: Error, runId: string): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    const span = this.activeSpans.get(runId);
    if (!span) return;

    span.setStatus(2, err.message);
    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }

  // --- Tool Tracking ---

  async handleToolStart(
    tool: { id: string[]; [key: string]: any },
    input: string,
    runId: string,
    parentRunId?: string
  ): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    const toolName = tool.id ? tool.id[tool.id.length - 1] : 'UnknownTool';

    const span = new AutopilotSpan({
      name: `langchain.tool ${toolName}`,
      attributes: {
        'ai.operation': 'tool',
        'ai.toolNames': toolName,
        'ai.prompt': input, // Tool input
        'langchain.runId': runId,
        ...(parentRunId ? { 'langchain.parentRunId': parentRunId } : {}),
      },
    });

    this.activeSpans.set(runId, span);
  }

  async handleToolEnd(output: string, runId: string): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    const span = this.activeSpans.get(runId);
    if (!span) return;

    span.setAttribute('ai.response.text', output.slice(0, 500));
    span.setStatus(0);
    
    // In llm-lens, we fire tool.called events for the dashboard
    span.addEvent('tool.called', {
      toolName: span.attributes['ai.toolNames'] as string || 'tool',
      args: span.attributes['ai.prompt'] as string || '',
    });

    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }

  async handleToolError(err: Error, runId: string): Promise<void> {
    const state = getInstrumentationState();
    if (!state) return;

    const span = this.activeSpans.get(runId);
    if (!span) return;

    span.setStatus(2, err.message);
    state.processor.onEnd(span);
    this.activeSpans.delete(runId);
  }
}
