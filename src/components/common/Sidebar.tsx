import React from 'react';
import { Users, Dumbbell, SplitSquareVertical, BarChart3, Settings, ShieldCheck, Smartphone, Database } from 'lucide-react';
import { CURRENT_TRAINER } from '../../data/mockData';

interface SidebarProps {
  activeView: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'student-pwa' | 'supabase-sql';
  setActiveView: (view: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'student-pwa' | 'supabase-sql') => void;
  studentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, studentCount }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#171f33] border-r border-[#3c4a42]/50 z-50 hidden lg:flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-[#3c4a42]/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#4edea3] flex items-center justify-center shadow-lg shadow-[#10b981]/20 flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-[#003824]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-[#dae2fd] tracking-tight leading-tight">TrainerPro</span>
            <span className="font-mono-metric text-[10px] text-[#4edea3] font-semibold tracking-wider uppercase">
              Suite B2B & PWA
            </span>
          </div>
        </div>

        {/* Workspace Label */}
        <div className="px-4 pt-4 pb-2">
          <span className="font-mono-metric text-[11px] uppercase tracking-wider text-[#86948a] font-semibold">
            Workspace Gestão
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 px-2.5">
          <button
            onClick={() => setActiveView('trainer-students')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              activeView === 'trainer-students'
                ? 'bg-[#10b981] text-[#00422b] font-semibold shadow-md'
                : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Alunos & Assinaturas</span>
            </div>
            <span
              className={`font-mono-metric text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                activeView === 'trainer-students'
                  ? 'bg-[#00422b]/20 text-[#00422b]'
                  : 'bg-[#2d3449] text-[#4edea3] group-hover:bg-[#10b981]/20'
              }`}
            >
              {studentCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('trainer-builder')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              activeView === 'trainer-builder'
                ? 'bg-[#10b981] text-[#00422b] font-semibold shadow-md'
                : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center gap-3">
              <SplitSquareVertical className="w-4 h-4" />
              <span>Prescritor & IA</span>
            </div>
            <span className="font-mono-metric text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#3131c0]/40 text-[#c0c1ff] font-bold">
              Copiloto
            </span>
          </button>

          <button
            onClick={() => setActiveView('trainer-analytics')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              activeView === 'trainer-analytics'
                ? 'bg-[#10b981] text-[#00422b] font-semibold shadow-md'
                : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Relatório & Cargas</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          </button>

          <div className="my-2 border-t border-[#3c4a42]/40 mx-2"></div>

          {/* Direct view switchers */}
          <button
            onClick={() => setActiveView('student-pwa')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === 'student-pwa'
                ? 'bg-[#c0c1ff] text-[#1000a9] font-semibold shadow-md'
                : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#c0c1ff]" />
              <span>Simulador PWA Aluno</span>
            </div>
            <span className="font-mono-metric text-[10px] px-1.5 py-0.5 rounded bg-[#3131c0]/30 text-[#c0c1ff]">
              Mobile
            </span>
          </button>

          <button
            onClick={() => setActiveView('supabase-sql')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === 'supabase-sql'
                ? 'bg-[#ffb95f] text-[#472a00] font-semibold shadow-md'
                : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#ffb95f]" />
              <span>Supabase Schema & RLS</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-[#ffb95f]" />
          </button>
        </nav>
      </div>

      {/* Bottom widgets & Profile */}
      <div className="flex flex-col border-t border-[#3c4a42]/40 p-2.5">
        {/* Roster capacity meter */}
        <div className="p-3 bg-[#131b2e]/90 rounded-xl border border-[#3c4a42]/40 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#bbcabf] font-medium">Lotação do Roster</span>
            <span className="font-mono-metric text-xs text-[#4edea3] font-bold">
              {Math.round((studentCount / 50) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#2d3449] rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] to-[#4edea3] rounded-full transition-all duration-500"
              style={{ width: `${(studentCount / 50) * 100}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-[#86948a]">
            {studentCount} de 50 Vagas Utilizadas
          </p>
        </div>

        {/* Coach badge */}
        <div className="p-2.5 flex items-center gap-3 bg-[#131b2e] rounded-xl border border-[#3c4a42]/40">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#3131c0] flex items-center justify-center text-xs font-bold text-white">
              RF
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4edea3] rounded-full border-2 border-[#171f33]"></span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-[#dae2fd] truncate">Rodrigo Fontes</span>
              <span className="font-mono-metric text-[9px] px-1.5 py-0.2 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 uppercase font-bold leading-tight">
                PRO
              </span>
            </div>
            <span className="font-mono-metric text-[10px] text-[#86948a] truncate">{CURRENT_TRAINER.cref}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
