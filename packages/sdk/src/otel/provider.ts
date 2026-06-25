import type { TracerProvider, Tracer, Span, SpanOptions, Context, SpanContext } from '@opentelemetry/api';
import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from '../adapters/state.js';

export class AutopilotOTelSpan implements Span {
  constructor(private autopilotSpan: AutopilotSpan) {}
  
  spanContext(): SpanContext {
    return { traceId: this.autopilotSpan.traceId, spanId: this.autopilotSpan.id, traceFlags: 1 };
  }
  
  setAttribute(key: string, value: unknown): this {
    // Vercel AI SDK nests some OTEL attributes like gen_ai.system, gen_ai.prompt
    // We map them to our schema if necessary so the dashboard displays them beautifully.
    let mappedKey = key;
    if (key === 'gen_ai.system') mappedKey = 'ai.system';
    if (key === 'gen_ai.prompt') mappedKey = 'ai.prompt';
    if (key === 'gen_ai.completion') mappedKey = 'ai.response.text';
    if (key === 'gen_ai.usage.prompt_tokens') mappedKey = 'ai.usage.promptTokens';
    if (key === 'gen_ai.usage.completion_tokens') mappedKey = 'ai.usage.completionTokens';
    if (key === 'gen_ai.request.model') mappedKey = 'ai.model.id';
    
    this.autopilotSpan.setAttribute(mappedKey, value);
    return this;
  }
  
  setAttributes(attributes: any): this {
    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }
    return this;
  }
  
  addEvent(name: string, attributesOrStartTime?: any, startTime?: any): this {
    const attrs = typeof attributesOrStartTime === 'object' && !Array.isArray(attributesOrStartTime) 
                  && !(attributesOrStartTime instanceof Date) ? attributesOrStartTime : {};
                  
    // Vercel tool calls
    if (name === 'gen_ai.tool.message') {
      this.autopilotSpan.addEvent('tool.called', {
        toolName: attrs['gen_ai.tool.name'] ?? 'unknown',
        args: attrs['gen_ai.system'] ?? '{}' // payload is sometimes in system or content
      });
    } else {
      this.autopilotSpan.addEvent(name, attrs);
    }
    return this;
  }
  
  addLink() { return this; }
  addLinks() { return this; }
  
  setStatus(status: any): this {
    let code = 0;
    if (status.code === 2) code = 2; // ERROR
    else if (status.code === 1) code = 0; // OK
    this.autopilotSpan.setStatus(code, status.message);
    return this;
  }
  
  updateName(name: string): this {
    (this.autopilotSpan as any).name = name;
    
    // Attempt to parse operation type from name
    if (name.includes('generateText')) {
      this.autopilotSpan.setAttribute('ai.operation', 'generateText');
    } else if (name.includes('streamText')) {
      this.autopilotSpan.setAttribute('ai.operation', 'streamText');
    } else if (name.includes('generateObject')) {
      this.autopilotSpan.setAttribute('ai.operation', 'generateObject');
    }
    return this;
  }
  
  end(endTime?: number): void {
    const state = getInstrumentationState();
    if (state?.processor) {
      state.processor.onEnd(this.autopilotSpan);
    }
  }
  
  isRecording(): boolean { return true; }
  
  recordException(exception: any, time?: any): void {
    const message = exception instanceof Error ? exception.message : String(exception);
    this.autopilotSpan.setStatus(2, message);
  }
}

import { trace, context } from '@opentelemetry/api';

export class AutopilotTracer implements Tracer {
  startSpan(name: string, options?: SpanOptions, ctx?: Context): Span {
    const parentCtx = trace.getSpanContext(ctx ?? context.active());
    
    const span = new AutopilotSpan({ 
      name,
      traceId: parentCtx?.traceId,
      parentSpanId: parentCtx?.spanId,
      attributes: options?.attributes as any,
    });
    
    const otelSpan = new AutopilotOTelSpan(span);
    otelSpan.updateName(name);
    return otelSpan;
  }
  
  startActiveSpan(name: string, ...args: any[]): any {
    const options = args[0] || {};
    const fn = args[args.length - 1];
    const span = this.startSpan(name, options);
    
    return context.with(trace.setSpan(context.active(), span), () => {
        try {
            return fn(span);
        } finally {
            // Vercel AI SDK handles span.end()
        }
    });
  }
}

export class AutopilotTracerProvider implements TracerProvider {
  getTracer(name: string, version?: string): Tracer {
    return new AutopilotTracer();
  }
}
