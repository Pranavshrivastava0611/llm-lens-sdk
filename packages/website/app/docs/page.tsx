"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";

export default function DocsPage() {
  const refs = {
    quickstart: useRef<HTMLElement>(null),
    daemon: useRef<HTMLElement>(null),
    vercel: useRef<HTMLElement>(null),
    langchain: useRef<HTMLElement>(null),
    llamaindex: useRef<HTMLElement>(null),
    openai: useRef<HTMLElement>(null),
    anthropic: useRef<HTMLElement>(null),
    gemini: useRef<HTMLElement>(null),
    groq: useRef<HTMLElement>(null),
    express: useRef<HTMLElement>(null),
  };

  const scrollTo = (id: keyof typeof refs) => {
    const el = refs[id].current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as keyof typeof refs;
    if (hash && refs[hash] && refs[hash].current) {
      setTimeout(() => {
        refs[hash].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col pt-20">
      <nav className="bg-surface-container-lowest flex justify-between items-center w-full px-8 h-20 fixed top-0 z-50 border-b border-outline-variant">
        <div className="flex items-center gap-stack-lg">
          <Link href="/" className="text-headline-lg font-headline-lg font-bold text-primary tracking-tighter">
            LLM Lens
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-64 border-r border-outline-variant p-stack-lg hidden md:block overflow-y-auto h-[calc(100vh-80px)] sticky top-20">
          <div className="flex flex-col gap-stack-md">
            <div>
              <h4 className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest mb-unit">Getting Started</h4>
              <ul className="flex flex-col gap-2 border-l-2 border-surface-container ml-2 pl-4">
                <li><button onClick={() => scrollTo('quickstart')} className="font-body-sm text-body-sm text-primary font-medium text-left">Quickstart</button></li>
                <li><button onClick={() => scrollTo('daemon')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Daemon Setup</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest mb-unit">Frameworks</h4>
              <ul className="flex flex-col gap-2 border-l-2 border-surface-container ml-2 pl-4">
                <li><button onClick={() => scrollTo('vercel')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Vercel AI SDK</button></li>
                <li><button onClick={() => scrollTo('langchain')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">LangChain</button></li>
                <li><button onClick={() => scrollTo('llamaindex')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">LlamaIndex</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest mb-unit">Raw Clients</h4>
              <ul className="flex flex-col gap-2 border-l-2 border-surface-container ml-2 pl-4">
                <li><button onClick={() => scrollTo('openai')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">OpenAI</button></li>
                <li><button onClick={() => scrollTo('anthropic')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Anthropic</button></li>
                <li><button onClick={() => scrollTo('gemini')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Google GenAI</button></li>
                <li><button onClick={() => scrollTo('groq')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Groq</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest mb-unit">Servers</h4>
              <ul className="flex flex-col gap-2 border-l-2 border-surface-container ml-2 pl-4">
                <li><button onClick={() => scrollTo('express')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary text-left">Express Middleware</button></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-stack-lg lg:p-16 max-w-4xl overflow-y-auto pb-48">
          <div className="prose prose-slate max-w-none">
            <h1 className="font-display-lg text-4xl text-primary mb-stack-md tracking-tight">Documentation</h1>
            <p className="font-body-base text-body-base text-on-surface-variant text-lg mb-stack-lg">
              Learn how to integrate LLM Lens into your agentic architecture to unlock sub-millisecond UDP telemetry.
            </p>

            <hr className="border-outline-variant my-stack-lg" />

            {/* Quickstart */}
            <section ref={refs.quickstart} id="quickstart" className="mb-section-gap">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Quickstart</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Initialize the SDK at the top of your application. All adapters rely on this global initialization.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ initAutopilot }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/><br/>
                  <span className="text-on-tertiary-fixed-variant">{"// Run this before any LLM calls"}</span><br/>
                  initAutopilot({"{"} serviceName: <span className="text-[#a53b22]">'my-production-agent'</span> {"}"});
                </code>
              </div>
            </section>

            <section ref={refs.daemon} id="daemon" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Daemon Setup</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Ensure the local UDP daemon is running to collect telemetry efficiently without blocking your application.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>npx llm-lens daemon</code>
              </div>
            </section>

            {/* Adapters */}
            <section ref={refs.vercel} id="vercel" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Vercel AI SDK</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Wrap the raw `generateText` function to automatically trace prompts, outputs, and tool calls.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ wrapVercelAI }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> {"{ generateText as rawGenerateText }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'ai'</span>;<br/><br/>
                  <span className="text-secondary">const</span> generateText = wrapVercelAI(rawGenerateText);
                </code>
              </div>
            </section>

            <section ref={refs.langchain} id="langchain" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">LangChain</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Use the LangChainTracer as a callback handler for your LLMs and chains.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ LangChainTracer }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> {"{ ChatOpenAI }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'@langchain/openai'</span>;<br/><br/>
                  <span className="text-secondary">const</span> tracer = <span className="text-secondary">new</span> LangChainTracer();<br/>
                  <span className="text-secondary">const</span> model = <span className="text-secondary">new</span> ChatOpenAI({"{"} callbacks: [tracer] {"}"});
                </code>
              </div>
            </section>

            <section ref={refs.llamaindex} id="llamaindex" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">LlamaIndex</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Mount the native tracer to LlamaIndex's global callback manager to trace your entire RAG pipeline.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ LlamaIndexTracer }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> {"{ Settings }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llamaindex'</span>;<br/><br/>
                  <span className="text-secondary">const</span> tracer = <span className="text-secondary">new</span> LlamaIndexTracer();<br/>
                  Settings.callbackManager.on(<span className="text-[#a53b22]">'llm-start'</span>, tracer.onLLMStart.bind(tracer));<br/>
                  Settings.callbackManager.on(<span className="text-[#a53b22]">'llm-end'</span>, tracer.onLLMEnd.bind(tracer));
                </code>
              </div>
            </section>

            <section ref={refs.openai} id="openai" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">OpenAI Raw Client</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Intercept underlying OpenAI API methods natively.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ wrapOpenAI }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> OpenAI <span className="text-secondary">from</span> <span className="text-[#a53b22]">'openai'</span>;<br/><br/>
                  <span className="text-secondary">const</span> openai = wrapOpenAI(<span className="text-secondary">new</span> OpenAI());
                </code>
              </div>
            </section>

            <section ref={refs.anthropic} id="anthropic" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Anthropic Raw Client</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Intercept underlying Anthropic API methods natively.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ wrapAnthropic }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> Anthropic <span className="text-secondary">from</span> <span className="text-[#a53b22]">'@anthropic-ai/sdk'</span>;<br/><br/>
                  <span className="text-secondary">const</span> claude = wrapAnthropic(<span className="text-secondary">new</span> Anthropic());
                </code>
              </div>
            </section>

            <section ref={refs.gemini} id="gemini" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Google GenAI</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Intercept underlying Google GenAI API methods natively.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ wrapGemini }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> {"{ GoogleGenAI }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'@google/genai'</span>;<br/><br/>
                  <span className="text-secondary">const</span> gemini = wrapGemini(<span className="text-secondary">new</span> GoogleGenAI());
                </code>
              </div>
            </section>

            <section ref={refs.groq} id="groq" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Groq Raw Client</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Intercept underlying Groq API methods natively.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ wrapGroq }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> Groq <span className="text-secondary">from</span> <span className="text-[#a53b22]">'groq-sdk'</span>;<br/><br/>
                  <span className="text-secondary">const</span> groq = wrapGroq(<span className="text-secondary">new</span> Groq());
                </code>
              </div>
            </section>

            <section ref={refs.express} id="express" className="mb-section-gap pt-stack-lg border-t border-outline-variant">
              <h2 className="font-headline-lg text-2xl text-primary mb-stack-md">Express Middleware</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-stack-md">
                Trace HTTP latency alongside LLM calls to measure true end-to-end user request time.
              </p>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 font-label-code text-label-code overflow-x-auto text-on-surface mb-stack-md">
                <code>
                  <span className="text-secondary">import</span> {"{ expressAutopilot }"} <span className="text-secondary">from</span> <span className="text-[#a53b22]">'llm-lens-sdk'</span>;<br/>
                  <span className="text-secondary">import</span> express <span className="text-secondary">from</span> <span className="text-[#a53b22]">'express'</span>;<br/><br/>
                  <span className="text-secondary">const</span> app = express();<br/>
                  app.use(expressAutopilot());
                </code>
              </div>
            </section>
            
          </div>
        </main>
      </div>
    </div>
  );
}
