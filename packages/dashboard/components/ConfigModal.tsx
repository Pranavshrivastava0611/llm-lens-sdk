"use client";

import { useState, useEffect } from "react";
import type { AgentConfigPublic } from "@/hooks/useWebSocket";
import { Settings, Cpu, Key, CheckCircle2, XCircle } from "lucide-react";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AgentConfigPublic | null;
  onSave: (config: { provider: string; model: string; apiKey: string }) => void;
}

export default function ConfigModal({ isOpen, onClose, currentConfig, onSave }: ConfigModalProps) {
  const [provider, setProvider] = useState("openrouter");
  const [model, setModel] = useState("anthropic/claude-sonnet-4-6");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (isOpen && currentConfig) {
      setProvider(currentConfig.provider);
      setModel(currentConfig.model);
      setApiKey(""); // Don't pre-fill API key
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ provider, model, apiKey });
    onClose();
  };

  const isConfigured = currentConfig?.keys?.[provider] && currentConfig.keys[provider].length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-[480px] rounded-xl p-6 shadow-2xl flex flex-col gap-5 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-content)]"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--color-muted)]" />
            <h2 className="text-lg font-semibold tracking-tight">Judge Model Configuration</h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Configure the LLM that analyzes your traces and generates insights.
            Your API key is stored locally and never leaves your machine.
          </p>
        </div>

        {currentConfig && (
          <div className="rounded-lg p-4 bg-[var(--color-surface)] border border-[var(--color-border-light)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted)]">Currently using</span>
              <span className="font-mono font-medium text-[var(--color-content)] bg-[var(--color-panel)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                {currentConfig.provider} / {currentConfig.model}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-zinc-400">Key status ({provider})</span>
              <span className={`flex items-center gap-1.5 font-medium ${isConfigured ? "text-emerald-400" : "text-rose-400"}`}>
                {isConfigured ? (
                  <><CheckCircle2 className="w-4 h-4" /> Configured</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Not configured</>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-1">
          {/* Provider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-zinc-900 text-sm text-zinc-100 px-3 py-2 rounded-md outline-none border border-zinc-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Model ID
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={model}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setModel("");
                  } else {
                    setModel(e.target.value);
                  }
                }}
                className="w-full bg-zinc-900 text-sm text-zinc-100 px-3 py-2 rounded-md outline-none border border-zinc-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              >
                {/* ─── OpenAI ─── */}
                {provider === "openai" && (
                  <optgroup label="OpenAI Models">
                    <option value="gpt-5.5">gpt-5.5</option>
                    <option value="gpt-5.5-pro">gpt-5.5-pro</option>
                    <option value="gpt-5.4">gpt-5.4</option>
                    <option value="gpt-5.4-mini">gpt-5.4-mini</option>
                    <option value="gpt-5.4-nano">gpt-5.4-nano</option>
                    <option value="gpt-5.4-pro">gpt-5.4-pro</option>
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                    <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4.1">gpt-4.1</option>
                    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  </optgroup>
                )}

                {/* ─── Anthropic ─── */}
                {provider === "anthropic" && (
                  <optgroup label="Anthropic Models">
                    <option value="claude-opus-4-8">claude-opus-4-8</option>
                    <option value="claude-opus-4-7">claude-opus-4-7</option>
                    <option value="claude-opus-4-6">claude-opus-4-6</option>
                    <option value="claude-opus-4-5">claude-opus-4-5</option>
                    <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                    <option value="claude-sonnet-4-5">claude-sonnet-4-5</option>
                    <option value="claude-haiku-4-5-20251001">claude-haiku-4-5</option>
                    <option value="claude-fable-5">claude-fable-5</option>
                  </optgroup>
                )}

                {/* ─── Groq ─── */}
                {provider === "groq" && (
                  <optgroup label="Groq Models">
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                    <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                    <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                    <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                    <option value="meta-llama/llama-4-scout-17b-16e-instruct">meta-llama/llama-4-scout-17b</option>
                    <option value="compound-beta">compound-beta</option>
                    <option value="compound-beta-mini">compound-beta-mini</option>
                    <option value="openai/gpt-oss-safeguard-20b">openai/gpt-oss-safeguard-20b</option>
                  </optgroup>
                )}

                {/* ─── OpenRouter ─── */}
                {provider === "openrouter" && (
                  <>
                    <optgroup label="Anthropic">
                      <option value="anthropic/claude-fable-5">Claude Fable 5</option>
                      <option value="anthropic/claude-opus-4-8">Claude Opus 4.8</option>
                      <option value="anthropic/claude-opus-4-7">Claude Opus 4.7</option>
                      <option value="anthropic/claude-sonnet-4-6">Claude Sonnet 4.6</option>
                      <option value="anthropic/claude-haiku-4-5">Claude Haiku 4.5</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="openai/gpt-5.5">GPT 5.5</option>
                      <option value="openai/gpt-5.5-pro">GPT 5.5 Pro</option>
                      <option value="openai/gpt-5.4">GPT 5.4</option>
                      <option value="openai/gpt-5.4-mini">GPT 5.4 Mini</option>
                      <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                      <option value="openai/gpt-oss-20b">GPT OSS 20B</option>
                    </optgroup>
                    <optgroup label="Google">
                      <option value="google/gemini-3.5-flash">Gemini 3.5 Flash</option>
                      <option value="google/gemini-3.1-pro">Gemini 3.1 Pro</option>
                      <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="google/gemma-3-27b-it">Gemma 3 27B</option>
                    </optgroup>
                    <optgroup label="Meta Llama">
                      <option value="meta-llama/llama-4-maverick">Llama 4 Maverick</option>
                      <option value="meta-llama/llama-4-scout">Llama 4 Scout</option>
                      <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                    </optgroup>
                    <optgroup label="DeepSeek">
                      <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro</option>
                      <option value="deepseek/deepseek-v3.2">DeepSeek V3.2</option>
                      <option value="deepseek/deepseek-r1">DeepSeek R1</option>
                      <option value="deepseek/deepseek-r1-distill-llama-70b">DeepSeek R1 Distill Llama 70B</option>
                    </optgroup>
                    <optgroup label="Qwen">
                      <option value="qwen/qwen3.6-27b">Qwen 3.6 27B</option>
                      <option value="qwen/qwen3-235b-a22b">Qwen 3 235B</option>
                      <option value="qwen/qwen3-32b">Qwen 3 32B</option>
                      <option value="qwen/qwq-32b">QwQ 32B</option>
                    </optgroup>
                    <optgroup label="Mistral">
                      <option value="mistralai/mistral-large-2411">Mistral Large 2411</option>
                      <option value="mistralai/mistral-small-3.2">Mistral Small 3.2</option>
                      <option value="mistralai/pixtral-large-2411">Pixtral Large 2411</option>
                    </optgroup>
                    <optgroup label="Other Excellent Models">
                      <option value="x-ai/grok-4">Grok 4</option>
                      <option value="microsoft/phi-4">Phi-4</option>
                      <option value="nvidia/nemotron-4-340b-instruct">Nemotron 4 340B</option>
                      <option value="cohere/command-r-plus-08-2024">Command R+</option>
                      <option value="amazon/nova-pro-v1">Nova Pro V1</option>
                      <option value="nousresearch/hermes-3-llama-3.1-405b">Hermes 3 405B</option>
                    </optgroup>
                  </>
                )}
                
                <optgroup label="Custom Options">
                  <option value={model && !model.includes(' ') && model !== "custom" ? model : "custom"}>
                    {model && !model.includes(' ') && model !== "custom" ? model : "Custom Model..."}
                  </option>
                  {(!model || model.includes(' ') || model === "custom") && (
                    <option value="custom">Custom Model...</option>
                  )}
                </optgroup>
              </select>

              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Or type a custom model ID..."
                className="w-full bg-zinc-900 text-sm text-zinc-100 px-3 py-2 rounded-md outline-none border border-zinc-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> API Key
              <span className="text-zinc-600 lowercase tracking-normal ml-1 font-normal">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-zinc-900 text-sm text-zinc-100 px-3 py-2 rounded-md outline-none border border-zinc-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
