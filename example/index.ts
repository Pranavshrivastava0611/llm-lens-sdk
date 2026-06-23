import * as dotenv from 'dotenv';
dotenv.config();

import { initAutopilot, instrumentVercelAI, createSpan, endSpan } from 'llm-lens-sdk';
import { generateText, stepCountIs, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Initialize Autopilot
initAutopilot({
  serviceName: 'example-trading-app',
  debug: true,
});

async function run() {
  console.log('🤖 Running example LLM calls using Groq...\n');

  //
  // ===== TEST 1: TOOL VALIDATION FAILURE =====
  //
  try {
    console.log('===== TEST 1: Tool validation failure =====');

    const span = createSpan(
      'generateText llama-3.3-70b-versatile (tools)',
      {
        'ai.model.id': 'llama-3.3-70b-versatile',
        'ai.operation': 'generateText',
      }
    );

    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),

      prompt: `
Use the calculate_sum tool.
Pass x=145 and y=289.
`,

      tools: {
        calculate_sum: tool({
          description: 'Add two numbers',

          // Intentionally wrong schema!
          inputSchema: z.object({
            a: z.number(),
            b: z.number(),
          }),

          execute: async ({ a, b }) => {
            const sum = a + b;
            span.addEvent('tool.called', {
              toolName: 'calculate_sum',
              args: JSON.stringify({ a, b }),
              result: sum,
            });
            span.setAttribute('ai.toolNames', 'calculate_sum');
            return { sum };
          },
        }),
      },

      stopWhen: stepCountIs(5),
    });

    console.log(result.text);

    span.setStatus(0);
    endSpan(span);
  } catch (err: any) {
    console.error('\n❌ Expected tool validation error:');
    console.error(err.message);
  }

  //
  // ===== TEST 2: INVALID MODEL =====
  //
  try {
    console.log('\n===== TEST 2: Invalid model =====');
    
    const span2 = createSpan('generateText invalid-model', {
      'ai.model.id': 'invalid-model-name',
      'ai.operation': 'generateText',
      'ai.prompt': 'Say hello',
    });

    try {
      const result2 = await generateText({
        model: groq('invalid-model-name'),
        prompt: 'Say hello',
      });
      console.log(result2.text);
      span2.setStatus(0);
    } catch (err: any) {
      span2.setStatus(2, err.message);
      throw err;
    } finally {
      endSpan(span2);
    }
  } catch (err: any) {
    console.error('\n❌ Expected model error:');
    console.error(err.message);
  }

  //
  // ===== TEST 3: TOOL RUNTIME ERROR =====
  //
  try {
    console.log('\n===== TEST 3: Tool runtime error =====');

    const result3 = await generateText({
      model: groq('llama-3.3-70b-versatile'),

      prompt: `
Use calculate_sum with x=10 and y=20.
`,

      tools: {
        calculate_sum: tool({
          inputSchema: z.object({
            x: z.number(),
            y: z.number(),
          }),

          execute: async ({ x, y }) => {
            throw new Error(
              `Intentional tool failure for ${x} and ${y}`
            );
          },
        }),
      },

      stopWhen: stepCountIs(5),
    });

    console.log(result3.text);
  } catch (err: any) {
    console.error('\n❌ Expected tool execution error:');
    console.error(err.message);
  }

  console.log('\n✅ Finished.');

  setTimeout(() => process.exit(0), 3000);
}

run();