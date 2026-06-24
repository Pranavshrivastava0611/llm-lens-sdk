<div align="center">
  <h1>🔭 LLM Lens SDK</h1>
  <p><strong>Sub-millisecond, local-first OpenTelemetry observability with autonomous agentic debugging.</strong></p>
</div>

---

**LLM Lens** is a blazing-fast, developer-first alternative to cloud AI observability platforms. It intercepts traces at runtime and pipes them directly to a local, WAL-optimized SQLite daemon with `< 1ms` latency. 

This package (`llm-lens-sdk`) is the lightweight OpenTelemetry wrapper that instruments your LLM frameworks.

## Installation

```bash
npm install llm-lens-sdk
```

*(Note: You must also run the [llm-lens-daemon](https://www.npmjs.com/package/llm-lens-daemon) to receive the traces and view the dashboard).*

## Usage

LLM Lens integrates seamlessly with popular AI frameworks. First, initialize the telemetry exporter:

### Vercel AI SDK (Native OpenTelemetry)
Vercel AI SDK works out-of-the-box using its built-in `experimental_telemetry` option. `initAutopilot` automatically registers a fast, lightweight OpenTelemetry provider.

```typescript
import { initAutopilot } from 'llm-lens-sdk';
import { generateText } from 'ai';

// 1. Initialize telemetry (registers global OTEL provider automatically)
initAutopilot({ serviceName: 'my-vercel-ai-agent' });

// 2. Just use Vercel AI SDK natively with telemetry enabled!
await generateText({
  model,
  prompt: 'Hello world',
  experimental_telemetry: { isEnabled: true } // Vercel handles the rest!
});
```

### OpenAI (and Groq)
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

For more documentation, visit the [main repository](https://github.com/Pranavshrivastava0611/llm-lens-sdk).
