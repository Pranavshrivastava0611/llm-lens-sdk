import Groq from "groq-sdk"
import {wrapGroq, initAutopilot} from "llm-lens-sdk"
import dotenv from "dotenv"

dotenv.config()

initAutopilot({
    serviceName: "groq-test"
})


const wrap = wrapGroq(new Groq({
    apiKey: process.env.GROQ_API_KEY
}))


import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export async function main() {
  console.log("🤖 Running Groq raw chat completion...");
  const chatCompletion = await getGroqChatCompletion();
  console.log(chatCompletion.choices[0]?.message?.content || "");
  
  console.log("\n🤖 Running Vercel AI SDK native telemetry...");
  const vercelResult = await getVercelAIChatCompletion();
  console.log(vercelResult.text);
}

export async function getGroqChatCompletion() {
  return wrap.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
}

export async function getVercelAIChatCompletion() {
  const aiGroq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  return generateText({
    model: aiGroq('llama-3.3-70b-versatile'),
    prompt: "Why are slow language models bad?",
    experimental_telemetry: { isEnabled: true, functionId: 'test-telemetry' }
  });
}

try {
    main().then(() => {
        setTimeout(() => process.exit(0), 3000);
    });
} catch(e) {
    console.log(e)
}