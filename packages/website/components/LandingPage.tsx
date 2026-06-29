"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Gauge, 
  Network, 
  ShieldCheck, 
  CheckCircle2, 
  Brain, 
  Cpu, 
  ArrowRight, 
  Terminal, 
  Sparkles, 
  Calendar, 
  Mail, 
  User, 
  X, 
  ChevronRight,
  Play,
  RotateCcw,
  Sun,
  FileDown
} from 'lucide-react';
import { CODE_PRESETS, MOCK_TRACE_SESSIONS } from '../mockData';

interface LandingPageProps {
  setCurrentView: (view: any) => void;
  setActiveSession: (session: any) => void;
}

export default function LandingPage({ setCurrentView, setActiveSession }: LandingPageProps) {
  const [selectedFramework, setSelectedFramework] = useState<'vercel-ai' | 'langchain' | 'llamaindex' | 'openai' | 'anthropic'>('vercel-ai');
  const [copied, setCopied] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Replay simulator state
  const [replayStep, setReplayStep] = useState(0);
  const sampleTrace = MOCK_TRACE_SESSIONS[0];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePreset = CODE_PRESETS.find(
    (p) => p.framework === selectedFramework && p.language === 'typescript'
  ) || CODE_PRESETS[0];

  return (
    <div className="relative w-full overflow-x-hidden pt-20">
      {/* 1. HERO SECTION */}
      <section className="relative px-6 md:px-12 py-16 md:py-24 max-w-[1440px] mx-auto flex flex-col items-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col gap-6 text-left">
            {/* Version Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 w-fit rounded-full"
            >
              <span className="font-mono text-xs font-semibold text-brand-orange">NEW IN v2.4.0</span>
              <span className="font-sans text-xs text-neutral-500">Beautiful Light Mode & Markdown Report Downloads</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.08]"
            >
              Observability <br />
              for the <span className="spectrum-text italic">Agentic Era</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-sans text-lg md:text-xl text-neutral-500 max-w-lg leading-relaxed"
            >
              LLM Lens provides high-fidelity tracing and real-time observability for agentic workflows. Understand every thought process, tool call, and token with zero overhead.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <button
                id="hero-start-free"
                onClick={() => setCurrentView('dashboard')}
                className="spectrum-gradient text-white font-sans text-xs font-semibold uppercase tracking-widest px-10 py-5 active:scale-95 transition-all shadow-xl shadow-brand-orange/10 rounded-sm cursor-pointer"
              >
                Start Building Free
              </button>
              <button
                id="hero-book-demo"
                onClick={() => setShowDemoModal(true)}
                className="bg-white border border-neutral-200 text-neutral-900 font-sans text-xs font-semibold uppercase tracking-widest px-10 py-5 hover:bg-neutral-50 transition-all rounded-sm cursor-pointer"
              >
                Book a Demo
              </button>
            </motion.div>
          </div>

          {/* Hero Floating Abstract Graphic */}
          <div className="relative flex justify-center items-center h-[450px] lg:h-[550px]">
            <div className="relative floating-graphic flex items-center justify-center w-full max-w-[450px]">
              {/* Decorative vertical spectrum bars in background */}
              <div className="absolute inset-0 flex items-center justify-center -z-10 gap-3">
                <div className="w-7 h-52 spectrum-gradient opacity-10 -translate-y-12 rounded-full"></div>
                <div className="w-7 h-64 spectrum-gradient opacity-25 -translate-y-6 rounded-full"></div>
                <div className="w-7 h-80 spectrum-gradient opacity-45 rounded-full"></div>
                <div className="w-7 h-64 spectrum-gradient opacity-25 translate-y-6 rounded-full"></div>
                <div className="w-7 h-52 spectrum-gradient opacity-10 translate-y-12 rounded-full"></div>
              </div>

              {/* Stacked Cards Layout */}
              <div className="relative w-full aspect-square flex items-center justify-center">
                {/* 1. Reasoning Engine Card (Top Card) */}
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="absolute z-30 -translate-y-12 -translate-x-6 bg-white border border-neutral-200 p-5 w-64 shadow-2xl rounded-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded spectrum-gradient flex items-center justify-center text-white">
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      Reasoning Engine
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-neutral-100 rounded-sm overflow-hidden">
                      <div className="h-full w-4/5 spectrum-gradient"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                      <span>thinking...</span>
                      <span>80%</span>
                    </div>
                  </div>
                  <div className="border-t border-neutral-100 mt-4 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400">LATENCY</span>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900">1.2s</span>
                  </div>
                </motion.div>

                {/* 2. Token Stream Card (Middle Card) */}
                <motion.div 
                  whileHover={{ scale: 1.03, y: 5 }}
                  className="absolute z-20 translate-y-14 translate-x-12 bg-white border border-neutral-200 p-5 w-64 shadow-xl opacity-90 scale-[0.97] rounded-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-neutral-400" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      Token Stream
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-neutral-900">4,120</span>
                    <span className="text-[10px] font-mono text-neutral-400">t/s</span>
                  </div>
                  <div className="h-1 bg-neutral-100 rounded-full mt-2 w-full overflow-hidden">
                    <div className="h-full w-2/3 bg-neutral-400"></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF / INTEGRATIONS ROW */}
      <section className="w-full bg-neutral-50 border-y border-neutral-200 py-10 overflow-hidden">
        <div className="px-6 md:px-12 max-w-[1440px] mx-auto">
          <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-[0.25em] mb-8 text-center">
            Powering the leading agentic frameworks — Click to view code
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {(['vercel-ai', 'langchain', 'llamaindex', 'openai', 'anthropic'] as const).map((fw) => (
              <button
                key={fw}
                id={`fw-tab-${fw}`}
                onClick={() => setSelectedFramework(fw)}
                className={`text-xl font-bold tracking-tighter transition-all px-4 py-2 rounded-sm cursor-pointer ${
                  selectedFramework === fw
                    ? 'text-black scale-105 border-b-2 border-black'
                    : 'text-neutral-400 hover:text-neutral-700 hover:scale-102'
                }`}
              >
                {fw === 'vercel-ai' && 'Vercel AI SDK'}
                {fw === 'langchain' && 'LangChain'}
                {fw === 'llamaindex' && 'LlamaIndex'}
                {fw === 'openai' && 'OpenAI'}
                {fw === 'anthropic' && 'Anthropic'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. VALUE PROP GRID */}
      <section className="py-20 px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-neutral-200 p-8 flex flex-col gap-5 hover:shadow-xl hover:border-neutral-400 transition-all duration-300 group rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-neutral-50 rounded border border-neutral-200 group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <Gauge className="w-5 h-5 text-neutral-800 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-sans text-xl font-bold text-neutral-900">Zero-Latency Tracing</h3>
            <p className="font-sans text-sm text-neutral-500 leading-relaxed">
              Our lightweight SDK injects minimal overhead, ensuring your production agent latency remains untouched while capturing granular telemetry.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-neutral-200 p-8 flex flex-col gap-5 hover:shadow-xl hover:border-neutral-400 transition-all duration-300 group rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-neutral-50 rounded border border-neutral-200 group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <Network className="w-5 h-5 text-neutral-800 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-sans text-xl font-bold text-neutral-900">Universal Adapters</h3>
            <p className="font-sans text-sm text-neutral-500 leading-relaxed">
              Native support for OpenAI, Anthropic, Gemini, Groq, and local models. Switch providers without rewriting your observability stack.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-neutral-200 p-8 flex flex-col gap-5 hover:shadow-xl hover:border-neutral-400 transition-all duration-300 group rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-neutral-50 rounded border border-neutral-200 group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <ShieldCheck className="w-5 h-5 text-neutral-800 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-sans text-xl font-bold text-neutral-900">Local-First Privacy</h3>
            <p className="font-sans text-sm text-neutral-500 leading-relaxed">
              PII redaction happens at the edge. Traces are encrypted before they ever leave your infrastructure. SOC2 Type II compliant by default.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-neutral-200 p-8 flex flex-col gap-5 hover:shadow-xl hover:border-neutral-400 transition-all duration-300 group rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-neutral-50 rounded border border-neutral-200 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
              <Sun className="w-5 h-5 text-neutral-800 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-sans text-xl font-bold text-neutral-900">Beautiful UI & Reports</h3>
            <p className="font-sans text-sm text-neutral-500 leading-relaxed">
              Experience the fully re-designed Light Mode interface and download comprehensive trace insights instantly as Markdown reports for offline sharing.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CODE SHOWCASE */}
      <section className="py-16 px-6 md:px-12 max-w-[1440px] mx-auto overflow-hidden">
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col lg:flex-row">
          {/* Left Text Detail */}
          <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col gap-6 justify-center">
            <h2 className="font-sans text-3xl md:text-5xl font-bold tracking-tight text-neutral-900">
              One line to unlock full visibility.
            </h2>
            <p className="font-sans text-base text-neutral-500 leading-relaxed">
              Integration is seamless. Whether you're using LangGraph, LlamaIndex, or a custom state machine, LLM Lens hooks into the runtime to reconstruct the agent's thought chain automatically.
            </p>

            <ul className="space-y-3 mt-2">
              <li className="flex items-center gap-2.5 font-sans text-sm text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                <span>Automatic spans for Tool Calls</span>
              </li>
              <li className="flex items-center gap-2.5 font-sans text-sm text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                <span>Cost calculation per request</span>
              </li>
              <li className="flex items-center gap-2.5 font-sans text-sm text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                <span>Live prompt debugging</span>
              </li>
            </ul>

            <div className="flex items-center gap-4 mt-4">
              <button
                id="showcase-docs-btn"
                onClick={() => setCurrentView('docs')}
                className="text-xs font-semibold uppercase tracking-wider text-black flex items-center gap-1.5 hover:underline"
              >
                Explore Integration Docs <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Interactive Code Box */}
          <div className="flex-1 bg-neutral-200 p-6 flex flex-col relative border-t lg:border-t-0 lg:border-l border-neutral-300">
            {/* Window controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex gap-2">
                <button
                  id="copy-code-btn"
                  onClick={() => handleCopyCode(activePreset.code)}
                  className="font-sans text-[11px] text-neutral-500 hover:text-black bg-white px-2.5 py-1 border border-neutral-300 rounded cursor-pointer transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy snippet'}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="bg-white border border-neutral-300 rounded p-5 font-mono text-xs overflow-x-auto h-full min-h-[280px] shadow-inner flex flex-col justify-between">
              <div>
                {activePreset.code.split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-neutral-300 select-none text-right w-4">{idx + 1}</span>
                    <span className="whitespace-pre text-neutral-800">
                      {line.startsWith('#') || line.startsWith('//') ? (
                        <span className="text-neutral-400 italic">{line}</span>
                      ) : line.includes('import') || line.includes('from') || line.includes('const') ? (
                        <span className="text-brand-purple font-semibold">{line}</span>
                      ) : line.includes('init') || line.includes('tracer') ? (
                        <span className="text-neutral-900 font-semibold">{line}</span>
                      ) : (
                        line
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Console Status */}
              <div className="mt-6 pt-3 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal — {activePreset.language === 'python' ? 'Python 3.11' : 'Node v18'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tracing Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENTO GRID / STATS SECTION */}
      <section className="py-20 px-6 md:px-12 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Card 1: Interactive Real-time Replay Player */}
          <div className="md:col-span-2 bg-white border border-neutral-200 p-8 rounded-lg flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
            <div>
              <span className="font-mono text-[10px] font-semibold text-brand-orange uppercase tracking-wider mb-1 block">
                Interactive Preview
              </span>
              <h4 className="font-sans text-2xl font-bold text-neutral-900 mb-2">Real-time Replay</h4>
              <p className="font-sans text-sm text-neutral-500">
                Rewind and watch your agent's execution step-by-step. Pinpoint exactly where the reasoning diverged from the prompt.
              </p>
            </div>

            {/* Micro Replay Screen */}
            <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded p-4 font-mono text-xs flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> trace-replay-sim
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="replay-prev"
                    disabled={replayStep === 0}
                    onClick={() => setReplayStep((s) => Math.max(0, s - 1))}
                    className="p-1 text-neutral-500 hover:text-black disabled:opacity-30 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    id="replay-next"
                    disabled={replayStep >= sampleTrace.steps.length - 1}
                    onClick={() => setReplayStep((s) => Math.min(sampleTrace.steps.length - 1, s + 1))}
                    className="flex items-center gap-0.5 font-semibold text-brand-orange hover:text-brand-purple disabled:opacity-30 cursor-pointer"
                  >
                    Next <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    id="replay-reset"
                    onClick={() => setReplayStep(0)}
                    className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Steps */}
              <div className="flex gap-1">
                {sampleTrace.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
                      index <= replayStep ? 'spectrum-gradient' : 'bg-neutral-200'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Display Current Simulated Step */}
              <motion.div
                key={replayStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-3 border border-neutral-200 rounded shadow-sm min-h-[90px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-[11px]">
                    <span className="w-2 h-2 rounded-full spectrum-gradient"></span>
                    {sampleTrace.steps[replayStep].title}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                    {sampleTrace.steps[replayStep].description}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-2 pt-1.5 border-t border-neutral-100">
                  <span>Type: {sampleTrace.steps[replayStep].type.toUpperCase()}</span>
                  {sampleTrace.steps[replayStep].tokensUsed && (
                    <span>+{sampleTrace.steps[replayStep].tokensUsed} tokens</span>
                  )}
                </div>
              </motion.div>

              <button
                id="sandbox-shortcut-btn"
                onClick={() => {
                  setActiveSession(sampleTrace);
                  setCurrentView('dashboard');
                }}
                className="w-full text-center text-[10px] font-bold text-brand-purple uppercase tracking-wider border border-dashed border-neutral-300 py-2 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Open Full Interactive Sandbox Tracker
              </button>
            </div>
          </div>

          {/* Card 2: 99.9% Reliability */}
          <div className="bg-black text-white p-8 rounded-lg flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 cursor-default shadow-sm border border-neutral-800">
            <div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mb-6"></div>
              <span className="font-mono text-7xl font-black tracking-tighter block text-white select-none">
                99.9%
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                Data Reliability
              </p>
              <p className="font-sans text-xs text-neutral-500 leading-normal">
                Strict SOC2 Level-II compliance keeping production tracing reliable.
              </p>
            </div>
          </div>

          {/* Card 3: Integrations */}
          <div className="bg-white border border-neutral-200 p-8 rounded-lg flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
            <div className="w-full aspect-square spectrum-gradient opacity-10 rounded-full flex items-center justify-center relative overflow-hidden max-w-[120px] mx-auto mb-4">
              <Network className="w-10 h-10 text-neutral-800 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-center">
              <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                Integrations
              </p>
              <p className="font-sans text-sm font-bold text-neutral-900">
                8+ Native Adapters
              </p>
              <button
                id="view-all-adapters-shortcut"
                onClick={() => setCurrentView('docs')}
                className="text-[10px] text-brand-purple hover:underline font-bold uppercase tracking-wider block mx-auto mt-2 cursor-pointer"
              >
                View all integrations
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 6. BOOK DEMO MODAL */}
      {showDemoModal && (
        <div id="demo-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setShowDemoModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg border border-neutral-200 w-full max-w-md p-8 relative z-10 shadow-2xl"
          >
            <button 
              id="close-demo-modal"
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!demoSubmitted ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-orange" />
                    Book an LLM Lens Demo
                  </h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    See how enterprise agentic workflows achieve zero-latency tracing and perfect thought visibility.
                  </p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (demoEmail && demoName) setDemoSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        value={demoName}
                        onChange={(e) => setDemoName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded focus:border-black outline-none font-sans text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-neutral-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="john@company.com"
                        value={demoEmail}
                        onChange={(e) => setDemoEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded focus:border-black outline-none font-sans text-sm transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    id="submit-demo-request"
                    type="submit"
                    className="w-full spectrum-gradient text-white py-3 font-sans text-xs font-semibold uppercase tracking-widest hover:opacity-90 active:scale-98 transition-all rounded-sm cursor-pointer"
                  >
                    Schedule Demo Meeting
                  </button>
                </form>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full spectrum-gradient text-white flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-neutral-950">Thank you, {demoName}!</h4>
                  <p className="text-sm text-neutral-500 mt-2">
                    A product specialist will reach out to <strong>{demoEmail}</strong> within 1 business hour with calendar slots.
                  </p>
                </div>
                <button 
                  id="dismiss-demo-success"
                  onClick={() => {
                    setShowDemoModal(false);
                    setDemoSubmitted(false);
                    setDemoEmail('');
                    setDemoName('');
                  }}
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-black cursor-pointer"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
