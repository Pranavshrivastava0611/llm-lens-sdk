"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopNavBar, Footer } from '../components/Navigation';
import LandingPage from '../components/LandingPage';
import Dashboard from '../components/Dashboard';
import Community from '../components/Community';
import Docs from '../components/Docs';
import { TraceSession } from '../types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'community' | 'docs'>('landing');
  const [activeSession, setActiveSession] = useState<TraceSession | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage 
              setCurrentView={setCurrentView} 
              setActiveSession={(session) => {
                setActiveSession(session);
                setCurrentView('dashboard');
              }} 
            />
          </motion.div>
        );
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard 
              activeSession={activeSession}
              setActiveSession={setActiveSession}
            />
          </motion.div>
        );
      case 'community':
        return (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Community setCurrentView={setCurrentView} />
          </motion.div>
        );
      case 'docs':
        return (
          <motion.div
            key="docs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Docs setCurrentView={setCurrentView} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-brand-orange/20 selection:text-neutral-900">
      {/* Universal Sticky Top Navigation */}
      <TopNavBar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Container with Page Route Animate transitions */}
      <main className="flex-grow pt-8">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      {/* Universal Footer */}
      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}
