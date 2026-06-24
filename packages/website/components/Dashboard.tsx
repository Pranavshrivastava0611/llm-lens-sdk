"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Search, 
  ChevronRight, 
  Database, 
  Cpu, 
  Brain, 
  Clock, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Send,
  Terminal,
  Activity,
  Plus,
  RefreshCw,
  TrendingUp,
  FileText,
  Mail,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { MOCK_TRACE_SESSIONS } from '../mockData';
import { TraceSession, TraceStep } from '../types';

interface DashboardProps {
  activeSession: TraceSession | null;
  setActiveSession: (session: TraceSession | null) => void;
}

export default function Dashboard({ activeSession, setActiveSession }: DashboardProps) {
  const [sessions, setSessions] = useState<TraceSession[]>(MOCK_TRACE_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<TraceSession>(activeSession || MOCK_TRACE_SESSIONS[0]);
  const [selectedStep, setSelectedStep] = useState<TraceStep | null>(MOCK_TRACE_SESSIONS[0].steps[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator state
  const [customPrompt, setCustomPrompt] = useState('Find top tech news and draft a 2-sentence summary');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [activeSimulationStep, setActiveSimulationStep] = useState<TraceStep | null>(null);

  useEffect(() => {
    if (activeSession) {
      setSelectedSession(activeSession);
      setSelectedStep(activeSession.steps[0]);
      setActiveSession(null); // Clear transit state
    }
  }, [activeSession, setActiveSession]);

  const handleSelectSession = (session: TraceSession) => {
    setSelectedSession(session);
    setSelectedStep(session.steps[0]);
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setActiveSimulationStep(null);

    const baseSession: TraceSession = {
      id: `sim-trace-${Date.now()}`,
      agentName: 'Custom Playground Agent',
      timestamp: 'Just now',
      status: 'running',
      totalTokens: 0,
      totalCostUsd: 0,
      totalDurationMs: 0,
      steps: []
    };

    setSessions(prev => [baseSession, ...prev]);
    setSelectedSession(baseSession);
    setSelectedStep(null);

    const simulationSteps: TraceStep[] = [
      {
        id: 'sim-1',
        type: 'input',
        title: 'User Instruction Triggered',
        description: `Prompt: "${customPrompt}"`,
        durationMs: 0,
        iconName: 'Send'
      },
      {
        id: 'sim-2',
        type: 'thought',
        title: 'Formulate Execution Strategy',
        description: 'Analyzing constraints and dependencies. Planning to query Google Search and format summary content using GPT-4o.',
        durationMs: 120,
        tokensUsed: 150,
        costUsd: 0.00075,
        iconName: 'Brain'
      },
      {
        id: 'sim-3',
        type: 'tool_call',
        title: 'Tool Call: google_news_search',
        description: 'Arguments: {"query": "breaking technology news 2026", "limit": 3}',
        durationMs: 950,
        iconName: 'Globe'
      },
      {
        id: 'sim-4',
        type: 'tool_response',
        title: 'Tool Response Received',
        description: 'Results: 1. Gemini Live API gets real-time upgrade. 2. Quantum Computing standard published. 3. Solid State Batteries enter mass production.',
        durationMs: 0,
        iconName: 'CheckCircle2'
      },
      {
        id: 'sim-5',
        type: 'thought',
        title: 'Synthesize & Draft Summary Response',
        description: 'Creating the 2-sentence summary based on returned web logs. Running tone-alignment checklist.',
        durationMs: 180,
        tokensUsed: 450,
        costUsd: 0.00225,
        iconName: 'Brain'
      },
      {
        id: 'sim-6',
        type: 'output',
        title: 'Completed Agent Execution',
        description: 'Final Answer: "Gemini Live API has received major real-time upgrades alongside the release of the first official Quantum Computing standards. Simultaneously, high-density solid-state battery cells have officially entered commercial mass production."',
        durationMs: 650,
        tokensUsed: 350,
        costUsd: 0.00175,
        iconName: 'CheckCircle2'
      }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < simulationSteps.length) {
        const nextStep = simulationSteps[currentStepIndex];
        setActiveSimulationStep(nextStep);
        setSimulationProgress(((currentStepIndex + 1) / simulationSteps.length) * 100);
        
        setSessions(prev => {
          const newSessions = [...prev];
          const activeSessionIdx = newSessions.findIndex(s => s.id === baseSession.id);
          if (activeSessionIdx !== -1) {
             const sessionToUpdate = {...newSessions[activeSessionIdx]};
             sessionToUpdate.steps = [...sessionToUpdate.steps, nextStep];
             sessionToUpdate.totalTokens += (nextStep.tokensUsed || 0);
             sessionToUpdate.totalCostUsd += (nextStep.costUsd || 0);
             sessionToUpdate.totalDurationMs += nextStep.durationMs;
             newSessions[activeSessionIdx] = sessionToUpdate;
             setSelectedSession({...sessionToUpdate});
             setSelectedStep(nextStep);
          }
          return newSessions;
        });

        currentStepIndex++;
      } else {
        clearInterval(interval);
        
        setSessions(prev => {
          const newSessions = [...prev];
          const activeSessionIdx = newSessions.findIndex(s => s.id === baseSession.id);
          if (activeSessionIdx !== -1) {
             newSessions[activeSessionIdx].status = 'completed';
             setSelectedSession({...newSessions[activeSessionIdx]});
          }
          return newSessions;
        });

        setIsSimulating(false);
        setSimulationProgress(0);
        setActiveSimulationStep(null);
      }
    }, 1100);
  };

  const getIconComponent = (iconName: string | undefined) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'XCircle': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'Send': return <Send className="w-4 h-4" />;
      case 'Mail': return <Mail className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'MapPin': return <MapPin className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4 text-neutral-400" />;
    }
  };

  const filteredSessions = sessions.filter(
    (s) => 
      s.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 border-t border-neutral-200">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-neutral-200 px-6 py-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
              Dev Sandbox
            </span>
          </div>
          <h2 className="font-sans text-3xl font-bold tracking-tight text-neutral-900 mt-1">
            Agentic Observability Sandbox
          </h2>
          <p className="font-sans text-sm text-neutral-500 mt-1">
            Simulate, trace, and debug complex multi-step AI reasoning chains. See token counts and microsecond latency on every block.
          </p>
        </div>

        {/* Live System stats banner */}
        <div className="flex gap-4 p-4 bg-neutral-50 rounded border border-neutral-200 shadow-inner">
          <div className="text-left">
            <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">SANDBOX METRICS</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-neutral-900">{sessions.length}</span>
              <span className="text-[10px] text-neutral-400">runs</span>
            </div>
          </div>
          <div className="w-px bg-neutral-200"></div>
          <div className="text-left">
            <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">TOTAL SPENT</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-neutral-900">
                ${sessions.reduce((acc, s) => acc + s.totalCostUsd, 0).toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE PANELS LAYOUT */}
      <div className="px-6 md:px-12 py-8 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL 1: SESSIONS / TRACES FEED (Colspan 3) */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded p-5 flex flex-col gap-4 shadow-sm h-[750px]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-sans font-bold text-base text-neutral-900">Trace Logs</h3>
            <span className="font-mono text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
              {filteredSessions.length} active
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Filter by agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 outline-none text-xs rounded transition-all"
            />
          </div>

          {/* Run List Container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                id={`session-card-${session.id}`}
                onClick={() => handleSelectSession(session)}
                className={`w-full text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  selectedSession.id === session.id
                    ? 'border-neutral-900 bg-neutral-50/70 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-sans font-bold text-xs text-neutral-900 leading-normal truncate max-w-[140px]">
                    {session.agentName}
                  </span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    session.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {session.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                  <span>ID: {session.id.substring(0, 10)}...</span>
                  <span>{session.timestamp}</span>
                </div>

                <div className="border-t border-neutral-100/80 pt-1.5 mt-0.5 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {(session.totalDurationMs / 1000).toFixed(2)}s</span>
                  <span>${session.totalCostUsd.toFixed(5)}</span>
                </div>
              </button>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-10 text-neutral-400 text-xs font-sans">
                No matching traces found.
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: MIDDLE REPLAY TIMELINE (Colspan 5) */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded p-5 flex flex-col gap-4 shadow-sm h-[750px]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider block">ACTIVE RUN</span>
              <h3 className="font-sans font-bold text-lg text-neutral-900 leading-none">
                {selectedSession.agentName}
              </h3>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">
              {selectedSession.steps.length} trace steps
            </span>
          </div>

          {/* Session Overview Stats row */}
          <div className="grid grid-cols-3 gap-3 bg-neutral-50 p-3 rounded border border-neutral-100 text-center font-mono">
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">Duration</span>
              <span className="text-xs font-bold text-neutral-800">
                {(selectedSession.totalDurationMs / 1000).toFixed(2)} seconds
              </span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">Total Cost</span>
              <span className="text-xs font-bold text-neutral-800">
                ${selectedSession.totalCostUsd.toFixed(5)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">Tokens Used</span>
              <span className="text-xs font-bold text-neutral-800">
                {selectedSession.totalTokens.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Trace Replay Timeline scroll list */}
          <div className="flex-1 overflow-y-auto pr-1 relative pl-6 space-y-4 pt-2">
            {/* Thread Line */}
            <div className="absolute left-10 top-0 bottom-4 w-0.5 bg-neutral-200"></div>

            {selectedSession.steps.map((step, index) => (
              <button
                key={step.id}
                id={`step-button-${step.id}`}
                onClick={() => setSelectedStep(step)}
                className={`w-full text-left relative pl-10 pr-3 py-3.5 border rounded cursor-pointer transition-all flex flex-col gap-1.5 ${
                  selectedStep?.id === step.id
                    ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                }`}
              >
                {/* Node marker on the thread line */}
                <div className={`absolute left-[-15px] top-4 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  selectedStep?.id === step.id
                    ? 'bg-black text-white border-black scale-110'
                    : step.type === 'error'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : step.type === 'output'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-white text-neutral-500 border-neutral-200'
                }`}>
                  {getIconComponent(step.iconName)}
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="font-sans font-bold text-xs text-neutral-900 leading-normal">
                    {step.title}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-400">
                    {step.durationMs > 0 ? `${step.durationMs}ms` : 'instant'}
                  </span>
                </div>

                <p className="font-sans text-[11px] text-neutral-500 leading-relaxed truncate-3-lines">
                  {step.description}
                </p>

                {step.tokensUsed && (
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
                    <span className="bg-neutral-100 px-1.5 py-0.5 rounded">+{step.tokensUsed} tokens</span>
                    <span>Cost: ${step.costUsd?.toFixed(6)}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 3: STEP INSPECTOR & PLAYGROUND (Colspan 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[750px]">
          
          {/* Box 3A: Step Inspector Detail */}
          <div className="bg-white border border-neutral-200 rounded p-5 flex flex-col gap-4 shadow-sm flex-1 overflow-y-auto">
            <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
              <h3 className="font-sans font-bold text-base text-neutral-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-orange" />
                Step Inspector
              </h3>
              {selectedStep && (
                <span className="font-mono text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded uppercase font-semibold">
                  {selectedStep.type}
                </span>
              )}
            </div>

            {selectedStep ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-sans font-bold text-sm text-neutral-950">{selectedStep.title}</h4>
                  <p className="font-mono text-[10px] text-neutral-400 mt-0.5">ID: {selectedStep.id}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest font-semibold block">Description / Payload</span>
                  <div className="bg-neutral-50 border border-neutral-200 rounded p-4 font-sans text-xs text-neutral-800 leading-relaxed">
                    {selectedStep.description}
                  </div>
                </div>

                {selectedStep.metadata && (
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest font-semibold block">Attached Metadata</span>
                    <div className="bg-neutral-50 border border-neutral-200 rounded p-3 font-mono text-[10px] space-y-1.5">
                      {Object.entries(selectedStep.metadata).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-neutral-100/50 pb-1">
                          <span className="text-neutral-500 font-medium">{key}</span>
                          <span className="text-neutral-900 truncate max-w-[150px]" title={String(val)}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
                  <div className="bg-neutral-50/50 p-2.5 rounded border border-neutral-100 text-center">
                    <span className="text-[9px] text-neutral-400 block font-mono uppercase">BLOCK LATENCY</span>
                    <span className="text-xs font-bold font-mono text-neutral-800">
                      {selectedStep.durationMs}ms
                    </span>
                  </div>
                  <div className="bg-neutral-50/50 p-2.5 rounded border border-neutral-100 text-center">
                    <span className="text-[9px] text-neutral-400 block font-mono uppercase">TOKEN SURGE</span>
                    <span className="text-xs font-bold font-mono text-neutral-800">
                      {selectedStep.tokensUsed ? `+${selectedStep.tokensUsed}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                <HelpCircle className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-sans">Click on any timeline card to inspect parameters, execution loads, and responses.</p>
              </div>
            )}
          </div>

          {/* Box 3B: Agent Thought Simulator Play area */}
          <div className="bg-white border border-neutral-200 rounded p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="font-sans font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-purple" />
                Agent Playground
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-sans text-neutral-500 leading-normal">
                Type an instruction, and click "Run Simulation" to see LLM Lens automatically record and reconstruct the thought/tool traces.
              </p>
              
              <textarea
                value={customPrompt}
                disabled={isSimulating}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-16 p-3 border border-neutral-200 focus:border-black rounded text-xs outline-none font-sans leading-relaxed resize-none transition-all"
                placeholder="Describe what the agent should do..."
              />

              {isSimulating ? (
                <div className="space-y-2 py-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                    <span>Tracer running...</span>
                    <span>{Math.round(simulationProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${simulationProgress}%` }}
                    ></div>
                  </div>
                  {activeSimulationStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 bg-neutral-50 p-2 border border-neutral-200 rounded"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin text-brand-orange" />
                      <span className="font-bold text-neutral-700 truncate">{activeSimulationStep.title}</span>
                    </motion.div>
                  )}
                </div>
              ) : (
                <button
                  id="start-sim-run"
                  onClick={runSimulation}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-xs font-semibold uppercase tracking-widest py-3 transition-all active:scale-[0.98] rounded-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Run Agent Sandbox
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
