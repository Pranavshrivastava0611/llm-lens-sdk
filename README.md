<div align="center">
  <h1>🔭 LLM Lens</h1>
  <p><strong>Sub-millisecond, local-first OpenTelemetry observability with autonomous agentic debugging.</strong></p>
  
  <a href="https://www.npmjs.com/package/llm-lens-sdk"><img src="https://img.shields.io/npm/v/llm-lens-sdk?style=flat-square&color=blue" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/llm-lens-daemon"><img src="https://img.shields.io/npm/v/llm-lens-daemon?style=flat-square&color=purple" alt="NPM Version" /></a>
  <br/>
</div>

---

## The Problem
Building AI agents is hard. Debugging them is harder. When your LangGraph orchestration fails, an agent gets stuck in a tool-calling loop, or a prompt hallucination eats $5 in tokens, traditional observability fails you. 
Cloud-based AI observability platforms (like Langfuse or Datadog) batch traces over the internet. By the time your trace hits their ClickHouse database and renders on the UI, your local execution context is gone. You're left waiting seconds just to read a span, severely slowing down your development loop.

## The Solution: LLM Lens
**LLM Lens** is a blazing-fast, developer-first alternative. 
It intercepts OpenTelemetry traces at runtime and pipes them directly to a local, WAL-optimized SQLite daemon. 

But it doesn't just display logs. LLM Lens features an **Autonomous Agentic Analyzer** that wakes up periodically, deep-dives into your failing traces using an LLM, identifies the exact turn-ordering or prompt failures, and extracts long-term "memories" about your model's behavior.

### Why LLM Lens?
- ⚡ **Zero Network Latency**: Emitting a span takes `< 1ms` because the data never leaves your machine.
- 🕵️ **Autonomous Agentic Debugging**: An embedded LLM acts as your personal observability engineer. It queries its own SQLite database to automatically diagnose infinite loops, latency bottlenecks, and tool-call failures.
- 🧠 **Long-Term Memory**: Automatically extracts and persists rules about model behavior (e.g., "Llama-3 fails when limit > 50").
- 📱 **Responsive Dashboard**: Beautiful, mobile-responsive local UI built with Next.js.
- 💸 **100% Free & Local**: No payload caps, no rate limits, no SaaS pricing.

---

## 🚀 Quick Setup

You need two things to run LLM Lens: the **Daemon** (which runs the database and dashboard) and the **SDK** (which instruments your code).

### 1. Start the Daemon
You don't even need to clone the repo. Just run the daemon globally using `npx`:

```bash
npx -y llm-lens-daemon@latest dashboard
```
*This will spin up the SQLite database on `localhost:7777` and open the observability dashboard at `http://localhost:8493`.*

### 2. Instrument Your Code
In your local LLM project, install the SDK:

```bash
npm install llm-lens-sdk
```

LLM Lens provides explicit wrapper adapters for popular AI frameworks. First, initialize the telemetry exporter, then wrap your clients or functions:

#### Vercel AI SDK
```typescript
import { initAutopilot, wrapVercelAI } from 'llm-lens-sdk';
import { generateText as _generateText, streamText as _streamText } from 'ai';

// 1. Initialize telemetry
initAutopilot({ serviceName: 'my-vercel-ai-agent' });

// 2. Wrap your functions
const generateText = wrapVercelAI(_generateText);
const streamText = wrapVercelAI(_streamText);

// ... use generateText and streamText as normal ...
```

#### OpenAI (and Groq)
```typescript
import { initAutopilot, wrapOpenAI, wrapGroq } from 'llm-lens-sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

initAutopilot({ serviceName: 'my-openai-agent' });

// Wrap the client instance
const openai = wrapOpenAI(new OpenAI({ apiKey: '...' }));
const groq = wrapGroq(new Groq({ apiKey: '...' }));

// ... use openai.chat.completions.create as normal ...
```

#### LangChain & LlamaIndex
```typescript
import { initAutopilot, LangChainTracer, LlamaIndexTracer } from 'llm-lens-sdk';

initAutopilot({ serviceName: 'my-agent' });

// Pass the tracer as a callback handler in your framework
const tracer = new LangChainTracer();
```

#### Express.js (HTTP Tracing)
```typescript
import { initAutopilot, expressAutopilot } from 'llm-lens-sdk';
import express from 'express';

initAutopilot({ serviceName: 'my-backend' });

const app = express();
app.use(expressAutopilot()); // Add the middleware
```

That's it! Run your app. Your traces will instantly appear in the LLM Lens dashboard.

---

## 🧠 Autonomous Agentic Analysis

Once your traces start flowing in, the daemon will automatically summarize window metrics. 

If you encounter an error or want to deeply analyze a failing trace, click **"Deep Agentic Analysis"** in the dashboard. LLM Lens will spin up its own LangChain-style agent, query the SQLite database via tool-calls, fetch the massive payload of the failed trace, and write a comprehensive markdown post-mortem explaining exactly *why* your agent failed.

> **Note:** You will need to configure an API key (Groq, OpenAI, or Anthropic) in the dashboard settings (⚙️) for the autonomous analyzer to function.

---

## Architecture
LLM Lens is a monorepo containing:
1. `packages/sdk`: The lightweight OpenTelemetry wrapper that patches your LLM frameworks.
2. `packages/daemon`: The Node.js background process that handles UDP/WebSocket ingestion and SQLite aggregation.
3. `packages/dashboard`: The Next.js frontend that renders the local trace data.

---

## Contributing
We welcome contributions! If you want to add support for a new framework (LangChain, LlamaIndex) or improve the Deep Analyzer prompt, feel free to open a PR!

## License
MIT License. Build freely.
