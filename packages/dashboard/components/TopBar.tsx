"use client";

import { useState, useEffect } from "react";

interface TopBarProps {
  healthScore: number;
  connected: boolean;
  windowEnd: number;
  onOpenSettings: () => void;
}

export default function TopBar({ healthScore, connected, windowEnd, onOpenSettings }: TopBarProps) {
  const [timeLeft, setTimeLeft] = useState("");

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
    healthScore >= 80 ? "#4ade80" :
    healthScore >= 60 ? "#eab308" :
    healthScore >= 40 ? "#f97316" : "#ef4444";

  return (
    <div
      id="topbar"
      className="flex items-center justify-between px-5"
      style={{ height: 48, background: "#111", borderBottom: "1px solid #1a1a1a" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-white">🔭 llm-lens</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: "#333", color: "#888" }}
        >
          v0.1.0
        </span>
      </div>

      {/* Center — Health Score */}
      <div className="flex flex-col items-center">
        {healthScore >= 0 ? (
          <>
            <span className="text-2xl font-bold leading-none" style={{ color: scoreColor }}>
              {healthScore}
            </span>
            <span className="text-[10px]" style={{ color: "#555" }}>health score</span>
          </>
        ) : (
          <span className="text-xs" style={{ color: "#555" }}>Awaiting first analysis...</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-xs" style={{ color: "#666" }}>
          Next analysis in: <span className="text-white font-mono">{timeLeft}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: connected ? "#4ade80" : "#ef4444" }}
          />
          <span className="text-xs" style={{ color: connected ? "#4ade80" : "#ef4444" }}>
            {connected ? "Live" : "Reconnecting..."}
          </span>
        </div>
        <button
          id="settings-btn"
          onClick={onOpenSettings}
          className="text-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: "none", border: "none", color: "#666" }}
          title="Settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
