"use client";

import { useState, useEffect } from "react";
import { Telescope, Clock, Wifi, WifiOff, HeartPulse, Settings, Moon, Sun } from "lucide-react";

interface TopBarProps {
  healthScore: number;
  connected: boolean;
  windowEnd: number;
  onOpenSettings: () => void;
}

export default function TopBar({ healthScore, connected, windowEnd, onOpenSettings }: TopBarProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, windowEnd - Date.now());
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowEnd]);

  const scoreColor =
    healthScore >= 80 ? "text-emerald-400" :
    healthScore >= 60 ? "text-amber-400" :
    healthScore >= 40 ? "text-orange-400" : "text-rose-500";

  return (
    <div
      id="topbar"
      className="flex items-center justify-between px-5 bg-[var(--color-bg)] border-b border-[var(--color-border)] h-14"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Telescope className="w-4 h-4 text-[var(--color-muted)] md:hidden" />
          <span className="text-sm font-bold tracking-tight text-[var(--color-content)] hidden md:inline">llm-lens</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]"
        >
          v0.1.0
        </span>
      </div>

      {/* Center — Health Score */}
      <div className="flex flex-col items-center justify-center">
        {healthScore >= 0 ? (
          <div className="flex items-center gap-2">
            <HeartPulse className={`w-5 h-5 ${scoreColor}`} />
            <div className="flex flex-col items-start leading-none">
              <span className={`text-xl font-bold tracking-tight ${scoreColor}`}>
                {healthScore}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-muted)]">System Health</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-[var(--color-dim)] font-medium">Awaiting first analysis...</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)]">
          <Clock className="w-3.5 h-3.5 text-[var(--color-dim)]" />
          <span>Next analysis:</span>
          <span className="text-[var(--color-content)] font-mono font-medium">{timeLeft}</span>
        </div>
        
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-[var(--color-green)]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[var(--color-red)]" />
          )}
          <span className={`text-xs font-medium ${connected ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
            {connected ? "Live" : "Reconnecting..."}
          </span>
        </div>
        
        <div className="flex gap-1 pl-2 border-l border-[var(--color-border)]">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-content)] hover:bg-[var(--color-hover)] rounded-md transition-all border border-transparent hover:border-[var(--color-border)]"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-content)] hover:bg-[var(--color-hover)] rounded-md transition-all border border-transparent hover:border-[var(--color-border)]"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
