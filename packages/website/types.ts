export interface CodePreset {
  id: string;
  framework: 'vercel-ai' | 'langchain' | 'llamaindex' | 'openai' | 'anthropic';
  language: 'python' | 'typescript';
  llm: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
  title: string;
  code: string;
}

export type TraceStepType = 'thought' | 'tool_call' | 'tool_response' | 'input' | 'output' | 'error';

export interface TraceStep {
  id: string;
  type: TraceStepType;
  title: string;
  description: string;
  durationMs: number;
  tokensUsed?: number;
  costUsd?: number;
  iconName?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TraceSession {
  id: string;
  agentName: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'running';
  totalTokens: number;
  totalCostUsd: number;
  totalDurationMs: number;
  steps: TraceStep[];
}
