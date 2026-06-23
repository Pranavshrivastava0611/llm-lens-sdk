export type SectionTab = 'overview' | 'tracing' | 'insights' | 'visualizations';

interface SidebarProps {
  activeTab: SectionTab;
  onSelectTab: (tab: SectionTab) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ activeTab, onSelectTab, onOpenSettings }: SidebarProps) {
  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'tracing', icon: '📡', label: 'Tracing' },
    { id: 'visualizations', icon: '📈', label: 'Visualizations' },
    { id: 'insights', icon: '🧠', label: 'AI Reports' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[60px] md:static md:w-[60px] lg:w-[220px] md:h-full flex-shrink-0 bg-[#0a0a0a] border-t md:border-r md:border-t-0 border-[#1a1a1a] flex flex-row md:flex-col justify-between transition-all overflow-hidden z-50">
      <div className="flex flex-row md:flex-col flex-1">
        {/* Logo Area */}
        <div className="h-[60px] md:h-[48px] flex items-center justify-center md:justify-start px-3 md:px-4 md:border-b md:border-[#1a1a1a] md:mb-4">
          <span className="text-sm font-bold text-white hidden lg:inline">🔭 llm-lens</span>
          <span className="text-xl md:hidden lg:hidden">🔭</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-row md:flex-col gap-1 md:px-2 flex-1 items-center justify-around md:justify-start overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as SectionTab)}
                className={`flex items-center gap-3 px-3 py-2 md:w-full justify-center md:justify-start rounded-md transition-colors text-sm font-medium flex-shrink-0 ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                    : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc] border border-transparent'
                }`}
              >
                <span className="text-xl md:text-lg leading-none">{tab.icon}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="p-2 md:border-t md:border-[#1a1a1a] flex items-center justify-center">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc] transition-colors text-sm font-medium"
        >
          <span className="text-xl md:text-lg leading-none">⚙️</span>
          <span className="hidden lg:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
