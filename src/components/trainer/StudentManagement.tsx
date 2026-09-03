import React, { useState, useMemo } from 'react';
import { Student, PlanTier } from '../../types/database';
import { 
  Users, 
  Dumbbell, 
  AlertTriangle, 
  Lock, 
  Calendar, 
  Search, 
  FileDown, 
  UserPlus, 
  Edit3, 
  TrendingUp, 
  Key, 
  MessageSquare, 
  MoreVertical, 
  CheckCircle, 
  X, 
  Send,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: (newStudent: Partial<Student>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onViewAnalytics: (student: Student) => void;
  onEditWorkout: (student: Student) => void;
  onSimulateAsStudent: (student: Student) => void;
  isNewStudentModalOpen: boolean;
  setIsNewStudentModalOpen: (open: boolean) => void;
  searchQuery: string;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onSelectStudent,
  onAddStudent,
  onUpdateStudent,
  onViewAnalytics,
  onEditWorkout,
  onSimulateAsStudent,
  isNewStudentModalOpen,
  setIsNewStudentModalOpen,
  searchQuery,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'expiring' | 'blocked'>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'expiration-asc' | 'name-asc' | 'recent-workout'>('expiration-asc');

  // Form State for Modal
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan_tier: 'trimestral' as PlanTier,
    plan_name: 'Trimestral VIP',
    goal: 'Hipertrofia com Definição',
    age: 28,
    weight_kg: 80,
    start_date: new Date().toISOString().split('T')[0],
    access_expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    auto_lock: true,
  });

  const [createdStudentLink, setCreatedStudentLink] = useState<{ name: string; phone: string; link: string } | null>(null);

  // Helper to compute expiration stats
  const getStudentAccessInfo = (student: Student) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(student.access_expiration_date);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isExpired = diffDays < 0;
    const isBlocked = (isExpired && student.auto_lock) || !student.is_active;
    const isExpiring = !isBlocked && diffDays >= 0 && diffDays <= 5;
    
    return {
      diffDays,
      isExpired,
      isBlocked,
      isExpiring,
      status: isBlocked ? 'blocked' : isExpiring ? 'expiring' : 'active'
    };
  };

  // KPIs
  const totalStudents = students.length;
  const activeStudents = students.filter(s => getStudentAccessInfo(s).status === 'active').length;
  const expiringStudents = students.filter(s => getStudentAccessInfo(s).status === 'expiring').length;
  const blockedStudents = students.filter(s => getStudentAccessInfo(s).status === 'blocked').length;

  // Filtering & Sorting
  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const info = getStudentAccessInfo(student);
        
        // Tab filter
        if (filterTab === 'active' && info.status !== 'active') return false;
        if (filterTab === 'expiring' && info.status !== 'expiring') return false;
        if (filterTab === 'blocked' && info.status !== 'blocked') return false;

        // Goal filter
        if (goalFilter !== 'all') {
          if (!student.goal.toLowerCase().includes(goalFilter.toLowerCase())) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = student.full_name.toLowerCase().includes(q);
          const matchesPhone = student.phone.includes(q);
          const matchesEmail = student.email.toLowerCase().includes(q);
          const matchesPlan = student.plan_name.toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesEmail && !matchesPlan) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiration-asc') {
          return new Date(a.access_expiration_date).getTime() - new Date(b.access_expiration_date).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.full_name.localeCompare(b.full_name);
        }
        return 0;
      });
  }, [students, filterTab, goalFilter, sortBy, searchQuery]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const newStudentData: Partial<Student> = {
      full_name: formData.full_name,
      email: formData.email || `${formData.full_name.toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
      phone: formData.phone || '+55 (11) 98765-4321',
      plan_tier: formData.plan_tier,
      plan_name: formData.plan_name,
      goal: formData.goal,
      age: Number(formData.age) || 28,
      weight_kg: Number(formData.weight_kg) || 75,
      weight_diff_kg: 0,
      access_expiration_date: formData.access_expiration_date,
      is_active: true,
      auto_lock: formData.auto_lock,
      cycle_info: 'Ciclo 1 • Início de Prescrição',
      last_workout_date: 'Aguardando 1º Treino',
      last_workout_name: 'Ficha Inicial Prescrita'
    };

    onAddStudent(newStudentData);

    // Generate simulated WhatsApp link
    const cleanPhone = formData.phone.replace(/\D/g, '') || '5511987654321';
    const appUrl = window.location.origin;
    const shareMessage = `Olá ${formData.full_name}! Seu acesso ao TrainerPro está liberado. Baixe o app ou abra pelo link: ${appUrl} (Válido até ${new Date(formData.access_expiration_date).toLocaleDateString('pt-BR')})`;
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`;

    setCreatedStudentLink({
      name: formData.full_name,
      phone: formData.phone,
      link: waLink,
    });
  };

  const handleQuickPresetDays = (days: number, tier: PlanTier, planName: string) => {
    const today = new Date();
    today.setDate(today.getDate() + days);
    setFormData((prev) => ({
      ...prev,
      plan_tier: tier,
      plan_name: planName,
      access_expiration_date: today.toISOString().split('T')[0],
    }));
  };

  const openWhatsApp = (student: Student, customMsg?: string) => {
    const cleanPhone = student.phone.replace(/\D/g, '');
    const msg = customMsg || `Olá ${student.full_name}, seu plano no TrainerPro está vencendo em breve (${new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}). Vamos renovar para não interromper seus treinos?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-metric text-xs uppercase tracking-wider text-[#4edea3] font-semibold bg-[#4edea3]/10 px-2.5 py-0.5 rounded-full">
              Roster Hub · Q4 2024
            </span>
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">
            Gestão de Alunos & Assinaturas
          </h1>
          <p className="text-sm text-[#bbcabf] mt-1">
            Monitoramento biomecânico, controle de adimplência e renovações automáticas via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                ["Nome,Telefone,Plano,Vencimento,Status", ...students.map(s => `"${s.full_name}","${s.phone}","${s.plan_name}","${s.access_expiration_date}","${getStudentAccessInfo(s).status}"`)].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `trainerpro_alunos_${new Date().toISOString().slice(0,10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] transition-colors text-sm font-semibold border border-[#3c4a42]/40"
          >
            <FileDown className="w-4 h-4 text-[#bbcabf]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setCreatedStudentLink(null);
              setIsNewStudentModalOpen(true);
            }}
            className="flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-[#10b981]/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Cadastrar / Renovar Aluno</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Grid KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Lotação */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between hover:bg-[#222a3d]/80 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#bbcabf] tracking-wider font-semibold">
                Lotação de Roster
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-3xl font-bold text-[#dae2fd]">{totalStudents}</span>
                <span className="font-mono-metric text-xs text-[#86948a]">/ 50 Vagas</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0b1326] flex items-center justify-center text-[#4edea3] border border-[#3c4a42]/40">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-2">
            <div className="w-full bg-[#0b1326] h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gradient-to-r from-[#10b981] to-[#4edea3] h-full rounded-full transition-all duration-500"
                style={{ width: `${(totalStudents / 50) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#86948a]">Capacidade</span>
              <span className="font-mono-metric text-[#4edea3] font-bold">
                {Math.round((totalStudents / 50) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Acessos Ativos */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between hover:bg-[#222a3d]/80 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#4edea3] tracking-wider font-semibold">
                Acessos Ativos
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-3xl font-bold text-[#4edea3]">{activeStudents}</span>
                <span className="text-xs text-[#bbcabf]">treinando</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#4edea3] font-mono-metric text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
              {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#bbcabf]">
            <TrendingUp className="w-4 h-4 text-[#4edea3]" />
            <span>Acesso integral às fichas e logs</span>
          </div>
        </div>

        {/* KPI 3: Vencendo em Breve */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between hover:bg-[#222a3d]/80 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#ffb95f] tracking-wider font-semibold">
                Vencendo ≤ 5 dias
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-3xl font-bold text-[#ffb95f]">
                  {expiringStudents < 10 ? `0${expiringStudents}` : expiringStudents}
                </span>
                <span className="text-xs text-[#86948a]">atenção</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] font-mono-metric text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-pulse"></span>
              Urgente
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-[#bbcabf]">R$ 1.350 em renovação</span>
            <button
              onClick={() => setFilterTab('expiring')}
              className="text-[#ffb95f] hover:underline font-mono-metric font-semibold"
            >
              Ver todos →
            </button>
          </div>
        </div>

        {/* KPI 4: Acesso Bloqueado */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between hover:bg-[#222a3d]/80 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#ffb4ab] tracking-wider font-semibold">
                Acesso Bloqueado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-3xl font-bold text-[#ffb4ab]">
                  {blockedStudents < 10 ? `0${blockedStudents}` : blockedStudents}
                </span>
                <span className="text-xs text-[#86948a]">inadimplentes</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-mono-metric text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Suspensos
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-[#86948a]">Trava ativa no app</span>
            <button 
              onClick={() => setFilterTab('blocked')}
              className="font-mono-metric text-[#ffb4ab] font-semibold hover:underline"
            >
              Reengajar →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-[#171f33] rounded-2xl p-3 border border-[#3c4a42]/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0b1326] p-1.5 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === 'all'
                ? 'bg-[#222a3d] text-[#dae2fd] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            Todos <span className="font-mono-metric ml-1 opacity-70">({totalStudents})</span>
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === 'active'
                ? 'bg-[#10b981] text-[#003824] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            Ativos <span className="font-mono-metric ml-1 font-bold">({activeStudents})</span>
          </button>
          <button
            onClick={() => setFilterTab('expiring')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === 'expiring'
                ? 'bg-[#ffb95f] text-[#472a00] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            A Vencer em Breve <span className="font-mono-metric ml-1 font-bold">({expiringStudents})</span>
          </button>
          <button
            onClick={() => setFilterTab('blocked')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === 'blocked'
                ? 'bg-[#93000a] text-[#ffdad6] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            Bloqueados <span className="font-mono-metric ml-1 font-bold">({blockedStudents})</span>
          </button>
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/40 focus:outline-none focus:border-[#4edea3] cursor-pointer"
          >
            <option value="all">Todos os Objetivos</option>
            <option value="hipertrofia">Hipertrofia</option>
            <option value="emagrecimento">Emagrecimento</option>
            <option value="força">Força</option>
            <option value="condicionamento">Condicionamento</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/40 focus:outline-none focus:border-[#4edea3] cursor-pointer"
          >
            <option value="expiration-asc">Ordenar: Vencimento Mais Próximo</option>
            <option value="name-asc">Nome (A - Z)</option>
          </select>
        </div>
      </div>

      {/* 4. Student High Density Data Table */}
      <div className="bg-[#171f33] rounded-2xl overflow-hidden border border-[#3c4a42]/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b1326]/90 text-[#86948a] font-mono-metric text-[11px] uppercase tracking-wider select-none border-b border-[#3c4a42]/40">
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Aluno & Contato</th>
                <th className="py-3.5 px-4 font-semibold">Plano & Objetivo Biomecânico</th>
                <th className="py-3.5 px-4 font-semibold">Último Treino</th>
                <th className="py-3.5 px-4 font-semibold">Vencimento</th>
                <th className="py-3.5 px-4 font-semibold">Status de Acesso</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c4a42]/30 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86948a]">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-base font-semibold text-[#bbcabf]">Nenhum aluno encontrado</p>
                    <p className="text-xs text-[#86948a] mt-1">Tente ajustar seus termos de busca ou filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const access = getStudentAccessInfo(student);
                  const isBlocked = access.status === 'blocked';
                  const isExpiring = access.status === 'expiring';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-[#222a3d]/60 transition-colors group ${
                        isBlocked
                          ? 'bg-[#93000a]/10'
                          : isExpiring
                          ? 'bg-[#ffb95f]/5'
                          : ''
                      }`}
                    >
                      {/* Column 1: Profile & Contact */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#2d3449] border border-[#3c4a42]/50">
                            {student.avatar_url ? (
                              <img
                                src={student.avatar_url}
                                alt={student.full_name}
                                className={`w-full h-full object-cover ${isBlocked ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#dae2fd]">
                                {student.full_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#171f33] ${
                                isBlocked ? 'bg-[#ffb4ab]' : isExpiring ? 'bg-[#ffb95f]' : 'bg-[#4edea3]'
                              }`}
                            ></span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`font-semibold text-sm truncate ${
                                isBlocked
                                  ? 'text-[#ffb4ab] line-through'
                                  : 'text-[#dae2fd] group-hover:text-[#4edea3]'
                              }`}
                            >
                              {student.full_name}
                            </span>
                            <span className="font-mono-metric text-xs text-[#86948a] truncate">
                              {student.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Plan & Goal */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs text-[#dae2fd]">{student.plan_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-metric bg-[#3131c0]/30 text-[#c0c1ff] font-bold">
                              {student.plan_tier.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-[#bbcabf] truncate max-w-[220px]">{student.goal}</span>
                        </div>
                      </td>

                      {/* Column 3: Last workout */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isBlocked ? 'bg-[#ffb4ab]' : 'bg-[#4edea3]'
                            }`}
                          ></span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-[#dae2fd] font-medium">{student.last_workout_date}</span>
                            <span className="text-[11px] text-[#86948a] font-mono-metric truncate max-w-[160px]">
                              {student.last_workout_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Expiration Date */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col font-mono-metric">
                          <span
                            className={`text-xs font-semibold ${
                              isBlocked
                                ? 'text-[#ffb4ab]'
                                : isExpiring
                                ? 'text-[#ffb95f]'
                                : 'text-[#dae2fd]'
                            }`}
                          >
                            {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              isBlocked
                                ? 'text-[#ffb4ab]'
                                : isExpiring
                                ? 'text-[#ffb95f] font-bold'
                                : 'text-[#4edea3]'
                            }`}
                          >
                            {isBlocked
                              ? `Venceu há ${Math.abs(access.diffDays)} dias`
                              : access.diffDays === 0
                              ? 'Vence hoje!'
                              : `em ${access.diffDays} dias`}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Status Badge */}
                      <td className="py-4 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-mono-metric text-xs font-bold border border-[#ffb4ab]/20">
                            <Lock className="w-3.5 h-3.5" />
                            Bloqueado / Vencido
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] font-mono-metric text-xs font-bold border border-[#ffb95f]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-ping"></span>
                            Vence em {access.diffDays} dias
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#4edea3] font-mono-metric text-xs font-medium border border-[#4edea3]/30">
                            <CheckCircle className="w-3.5 h-3.5 text-[#4edea3]" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpiring && (
                            <button
                              onClick={() => openWhatsApp(student)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffb95f]/20 text-[#ffb95f] hover:bg-[#ffb95f] hover:text-[#472a00] font-mono-metric text-xs font-bold transition-all"
                              title="Enviar cobrança / renovação via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          )}

                          {isBlocked && (
                            <button
                              onClick={() => {
                                const newDate = new Date();
                                newDate.setDate(newDate.getDate() + 90);
                                onUpdateStudent(student.id, {
                                  access_expiration_date: newDate.toISOString().split('T')[0],
                                  is_active: true,
                                });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10b981] text-[#003824] hover:bg-[#4edea3] font-bold text-xs transition-all shadow-sm"
                              title="Renovar +90 dias e reativar aluno"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reativar</span>
                            </button>
                          )}

                          <button
                            onClick={() => onEditWorkout(student)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#222a3d] transition-colors"
                            title="Editar Ficha de Treino"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onViewAnalytics(student)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#c0c1ff] hover:bg-[#222a3d] transition-colors"
                            title="Relatório Analítico de Cargas"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onSimulateAsStudent(student)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#ffb95f] hover:bg-[#222a3d] transition-colors"
                            title="Testar no Simulador PWA do Aluno"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-6 py-3.5 bg-[#0b1326]/70 border-t border-[#3c4a42]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#86948a]">
          <span>
            Exibindo <strong className="text-[#dae2fd]">{filteredStudents.length}</strong> de{' '}
            <strong className="text-[#dae2fd]">{totalStudents}</strong> alunos cadastrados
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono-metric text-[11px] text-[#4edea3]">
              ● Sincronizado com Supabase RLS
            </span>
          </div>
        </div>
      </div>

      {/* 5. Modal for New Student Registration / Subscription Renewal */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#171f33] rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#222a3d] flex items-start justify-between border-b border-[#3c4a42]/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#4edea3]" />
                  <h2 className="text-lg font-bold text-[#dae2fd]">
                    Cadastrar Aluno & Definir Vencimento
                  </h2>
                </div>
                <p className="text-xs text-[#bbcabf]">
                  Configure a vigência contratual e gere o link de acesso direto para WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body or Success State */}
            {createdStudentLink ? (
              <div className="p-6 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center mx-auto border border-[#4edea3]/40">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#dae2fd]">Aluno Cadastrado com Sucesso!</h3>
                  <p className="text-sm text-[#bbcabf]">
                    O acesso para <strong>{createdStudentLink.name}</strong> foi configurado com trava automática.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0b1326] border border-[#3c4a42]/50 text-left space-y-2">
                  <span className="font-mono-metric text-[11px] uppercase text-[#86948a] font-semibold">
                    Link de Convite / App
                  </span>
                  <div className="p-2.5 rounded-lg bg-[#171f33] text-xs font-mono-metric text-[#4edea3] break-all border border-[#3c4a42]/30">
                    {window.location.origin}?aluno={encodeURIComponent(createdStudentLink.name)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={createdStudentLink.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Acesso via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsNewStudentModalOpen(false);
                      setCreatedStudentLink(null);
                    }}
                    className="px-5 py-3 rounded-xl bg-[#222a3d] text-[#dae2fd] text-sm font-semibold hover:bg-[#31394d]"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStudent} className="p-6 space-y-4 overflow-y-auto">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#bbcabf] flex justify-between">
                    <span>Nome Completo do Aluno</span>
                    <span className="font-mono-metric text-[11px] text-[#4edea3]">Obrigatório</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ex: Lucas Silveira da Rocha"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>

                {/* WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf]">WhatsApp com DDD</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm font-mono-metric border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf]">E-mail (Opcional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="aluno@email.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Plan Presets */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-[#bbcabf]">Plano Contratado & Presets de Validade</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(30, 'mensal', 'Mensal Básico')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.plan_tier === 'mensal'
                          ? 'bg-[#10b981]/15 border-[#4edea3] text-[#4edea3]'
                          : 'bg-[#0b1326] border-[#3c4a42]/40 text-[#bbcabf] hover:border-[#3c4a42]'
                      }`}
                    >
                      <span className="block text-xs font-bold text-[#dae2fd]">Mensal</span>
                      <span className="font-mono-metric text-[11px] text-[#86948a]">+30 dias</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(90, 'trimestral', 'Trimestral VIP')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.plan_tier === 'trimestral'
                          ? 'bg-[#10b981]/15 border-[#4edea3] text-[#4edea3]'
                          : 'bg-[#0b1326] border-[#3c4a42]/40 text-[#bbcabf] hover:border-[#3c4a42]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4edea3]">Trimestral</span>
                        <span className="text-[9px] font-mono-metric px-1 py-0.2 rounded bg-[#10b981]/20 text-[#4edea3] uppercase font-bold">Pop</span>
                      </div>
                      <span className="font-mono-metric text-[11px] text-[#bbcabf]">+90 dias</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPresetDays(365, 'anual', 'Anual Elite')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.plan_tier === 'anual'
                          ? 'bg-[#10b981]/15 border-[#4edea3] text-[#4edea3]'
                          : 'bg-[#0b1326] border-[#3c4a42]/40 text-[#bbcabf] hover:border-[#3c4a42]'
                      }`}
                    >
                      <span className="block text-xs font-bold text-[#dae2fd]">Anual</span>
                      <span className="font-mono-metric text-[11px] text-[#86948a]">+365 dias</span>
                    </button>
                  </div>
                </div>

                {/* Dates: Start & Expiration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf]">Data de Início</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm font-mono-metric border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf] flex justify-between">
                      <span>Data de Vencimento</span>
                      <span className="font-mono-metric text-[11px] text-[#c0c1ff]">Trava do App</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.access_expiration_date}
                      onChange={(e) => setFormData({ ...formData, access_expiration_date: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#4edea3] font-bold text-sm font-mono-metric border border-[#4edea3]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Auto-lock toggle */}
                <div className="p-4 rounded-xl bg-[#0b1326] border border-[#3c4a42]/50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#4edea3]" />
                      <span className="text-xs font-bold text-[#dae2fd]">Bloqueio Automático por Vencimento</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#4edea3] font-mono-metric text-[10px] font-bold uppercase">
                        Ativo
                      </span>
                    </div>
                    <p className="text-[11px] text-[#bbcabf]">
                      Se a data limite for ultrapassada, o app do aluno é bloqueado com mensagem de renovação via WhatsApp.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.auto_lock}
                    onChange={(e) => setFormData({ ...formData, auto_lock: e.target.checked })}
                    className="w-5 h-5 rounded text-[#10b981] bg-[#171f33] border-[#3c4a42] focus:ring-0 cursor-pointer mt-1"
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-[#3c4a42]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewStudentModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Salvar & Gerar Link de Acesso</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
