import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Smartphone, 
  Database, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Award,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PersonalTrainer } from '../../types/database';

interface HeaderProps {
  activeView: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'trainer-profile' | 'student-pwa' | 'supabase-sql';
  setActiveView: (view: 'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'trainer-profile' | 'student-pwa' | 'supabase-sql') => void;
  onOpenNewStudentModal?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  trainer: PersonalTrainer;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  trainer,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setShowLogoutToast(true);
    if (onLogout) {
      onLogout();
    } else {
      setActiveView('trainer-students');
    }
    setTimeout(() => {
      setShowLogoutToast(false);
    }, 4000);
  };

  return (
    <>
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
            <span>Painel Personal</span>
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
            className="relative p-2 rounded-lg text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-[#e29100] text-[#523200] font-mono-metric text-[9px] font-bold">
              3
            </span>
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer shadow-md ${
                isProfileMenuOpen || activeView === 'trainer-profile'
                  ? 'border-[#4edea3] ring-2 ring-[#10b981]/30 scale-105'
                  : 'border-[#10b981] hover:scale-105'
              }`}
              title="Menu do Perfil"
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
            >
              <img
                src={trainer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={trainer.full_name}
                className="w-full h-full object-cover"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#171f33] border border-[#3c4a42]/60 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                {/* Trainer Info Header */}
                <div className="px-4 py-3 border-b border-[#3c4a42]/40 bg-[#0b1326]/40">
                  <div className="flex items-center gap-3">
                    <img
                      src={trainer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={trainer.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#10b981]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#dae2fd] truncate">
                        {trainer.full_name}
                      </p>
                      <p className="text-[11px] text-[#86948a] truncate">
                        {trainer.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono-metric text-[9px] bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.2 rounded border border-[#10b981]/30 font-semibold flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          CREF {trainer.cref}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Options: Meu Perfil & Sair */}
                <div className="p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('trainer-profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      activeView === 'trainer-profile'
                        ? 'bg-[#10b981] text-[#003824]'
                        : 'text-[#dae2fd] hover:bg-[#222a3d] hover:text-[#4edea3]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="border-t border-[#3c4a42]/30 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#ffb4ab] hover:bg-[#93000a]/20 hover:text-[#ffb4ab] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-[#ffb4ab]" />
                      <span>Sair</span>
                    </div>
                    <span className="text-[10px] font-mono-metric text-[#ffb4ab]/70 uppercase">Desconectar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#171f33] border border-[#3c4a42]/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#dae2fd]">Deseja sair da sua conta?</h3>
              <p className="text-xs text-[#bbcabf] leading-relaxed">
                Você será desconectado da sessão de <strong>{trainer.full_name}</strong> ({trainer.brand_name}).
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0b1326] text-[#bbcabf] hover:text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#ff5449] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification after Logout */}
      {showLogoutToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10b981] text-[#003824] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-bottom-3 fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sessão de Personal encerrada com sucesso!</span>
        </div>
      )}
    </>
  );
};
