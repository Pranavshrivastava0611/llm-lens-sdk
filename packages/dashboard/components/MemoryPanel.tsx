import { useState, useEffect } from "react";

interface Memory {
  id: number;
  type: string;
  content: string;
  confidence: string;
  isRecurring: boolean;
  metric?: string;
  tags: string[];
  serviceName: string;
  reinforceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export default function MemoryPanel({ serviceName }: { serviceName: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
    const interval = setInterval(fetchMemories, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [serviceName]);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`http://localhost:7777/memory/service/${serviceName}`);
      if (!res.ok) throw new Error("Failed to load memories");
      const data = await res.json();
      setMemories(data.memories);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('http://localhost:7777/memory/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, description: 'Exported from dashboard' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Trigger download
      const a = document.createElement('a');
      a.href = `http://localhost:7777${data.downloadUrl}`;
      a.download = `llm-lens-memory-${data.bundle.bundleId.slice(0,8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Export failed: " + err);
    }
  };

  if (loading) {
    return <div className="p-4 text-xs" style={{ color: "#888" }}>Loading memory context...</div>;
  }

  if (error) {
    return <div className="p-4 text-xs text-red-500">Error: {error}</div>;
  }

  const recurring = memories.filter(m => m.isRecurring);
  const errors = memories.filter(m => m.type === 'error_signature');
  const improvements = memories.filter(m => m.type === 'improvement');
  
  // Group rest by type for general display
  const otherTypes = ['model_behavior', 'cost_pattern', 'latency_pattern', 'regression'];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#111", border: "1px solid #222", borderRadius: "12px" }}>
      <div className="flex-none p-3 flex justify-between items-center" style={{ borderBottom: "1px solid #222" }}>
        <div>
          <h2 className="text-xs font-bold tracking-wider text-white uppercase">Long-Term Memory</h2>
          <div className="text-[10px]" style={{ color: "#888" }}>
            {memories.length} memories · {recurring.length} recurring
          </div>
        </div>
        <button
          onClick={handleExport}
          className="px-3 py-1 rounded text-[10px] font-semibold bg-[#222] hover:bg-[#333] transition-colors"
          style={{ color: "#ccc", border: "1px solid #444" }}
        >
          Export Bundle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 text-xs" style={{ scrollbarWidth: "thin" }}>
        {memories.length === 0 && (
          <div className="text-center py-8" style={{ color: "#666" }}>
            No memories extracted yet. Let the agent analyze a few windows!
          </div>
        )}

        {recurring.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <span className="text-blue-400">🔄</span> Recurring Patterns
            </h3>
            <ul className="flex flex-col gap-1.5 pl-5">
              {recurring.map(m => (
                <li key={m.id} className="list-disc" style={{ color: "#ccc" }}>
                  <span className="text-white">{m.content}</span>
                  {m.metric && <span className="ml-1" style={{ color: "#888" }}>({m.metric})</span>}
                  <span className="ml-1 text-[10px]" style={{ color: "#555" }}>[seen {m.reinforceCount}x]</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <span className="text-red-400">🐛</span> Error Signatures
            </h3>
            <ul className="flex flex-col gap-1.5 pl-5">
              {errors.map(m => (
                <li key={m.id} className="list-disc" style={{ color: "#ccc" }}>
                  <span className="text-red-200">{m.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <span className="text-green-400">✅</span> Improvements
            </h3>
            <ul className="flex flex-col gap-1.5 pl-5">
              {improvements.map(m => (
                <li key={m.id} className="list-disc" style={{ color: "#ccc" }}>
                  <span className="text-green-200">{m.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {otherTypes.map(t => {
          const group = memories.filter(m => m.type === t && !m.isRecurring);
          if (group.length === 0) return null;
          return (
            <div key={t}>
              <h3 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wide" style={{ color: "#888" }}>
                {t.replace('_', ' ')}
              </h3>
              <ul className="flex flex-col gap-1.5 pl-5">
                {group.map(m => (
                  <li key={m.id} className="list-disc" style={{ color: "#ccc" }}>
                    {m.content}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
