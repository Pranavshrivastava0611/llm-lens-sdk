"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  Code, 
  Settings, 
  CheckCircle2, 
  Network, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CODE_PRESETS } from '../mockData';

interface DocsProps {
  setCurrentView: (view: any) => void;
}

export default function Docs({ setCurrentView }: DocsProps) {
  const [selectedFramework, setSelectedFramework] = useState<'vercel-ai' | 'langchain' | 'llamaindex' | 'openai' | 'anthropic'>('vercel-ai');
  const [selectedLang, setSelectedLang] = useState<'python' | 'typescript'>('typescript');
  const [selectedLLM, setSelectedLLM] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama'>('openai');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

  // Find matching preset, fall back to anything matching framework
  const findPreset = () => {
    let match = CODE_PRESETS.find(
      (p) => p.framework === selectedFramework && p.language === selectedLang && p.llm === selectedLLM
    );
    if (!match) {
      match = CODE_PRESETS.find(
        (p) => p.framework === selectedFramework && p.language === selectedLang
      );
    }
    if (!match) {
      match = CODE_PRESETS.find((p) => p.framework === selectedFramework);
    }
    return match || CODE_PRESETS[0];
  };

  const activePreset = findPreset();

  const handleCopy = (text: string, setCopiedFlag: (f: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 2000);
  };

  const installCmd = selectedLang === 'python' ? 'pip install llm-lens' : 'npm install llm-lens-sdk';

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 pt-12 pb-24 border-t border-neutral-200">
      <div className="px-6 md:px-12 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* SIDE NAV DOCS NAVIGATION (Colspan 3) */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded p-6 shadow-sm h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <BookOpen className="w-5 h-5 text-brand-orange" />
            <h3 className="font-sans font-bold text-base text-neutral-900">Developer Docs</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest font-semibold block">INTEGRATION GUIDE</span>
              <button className="w-full text-left py-1.5 px-2 bg-neutral-100 font-sans text-xs font-bold text-black border-l-2 border-black rounded-sm">
                Universal SDK Setup
              </button>
              <button onClick={() => alert("SDK Reference: Additional advanced API hooks are fully available inside our interactive tracing logs dashboard.")} className="w-full text-left py-1.5 px-2 font-sans text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Environment Variables
              </button>
              <button onClick={() => alert("Local Edge Redaction docs: Telemetry filters mask credit-cards, credentials, and passwords at runtime.")} className="w-full text-left py-1.5 px-2 font-sans text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Privacy Redaction
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest font-semibold block">TELEMETRY SCHEMA</span>
              <button onClick={() => alert("Telemetry Spans detail: trace logs output timestamps, parent IDs, inputs, reasoning thoughts, and latency parameters.")} className="w-full text-left py-1.5 px-2 font-sans text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Runs & Spans Schema
              </button>
              <button onClick={() => alert("Dynamic token calculation: Tracks actual costs of prompts and output generations for major models.")} className="w-full text-left py-1.5 px-2 font-sans text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Token & Cost Trackers
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest font-semibold block">SUPPORT</span>
              <button onClick={() => alert("Support channels: Open an issue on GitHub or reach out to engineering leads inside Discord.")} className="w-full text-left py-1.5 px-2 font-sans text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Troubleshooting
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 border border-neutral-150 rounded text-center space-y-2">
            <span className="font-sans font-bold text-xs text-neutral-900 block">Want Live Testing?</span>
            <p className="text-[10px] font-sans text-neutral-400 leading-normal">
              Jump right into our mock tracking trace streams to test telemetry tools instantly.
            </p>
            <button
              id="docs-dashboard-shortcut"
              onClick={() => setCurrentView('dashboard')}
              className="w-full spectrum-gradient text-white font-sans text-[10px] font-semibold uppercase tracking-wider py-2 rounded shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Open Live Tracer
            </button>
          </div>
        </div>

        {/* MAIN DOCS CONTENT (Colspan 9) */}
        <div className="lg:col-span-9 bg-white border border-neutral-200 rounded p-8 md:p-10 shadow-sm space-y-10">
          
          {/* Section 1: Intro */}
          <div className="space-y-3">
            <h2 className="font-sans text-3xl font-black tracking-tight text-neutral-900">
              Universal SDK Integration
            </h2>
            <p className="font-sans text-sm text-neutral-500 leading-relaxed">
              LLM Lens integrates seamlessly with all leading Python and TypeScript agentic frameworks using lightweight hooks. Our SDK is designed to automatically wrap agent decisions, vector queries, and API tool transactions without requiring changes to your core logic.
            </p>
          </div>

          {/* Section 2: Installation instructions */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-bold text-neutral-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full spectrum-gradient"></span>
              Step 1: Install SDK
            </h3>
            <p className="font-sans text-xs text-neutral-500">
              Run the standard install command within your project terminal environment:
            </p>

            <div className="bg-neutral-900 text-neutral-100 rounded p-4 font-mono text-xs flex justify-between items-center shadow-inner">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-500" />
                <span>{installCmd}</span>
              </div>
              <button
                id="copy-install-cmd"
                onClick={() => handleCopy(installCmd, setCopiedInstall)}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
                title="Copy Command"
              >
                {copiedInstall ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Section 3: Universal Code Builder */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-sans text-lg font-bold text-neutral-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full spectrum-gradient"></span>
                Step 2: Interactive Code Builder
              </h3>
              <p className="font-sans text-xs text-neutral-500 leading-relaxed">
                Configure your tech stack parameters below to dynamically output the correct, customized initialization and instrumentation template.
              </p>
            </div>

            {/* Selection Filters Card */}
            <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Filter 1: Framework */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                  Agentic Framework
                </label>
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value as any)}
                  className="w-full bg-white border border-neutral-200 py-2 px-3 rounded text-xs focus:border-black outline-none font-sans"
                >
                  <option value="vercel-ai">Vercel AI SDK</option>
                  <option value="langchain">LangChain</option>
                  <option value="llamaindex">LlamaIndex</option>
                  <option value="openai">OpenAI Raw Client</option>
                  <option value="anthropic">Anthropic Raw Client</option>
                </select>
              </div>

              {/* Filter 2: Language */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                  Programming Language
                </label>
                <div className="grid grid-cols-2 gap-2 bg-white border border-neutral-200 p-1 rounded">
                  <button
                    onClick={() => setSelectedLang('python')}
                    className={`py-1 text-center text-[10px] font-mono font-bold rounded cursor-pointer ${
                      selectedLang === 'python' ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setSelectedLang('typescript')}
                    className={`py-1 text-center text-[10px] font-mono font-bold rounded cursor-pointer ${
                      selectedLang === 'typescript' ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    TS/JS
                  </button>
                </div>
              </div>

              {/* Filter 3: Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                  LLM Model Target
                </label>
                <select
                  value={selectedLLM}
                  onChange={(e) => setSelectedLLM(e.target.value as any)}
                  className="w-full bg-white border border-neutral-200 py-2 px-3 rounded text-xs focus:border-black outline-none font-sans"
                >
                  <option value="openai">GPT-4o (OpenAI)</option>
                  <option value="gemini">Gemini Pro (Google)</option>
                  <option value="anthropic">Claude Sonnet (Anthropic)</option>
                  <option value="groq">Llama 3 (Groq)</option>
                  <option value="ollama">Ollama (Local LLMs)</option>
                </select>
              </div>

            </div>

            {/* Generated Code Window */}
            <div className="border border-neutral-200 rounded overflow-hidden shadow-sm flex flex-col bg-neutral-900 text-neutral-100">
              <div className="flex justify-between items-center bg-neutral-950 px-5 py-3 border-b border-neutral-800">
                <span className="font-mono text-xs text-neutral-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> 
                  {activePreset.title}.{selectedLang === 'python' ? 'py' : 'ts'}
                </span>
                
                <button
                  id="copy-docs-snippet"
                  onClick={() => handleCopy(activePreset.code, setCopiedCode)}
                  className="font-mono text-[10px] text-neutral-400 hover:text-white flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded cursor-pointer transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Snippet
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 font-mono text-xs overflow-x-auto min-h-[300px] leading-relaxed max-h-[450px]">
                {activePreset.code.split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-neutral-700 select-none text-right w-5">{idx + 1}</span>
                    <span className="whitespace-pre text-neutral-200">
                      {line.startsWith('#') || line.startsWith('//') ? (
                        <span className="text-neutral-500 italic">{line}</span>
                      ) : line.includes('import') || line.includes('from') || line.includes('const') ? (
                        <span className="text-brand-orange font-semibold">{line}</span>
                      ) : line.includes('init') || line.includes('instrument') ? (
                        <span className="text-[#a53b22] font-semibold">{line}</span>
                      ) : (
                        line
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Parameters reference */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-bold text-neutral-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full spectrum-gradient"></span>
              Environment Variables & Config Parameters
            </h3>
            
            <p className="font-sans text-xs text-neutral-500">
              Provide these environment variables in your runtime setup or active `.env` context file to verify connectivity with the LLM Lens Cloud platform:
            </p>

            <div className="border border-neutral-200 rounded overflow-hidden">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-mono text-[10px] uppercase border-b border-neutral-200">
                    <th className="p-4 font-bold">Variable Name</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  <tr>
                    <td className="p-4 font-mono font-bold text-black">LENS_API_KEY</td>
                    <td className="p-4 font-mono text-brand-purple">string</td>
                    <td className="p-4">Your secret authorization credentials, sourced from the Settings tab in LLM Lens.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-black">LENS_PROJECT_ID</td>
                    <td className="p-4 font-mono text-brand-purple">string</td>
                    <td className="p-4">Logical group identifier for correlating different agent fleets (e.g. `support-prod`).</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-black">LENS_REDATION_FILTER</td>
                    <td className="p-4 font-mono text-brand-purple">boolean</td>
                    <td className="p-4">Set to `true` to enable automatic Client-side Edge privacy hashing. Defaults to `true`.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
