import React from 'react';
import { Search, Bell, UserPlus, Smartphone, Database, LayoutDashboard } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeView: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'student-pwa' | 'supabase-sql';
  setActiveView: (view: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'student-pwa' | 'supabase-sql') => void;
  onOpenNewStudentModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenNewStudentModal,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-[#171f33]/95 backdrop-blur-md border-b border-[#3c4a42]/40 z-40 px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86948a] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar aluno, exercício, carga ou WhatsApp..."
            className="w-full h-10 pl-10 pr-12 rounded-lg bg-[#0b1326] text-[#dae2fd] placeholder:text-[#86948a] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none text-sm transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
            <kbd className="font-mono-metric text-[10px] px-1.5 py-0.5 rounded bg-[#2d3449] border border-[#3c4a42]/50 text-[#bbcabf]">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Mode Switcher Pills (Personal Suite vs PWA Aluno vs Supabase SQL) */}
      <div className="hidden md:flex items-center bg-[#0b1326] p-1 rounded-xl border border-[#3c4a42]/40">
        <button
          onClick={() => setActiveView('trainer-students')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView.startsWith('trainer')
              ? 'bg-[#10b981] text-[#003824] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dae2fd]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Personal Trainer</span>
        </button>

        <button
          onClick={() => setActiveView('student-pwa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'student-pwa'
              ? 'bg-[#c0c1ff] text-[#1000a9] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dae2fd]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App Aluno (PWA)</span>
        </button>

        <button
          onClick={() => setActiveView('supabase-sql')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'supabase-sql'
              ? 'bg-[#ffb95f] text-[#472a00] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dae2fd]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQL & RLS</span>
        </button>
      </div>

      {/* Action Cluster */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <PWAInstallButton compact />

        <button
          onClick={onOpenNewStudentModal}
          className="flex items-center gap-1.5 h-9 px-3.5 bg-[#10b981] text-[#003824] rounded-lg text-xs font-semibold hover:bg-[#4edea3] transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">+ Novo Aluno</span>
          <span className="sm:hidden">+ Aluno</span>
        </button>

        <button
          className="relative p-2 rounded-lg text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-[#e29100] text-[#523200] font-mono-metric text-[9px] font-bold">
            3
          </span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3131c0] to-[#c0c1ff] flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
          RF
        </div>
      </div>
    </header>
  );
};
