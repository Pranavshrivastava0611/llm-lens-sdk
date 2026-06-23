"use client";

import { useState, useEffect } from "react";
import type { AgentConfigPublic } from "@/hooks/useWebSocket";

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

  const getModelPlaceholder = () => {
    switch (provider) {
      case "openrouter": return "anthropic/claude-sonnet-4-6";
      case "openai": return "gpt-4o";
      case "anthropic": return "claude-3-5-sonnet-20241022";
      case "groq": return "llama-3.3-70b-versatile";
      default: return "Model ID";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-[480px] rounded-xl p-6 shadow-2xl flex flex-col gap-4"
        style={{ background: "#111", border: "1px solid #222" }}
      >
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Judge Model Configuration</h2>
          <p className="text-xs leading-relaxed" style={{ color: "#888" }}>
            This model analyzes your LLM traces and generates insights.
            Your API key is stored locally and never leaves your machine.
          </p>
        </div>

          {currentConfig && (
          <div className="rounded-md p-3 text-xs" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "#666" }}>Currently using:</span>
              <span className="font-mono text-white">{currentConfig.provider} / {currentConfig.model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#666" }}>Key status ({provider}):</span>
              <span style={{ color: (currentConfig.keys?.[provider] && currentConfig.keys[provider].length > 0) ? "#4ade80" : "#ef4444" }}>
                {(currentConfig.keys?.[provider] && currentConfig.keys[provider].length > 0) ? "Configured ✓" : "Not configured ✗"}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Provider */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-[#0a0a0a] text-sm text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ border: "1px solid #333" }}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              Model ID
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={getModelPlaceholder()}
              className="w-full bg-[#0a0a0a] text-sm text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ border: "1px solid #333" }}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              API Key (leave blank to keep current)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#0a0a0a] text-sm text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              style={{ border: "1px solid #333" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md transition-colors"
            style={{ color: "#888", border: "1px solid transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-md font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#3b82f6" }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
