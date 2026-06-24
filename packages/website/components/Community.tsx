"use client";
import { motion } from 'motion/react';
import { Code, MessageSquare, Star, GitMerge, ArrowRight } from 'lucide-react';

interface CommunityProps {
  setCurrentView: (view: any) => void;
}

export default function Community({ setCurrentView }: CommunityProps) {
  return (
    <div className="relative w-full min-h-screen bg-neutral-50 pt-12 pb-24 border-t border-neutral-200">
      <div className="px-6 md:px-12 max-w-[1440px] mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <span className="bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest font-mono font-bold rounded-full flex items-center gap-2">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Free & Open Source
            </span>
          </div>
          <h2 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
            Built for the Community
          </h2>
          <p className="font-sans text-base text-neutral-500 leading-relaxed">
            LLM Lens is a 100% free and open-source observability platform. We believe that tracing complex AI agents should be accessible to every developer without paywalls or usage limits.
          </p>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-neutral-100 text-black rounded-full flex items-center justify-center mb-6">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-sans text-neutral-900 mb-2">Source Code</h3>
            <p className="text-sm font-sans text-neutral-500 mb-6">
              Access the complete source code, review architectural decisions, and run the entire telemetry stack locally.
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold font-sans text-black hover:underline">
              View on GitHub <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-sans text-neutral-900 mb-2">Discord Community</h3>
            <p className="text-sm font-sans text-neutral-500 mb-6">
              Join hundreds of AI engineers discussing agent architectures, debugging traces, and sharing custom hooks.
            </p>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold font-sans text-brand-purple hover:underline">
              Join Server <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mb-6">
              <GitMerge className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-sans text-neutral-900 mb-2">Contribute</h3>
            <p className="text-sm font-sans text-neutral-500 mb-6">
              Help us expand our native adapters! We welcome PRs for new vector databases, LLM providers, and frameworks.
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold font-sans text-brand-orange hover:underline">
              Read Guidelines <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
