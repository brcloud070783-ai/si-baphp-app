import React from 'react';
import { 
  FileText, 
  Database, 
  LayoutDashboard, 
  ShieldCheck, 
  Building2, 
  Plus 
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'dashboard' | 'projects' | 'generator' | 'audit' | 'settings';
  onTabChange: (tab: 'dashboard' | 'projects' | 'generator' | 'audit' | 'settings') => void;
  onNewProject: () => void;
  auditScore?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onNewProject,
  auditScore = 100
}) => {
  const navItems = [
    {
      id: 'generator' as const,
      label: 'Dokumen',
      caption: '15 Berkas',
      icon: FileText,
    },
    {
      id: 'projects' as const,
      label: 'Data Kontrak',
      caption: 'Database',
      icon: Database,
    },
    {
      id: 'dashboard' as const,
      label: 'Ringkasan',
      caption: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'audit' as const,
      label: 'Audit',
      caption: `${auditScore}% Sah`,
      icon: ShieldCheck,
    },
    {
      id: 'settings' as const,
      label: 'Pengaturan',
      caption: 'Kop Dinas',
      icon: Building2,
    },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-1.5 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5.5 h-5.5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold leading-tight tracking-tight">{item.label}</span>
              <span className={`text-[9px] leading-tight ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                {item.caption}
              </span>
            </button>
          );
        })}

        {/* Primary CTA Floating Center Button */}
        <button
          onClick={onNewProject}
          className="flex flex-col items-center justify-center px-3.5 py-1.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 shrink-0 mx-1 cursor-pointer"
          title="Tambah Kontrak Baru"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs mb-0.5">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-extrabold tracking-tight leading-none text-white">+ Kontrak</span>
          <span className="text-[8.5px] text-blue-200 font-medium leading-none mt-0.5">
            Buat Berkas
          </span>
        </button>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5.5 h-5.5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold leading-tight tracking-tight">{item.label}</span>
              <span className={`text-[9px] leading-tight ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                {item.caption}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
