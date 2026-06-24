"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Code, MessageCircle, MessageSquare, ArrowRight, Menu, X } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: any) => void;
}

export function TopNavBar({ currentView, setCurrentView }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Documentation', value: 'docs' },
    { label: 'Community', value: 'community' },
    { label: 'Sandbox Dashboard', value: 'dashboard' },
  ];

  return (
    <>
      <nav
        id="top-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'h-16 bg-white/95 backdrop-blur-md shadow-sm border-neutral-200'
            : 'h-20 bg-white border-transparent'
        } flex items-center justify-between px-6 md:px-12 w-full`}
      >
        <div className="flex items-center gap-10">
          {/* Logo */}
          <button
            id="logo-button"
            onClick={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg spectrum-gradient text-white shadow-sm">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tighter text-black group-hover:opacity-80 transition-opacity">
              LLM Lens
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.value}
                id={`nav-${item.value}`}
                onClick={() => {
                  setCurrentView(item.value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`font-sans text-sm font-medium transition-colors cursor-pointer ${
                  currentView === item.value
                    ? 'text-black border-b-2 border-black pb-1 pt-1'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            id="login-btn-desktop"
            onClick={() => setCurrentView('dashboard')}
            className="font-sans text-xs font-semibold uppercase tracking-wider text-black border border-neutral-200 hover:bg-neutral-50 px-5 py-2.5 transition-all cursor-pointer rounded-sm"
          >
            Log In
          </button>
          <button
            id="get-started-btn-desktop"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-widest text-white bg-black hover:bg-neutral-800 px-5 py-3 transition-transform active:scale-[0.98] cursor-pointer rounded-sm"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          id="mobile-menu-trigger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-neutral-600 hover:text-black"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-neutral-200 shadow-lg px-6 py-8 flex flex-col gap-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  id={`nav-mobile-${item.value}`}
                  onClick={() => {
                    setCurrentView(item.value);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left font-sans text-base font-semibold py-2 ${
                    currentView === item.value ? 'text-black border-l-4 border-black pl-3' : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-6 flex flex-col gap-3">
              <button
                id="login-btn-mobile"
                onClick={() => {
                  setCurrentView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center font-sans text-xs font-semibold uppercase tracking-wider text-black border border-neutral-200 py-3 rounded-sm"
              >
                Log In
              </button>
              <button
                id="get-started-btn-mobile"
                onClick={() => {
                  setCurrentView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center font-sans text-xs font-semibold uppercase tracking-widest text-white bg-black py-3 rounded-sm"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Footer({ setCurrentView }: { setCurrentView: (view: any) => void }) {
  return (
    <footer
      id="app-footer"
      className="w-full py-10 px-8 bg-white border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center max-w-full mx-auto"
    >
      <div className="flex flex-col gap-1 items-center md:items-start mb-6 md:mb-0">
        <button
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xl font-bold tracking-tighter text-black flex items-center gap-1.5"
        >
          <div className="w-5 h-5 rounded spectrum-gradient flex items-center justify-center text-white">
            <Activity className="w-3 h-3" />
          </div>
          LLM Lens
        </button>
        <p className="font-sans text-xs text-neutral-400 mt-1">
          © 2026 LLM Lens. Observability for the agentic era.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-neutral-400 hover:text-brand-orange transition-colors flex items-center gap-1">
          <MessageCircle className="w-3 h-3" /> Twitter
        </a>
        <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-neutral-400 hover:text-brand-purple transition-colors flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Discord
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-neutral-400 hover:text-black transition-colors flex items-center gap-1">
          <Code className="w-3 h-3" /> GitHub
        </a>
        <button onClick={() => alert("Privacy Policy Details: In client-side sandbox mode, no personal identifier information (PII) is transferred. LLM Lens operates local-first tracing.")} className="font-sans text-xs text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer">
          Privacy
        </button>
        <button onClick={() => alert("Terms of Service: By evaluating the sandbox dashboard, you accept our standard trial usage limits.")} className="font-sans text-xs text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer">
          Terms
        </button>
      </div>
    </footer>
  );
}
