import { CodePreset, TraceSession } from './types';

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'vercel-ai-ts',
    framework: 'vercel-ai',
    language: 'typescript',
    llm: 'openai',
    title: 'vercel_ai_agent',
    code: `import { initAutopilot, wrapVercelAI } from 'llm-lens-sdk';
import { generateText as rawGenerateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 1. Initialize Telemetry
initAutopilot({ serviceName: 'vercel-agent' });

// 2. Wrap the core generateText function
const generateText = wrapVercelAI(rawGenerateText);

// 3. Normal Framework Code
const { text, toolCalls } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Calculate the revenue growth.',
  tools: {
    // ... your tools here
  }
});`
  },
  {
    id: 'lc-ts-oai',
    framework: 'langchain',
    language: 'typescript',
    llm: 'openai',
    title: 'langchain_agent',
    code: `import { initAutopilot, LangChainTracer } from 'llm-lens-sdk';
import { ChatOpenAI } from '@langchain/openai';

// 1. Initialize Global Telemetry
initAutopilot({ serviceName: 'langchain-bot' });

// 2. Attach the callback handler
const tracer = new LangChainTracer();

// 3. Standard Framework Code
const model = new ChatOpenAI({
  modelName: "gpt-4o",
  callbacks: [tracer]
});

await model.invoke("Analyze the provided financial data.");`
  },
  {
    id: 'li-ts-oai',
    framework: 'llamaindex',
    language: 'typescript',
    llm: 'openai',
    title: 'llamaindex_rag',
    code: `import { initAutopilot, LlamaIndexTracer } from 'llm-lens-sdk';
import { Settings, OpenAI, VectorStoreIndex, Document } from 'llamaindex';

// 1. Initialize Telemetry
initAutopilot({ serviceName: 'rag-production' });

// 2. Attach tracer to LlamaIndex Settings
const tracer = new LlamaIndexTracer();
Settings.callbackManager.on('llm-start', tracer.onLLMStart.bind(tracer));
Settings.callbackManager.on('llm-end', tracer.onLLMEnd.bind(tracer));

// 3. Normal Framework Code
Settings.llm = new OpenAI({ model: 'gpt-4o' });
const index = await VectorStoreIndex.fromDocuments([new Document({ text: "docs" })]);
const response = await index.asQueryEngine().query({
  query: "Summarize Q3 earnings"
});`
  },
  {
    id: 'openai-ts',
    framework: 'openai',
    language: 'typescript',
    llm: 'openai',
    title: 'raw_openai_client',
    code: `import { initAutopilot, wrapOpenAI } from 'llm-lens-sdk';
import OpenAI from 'openai';

// 1. Initialize Telemetry
initAutopilot({ serviceName: 'raw-openai-script' });

// 2. Wrap the raw client instance
const openai = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}));

// 3. Normal API Calls
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Say hello!' }]
});`
  },
  {
    id: 'anthropic-ts',
    framework: 'anthropic',
    language: 'typescript',
    llm: 'anthropic',
    title: 'raw_anthropic_client',
    code: `import { initAutopilot, wrapAnthropic } from 'llm-lens-sdk';
import Anthropic from '@anthropic-ai/sdk';

// 1. Initialize Telemetry
initAutopilot({ serviceName: 'raw-claude-script' });

// 2. Wrap the raw client instance
const claude = wrapAnthropic(new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}));

// 3. Normal API Calls
const response = await claude.messages.create({
  model: 'claude-3-5-sonnet-20240620',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Say hello!' }]
});`
  }
];

export const MOCK_TRACE_SESSIONS: TraceSession[] = [
  {
    id: 'trace-8f92a1',
    agentName: 'Financial Analysis Agent',
    timestamp: '2 mins ago',
    status: 'completed',
    totalTokens: 2450,
    totalCostUsd: 0.012,
    totalDurationMs: 4500,
    steps: [
      {
        id: 'step-1',
        type: 'input',
        title: 'User Prompt Received',
        description: 'Prompt: "Summarize the Q3 earnings report for Acme Corp and highlight risk factors."',
        durationMs: 0,
        iconName: 'Send'
      },
      {
        id: 'step-2',
        type: 'thought',
        title: 'Plan Execution',
        description: 'I need to retrieve the Q3 earnings report for Acme Corp from the vector database, extract the summary, and identify risk factors.',
        durationMs: 850,
        tokensUsed: 150,
        costUsd: 0.001,
        iconName: 'Brain'
      },
      {
        id: 'step-3',
        type: 'tool_call',
        title: 'Vector Search',
        description: 'Searching Pinecone index "acme-financials" for "Q3 earnings report summary".',
        durationMs: 1200,
        iconName: 'Database'
      },
      {
        id: 'step-4',
        type: 'tool_response',
        title: 'Search Results',
        description: 'Found 5 relevant document chunks. Context length: 1800 tokens.',
        durationMs: 45,
        iconName: 'FileText'
      },
      {
        id: 'step-5',
        type: 'thought',
        title: 'Analyze Risk Factors',
        description: 'Analyzing retrieved chunks to extract supply chain risks and competitive threats.',
        durationMs: 1800,
        tokensUsed: 2100,
        costUsd: 0.010,
        iconName: 'Brain'
      },
      {
        id: 'step-6',
        type: 'output',
        title: 'Final Response Generated',
        description: 'Acme Corp Q3 earnings showed a 15% revenue increase, primarily driven by enterprise software sales. Key risk factors include supply chain disruptions in the APAC region and increased competition from emerging AI startups.',
        durationMs: 605,
        tokensUsed: 200,
        costUsd: 0.001,
        iconName: 'CheckCircle2'
      }
    ]
  },
  {
    id: 'trace-2b4e7c',
    agentName: 'Customer Support Bot',
    timestamp: '15 mins ago',
    status: 'failed',
    totalTokens: 450,
    totalCostUsd: 0.002,
    totalDurationMs: 1200,
    steps: [
      {
        id: 'step-1',
        type: 'input',
        title: 'User Message',
        description: 'Prompt: "My account is locked and I cannot reset my password."',
        durationMs: 0,
        iconName: 'Send'
      },
      {
        id: 'step-2',
        type: 'thought',
        title: 'Determine Action',
        description: 'User is locked out. Need to query the auth service to check account status.',
        durationMs: 400,
        tokensUsed: 100,
        costUsd: 0.0005,
        iconName: 'Brain'
      },
      {
        id: 'step-3',
        type: 'tool_call',
        title: 'Auth API Query',
        description: 'Calling user_management.get_status(email="user@example.com")',
        durationMs: 800,
        iconName: 'Database'
      },
      {
        id: 'step-4',
        type: 'error',
        title: 'API Timeout Error',
        description: 'The auth service timed out after 800ms. Connection refused.',
        durationMs: 0,
        iconName: 'AlertTriangle',
        metadata: {
          errorCode: 'TIMEOUT_504',
          service: 'auth-api'
        }
      }
    ]
  }
];
