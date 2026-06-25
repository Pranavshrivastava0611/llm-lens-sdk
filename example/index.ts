import {initAutopilot} from "llm-lens-sdk"
import {groq} from "@ai-sdk/groq"
import {generateText, tool, stepCountIs} from "ai"
import {z} from "zod"
import dotenv from "dotenv";
dotenv.config();
import * as readline from "readline/promises"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

initAutopilot({serviceName: "groq-example"});

export async function main() {
    const promptt = await rl.question("Enter your prompt (try asking for stock prices): ");
    const result = await generatecontent(promptt);
    console.log(result?.text);
    rl.close();
}

async function generatecontent(promptt: string) {
    try {
        const result = await generateText({
            prompt: promptt,
            model: groq('openai/gpt-oss-120b'), // ✅ tool-use model
            maxRetries: 3,                                          // ✅ retry on transient failures
            system: "You are a helpful financial assistant with access to real-time tools. You MUST use the tools to answer questions. Always provide the required arguments for tools.",
            experimental_telemetry: {isEnabled: true},
            stopWhen: stepCountIs(5),
            tools: {
                getStockPrice: tool({
                    description: 'Get the current stock price for a given ticker symbol. Example: ticker="NVDA" for Nvidia, "AAPL" for Apple.',
                    parameters: z.object({
                        ticker: z.string().min(1).describe('Stock ticker symbol, e.g. "AAPL", "NVDA", "TSLA"')
                    }),
                    execute: async ({ ticker }) => {            // ✅ no fallback — trust the schema
                        console.log(`[Tool Executing] Fetching stock price for ${ticker}...`);
                        await new Promise(resolve => setTimeout(resolve, 800));
                        const price = (Math.random() * 500 + 50).toFixed(2);
                        return {ticker, price: `$${price}`, time: new Date().toISOString()};
                    }
                }),
                getLatestNews: tool({
                    description: 'Search for the latest news articles about a company or topic. Example: topic="Nvidia".',
                    parameters: z.object({
                        topic: z.string().describe('Company name or topic to search for, e.g. "Nvidia", "Apple"')
                    }),
                    execute: async ({topic}) => {
                        console.log(`[Tool Executing] Searching news for ${topic}...`);
                        await new Promise(resolve => setTimeout(resolve, 1200));
                        return {
                            topic,
                            articles: [
                                "Company announces record breaking Q3 earnings.",
                                "New product launch delayed until next year."
                            ]
                        };
                    }
                })
            }
        });
        return result;
    } catch (error: any) {
        console.error(error.stack);
        return undefined;
    }
}

main();