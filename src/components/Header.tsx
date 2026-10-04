import React from 'react';
import { Plus, Printer, ShieldCheck, LogIn, LogOut, Cloud, FileText, FileCheck2, Database, LayoutDashboard, Building2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'dashboard' | 'projects' | 'generator' | 'audit' | 'settings';
  onTabChange: (tab: 'dashboard' | 'projects' | 'generator' | 'audit' | 'settings') => void;
  onNewProject: () => void;
  onBatchPrint: () => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  isCloudSynced: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewProject,
  onBatchPrint,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  isCloudSynced
}) => {
  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Anchor & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('generator')}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            title="Kembali ke Dokumen Studio SI-BAPHP"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs group-hover:bg-blue-600 transition-colors">
              <FileCheck2 className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  SI-BAPHP
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded border border-slate-200 hidden sm:inline">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block leading-none">
                Sistem Berita Acara & Pengadaan
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Tab Bar with Prominent Icons + Label + Microcopy) */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 h-16">
          <button
            onClick={() => onTabChange('generator')}
            className={`h-full px-3.5 flex items-center gap-2.5 transition-all cursor-pointer border-b-2 font-semibold ${
              activeTab === 'generator'
                ? 'text-blue-700 border-blue-700 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'generator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold text-[13px] tracking-tight whitespace-nowrap">
                Dokumen
              </span>
              <span className={`block text-[10px] font-medium mt-1 whitespace-nowrap ${
                activeTab === 'generator' ? 'text-blue-600' : 'text-slate-400'
              }`}>
                15 Berkas SPP-LS
              </span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('projects')}
            className={`h-full px-3.5 flex items-center gap-2.5 transition-all cursor-pointer border-b-2 font-semibold ${
              activeTab === 'projects'
                ? 'text-blue-700 border-blue-700 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'projects' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold text-[13px] tracking-tight whitespace-nowrap">
                Data Kontrak
              </span>
              <span className={`block text-[10px] font-medium mt-1 whitespace-nowrap ${
                activeTab === 'projects' ? 'text-blue-600' : 'text-slate-400'
              }`}>
                Daftar SPK & BAP
              </span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`h-full px-3.5 flex items-center gap-2.5 transition-all cursor-pointer border-b-2 font-semibold ${
              activeTab === 'dashboard'
                ? 'text-blue-700 border-blue-700 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold text-[13px] tracking-tight whitespace-nowrap">
                Ringkasan
              </span>
              <span className={`block text-[10px] font-medium mt-1 whitespace-nowrap ${
                activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'
              }`}>
                Statistik Realisasi
              </span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`h-full px-3.5 flex items-center gap-2.5 transition-all cursor-pointer border-b-2 font-semibold ${
              activeTab === 'audit'
                ? 'text-blue-700 border-blue-700 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'audit' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold text-[13px] tracking-tight whitespace-nowrap">
                Audit
              </span>
              <span className={`block text-[10px] font-medium mt-1 whitespace-nowrap ${
                activeTab === 'audit' ? 'text-blue-600' : 'text-slate-400'
              }`}>
                Pemeriksaan Legal
              </span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`h-full px-3.5 flex items-center gap-2.5 transition-all cursor-pointer border-b-2 font-semibold ${
              activeTab === 'settings'
                ? 'text-blue-700 border-blue-700 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold text-[13px] tracking-tight whitespace-nowrap">
                Pengaturan
              </span>
              <span className={`block text-[10px] font-medium mt-1 whitespace-nowrap ${
                activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'
              }`}>
                Logo & Kop Dinas
              </span>
            </div>
          </button>
        </nav>

        {/* Zone 3: User Profile & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Account Capsule */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 pr-1 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-bold">
                {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
              </div>
              <span className="text-[11.5px] font-medium text-slate-700 max-w-[140px] truncate hidden xl:inline">
                {currentUser.email}
              </span>
              <button
                onClick={onSignOut}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Keluar Akun Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Google Login</span>
            </button>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Primary Action CTA Button (Icon + Label + Caption) */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer hover:shadow-xs active:scale-98"
            title="Tambah atau buat paket kontrak pekerjaan baru"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <Plus className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-bold tracking-tight text-[12.5px]">Kontrak Baru</span>
              <span className="block text-[9.5px] text-blue-300 font-medium mt-0.5">+ Berkas SPK</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="flex md:hidden border-t border-slate-100 px-3 py-1.5 bg-slate-50 overflow-x-auto gap-1 text-xs">
        {(['generator', 'projects', 'dashboard', 'audit', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1 whitespace-nowrap rounded-lg font-medium transition-colors ${
              activeTab === tab ? 'bg-white font-bold text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'generator' && 'Dokumen'}
            {tab === 'projects' && 'Data Kontrak'}
            {tab === 'dashboard' && 'Ringkasan'}
            {tab === 'audit' && 'Audit'}
            {tab === 'settings' && 'Pengaturan'}
          </button>
        ))}
      </div>
    </header>
  );
};


