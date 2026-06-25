import { LayoutDashboard, ListTree, Lightbulb, PieChart, Database, ActivitySquare, ShieldAlert, Settings } from "lucide-react";

export type SectionTab = 'overview' | 'tracing' | 'insights' | 'visualizations' | 'memory';

interface SidebarProps {
  activeTab: SectionTab;
  onSelectTab: (tab: SectionTab) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ activeTab, onSelectTab, onOpenSettings }: SidebarProps) {
  const tabs = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'tracing', icon: ListTree, label: 'Traces' },
    { id: 'insights', icon: Lightbulb, label: 'AI Insights' },
    { id: 'visualizations', icon: PieChart, label: 'Analytics' },
    { id: 'memory', icon: Database, label: 'Memory' },
  ];

  return (
    <div className="w-[60px] md:w-[220px] h-full flex flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)] z-20 shrink-0 shadow-lg relative">
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
        <ActivitySquare className="w-6 h-6 text-[var(--color-blue)] shrink-0" />
        <div className="flex-col hidden md:flex">
          <span className="font-bold text-sm tracking-tight text-[var(--color-content)]">LLM Lens</span>
          <span className="text-[10px] text-[var(--color-muted)]">Autonomous Tracing</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        <div className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id as SectionTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative ${
                activeTab === t.id 
                  ? "bg-[var(--color-blue)]/10 text-[var(--color-blue)]" 
                  : "text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-content)]"
              }`}
              title={t.label}
            >
              <t.icon className={`w-5 h-5 shrink-0 ${activeTab === t.id ? "text-[var(--color-blue)]" : ""}`} />
              <span className="text-sm font-medium hidden md:inline">{t.label}</span>
              {activeTab === t.id && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--color-blue)] rounded-r-md md:hidden" />
              )}
            </button>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="hidden md:flex flex-col gap-2 p-3 bg-[var(--color-red)]/5 border border-[var(--color-red)]/10 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-[var(--color-red)]">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold">Local Priority</span>
          </div>
          <span className="text-[10px] text-[var(--color-muted)] leading-tight">Data stays on your machine.</span>
        </div>
        <ShieldAlert className="w-5 h-5 text-[var(--color-red)] mx-auto md:hidden mb-4" />
        
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-content)] transition-colors text-sm font-medium group"
          title="Settings"
        >
          <Settings className="w-5 h-5 shrink-0 transition-colors" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
