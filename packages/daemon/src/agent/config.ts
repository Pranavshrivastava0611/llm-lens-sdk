import { getAgentConfig, updateAgentConfig, type AgentConfig } from '../store/insights.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

let memoryConfig: AgentConfig | null = null;

export function getConfig(): AgentConfig {
  if (memoryConfig) return memoryConfig;

  const dbConfig = getAgentConfig();

  // Fallback to env vars
  if (!dbConfig.keys[dbConfig.provider]) {
    // Attempt to load from .env file if it exists
    try {
      const pathsToCheck = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'packages/daemon/.env'),
        path.resolve(process.cwd(), 'example/.env'),
      ];

      for (const envPath of pathsToCheck) {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          envContent.split('\n').forEach((line: string) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              const val = match[2].trim().replace(/^['"]|['"]$/g, '');
              if (!process.env[key]) process.env[key] = val;
            }
          });
          break; // Stop after finding the first valid .env file
        }
      }
    } catch { }

    const envKey = process.env.GROQ_API_KEY ?? process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '';
    if (envKey) {
      let provider = 'openrouter';
      if (process.env.GROQ_API_KEY) provider = 'groq';
      else if (process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) provider = 'openai';
      else if (process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) provider = 'anthropic';

      dbConfig.keys[provider] = envKey;
      dbConfig.provider = provider;
      // When groq is used via env vars, use a groq-compatible model
      if (provider === 'groq') {
        dbConfig.model = 'llama-3.3-70b-versatile';
      }
    }
  }

  memoryConfig = dbConfig;
  return dbConfig;
}

export function setConfig(config: Partial<AgentConfig> & { apiKey?: string }): void {
  const current = getConfig();
  const keys = { ...current.keys };

  if (config.apiKey && config.provider) {
    keys[config.provider] = config.apiKey;
  } else if (config.apiKey) {
    keys[current.provider] = config.apiKey;
  } else if (config.keys) {
    Object.assign(keys, config.keys);
  }

  const updated = {
    provider: config.provider ?? current.provider,
    keys,
    model: config.model ?? current.model,
  };

  updateAgentConfig(updated);
  memoryConfig = { ...updated, updatedAt: new Date().toISOString() };
}

export function hasValidConfig(): boolean {
  const config = getConfig();
  return Boolean(config.keys[config.provider] && config.keys[config.provider].length > 0 && config.model.length > 0);
}

export function getPublicConfig(): { provider: string; model: string; hasApiKey: boolean } {
  const config = getConfig();
  return {
    provider: config.provider,
    model: config.model,
    hasApiKey: Boolean(config.keys[config.provider] && config.keys[config.provider].length > 0),
  };
}
