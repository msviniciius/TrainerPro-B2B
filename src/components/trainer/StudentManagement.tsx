import React, { useState, useMemo } from 'react';
import { Student, PlanTier, WorkoutPlan } from '../../types/database';
import { formatWhatsAppPhone, getCleanWhatsAppDigits } from '../../utils/formatters';
import { generateStudentInviteUrl } from '../../utils/invite';
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
  MessageSquare, 
  CheckCircle, 
  CheckCircle2,
  X, 
  Send,
  RefreshCw,
  Clock,
  LayoutGrid,
  List,
  Target,
  ArrowUpDown,
  Filter,
  AlertCircle,
  Copy,
  KeyRound,
  ExternalLink,
  Check
} from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  workoutPlans?: WorkoutPlan[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: (newStudent: Partial<Student>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onViewAnalytics: (student: Student) => void;
  onEditWorkout: (student: Student) => void;
  onSimulateAsStudent?: (student: Student) => void;
  onOpenInviteOnboarding?: (student: Student) => void;
  isNewStudentModalOpen: boolean;
  setIsNewStudentModalOpen: (open: boolean) => void;
  searchQuery: string;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  workoutPlans,
  onSelectStudent,
  onAddStudent,
  onUpdateStudent,
  onViewAnalytics,
  onEditWorkout,
  onSimulateAsStudent,
  onOpenInviteOnboarding,
  isNewStudentModalOpen,
  setIsNewStudentModalOpen,
  searchQuery,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'expiring' | 'blocked'>('all');
  const [sortBy, setSortBy] = useState<'expiration-asc' | 'expiration-desc' | 'name-asc' | 'recent-workout'>('expiration-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Quick Renew Modal State
  const [renewingStudent, setRenewingStudent] = useState<Student | null>(null);
  const [renewDays, setRenewDays] = useState<number>(30);
  const [renewCustomDate, setRenewCustomDate] = useState<string>('');

  // Form State for Registration Modal
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan_tier: 'trimestral' as PlanTier,
    plan_name: 'Consultoria Personalizada',
    goal: 'Hipertrofia com Definição',
    age: 28,
    weight_kg: 80,
    start_date: new Date().toISOString().split('T')[0],
    access_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    auto_lock: true,
  });

  const [createdStudentLink, setCreatedStudentLink] = useState<{
    name: string;
    phone: string;
    link: string;
    inviteUrl: string;
    studentId: string;
  } | null>(null);
  const [copiedSuccessModalLink, setCopiedSuccessModalLink] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  const copyStudentInviteLink = (student: Student, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const inviteUrl = generateStudentInviteUrl(student);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedStudentId(student.id);
      setTimeout(() => setCopiedStudentId(null), 2500);
    }
  };

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

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = student.full_name.toLowerCase().includes(q);
          const matchesPhone = student.phone.includes(q);
          const matchesEmail = student.email.toLowerCase().includes(q);
          const matchesPlan = student.plan_name.toLowerCase().includes(q);
          const matchesGoal = student.goal.toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesEmail && !matchesPlan && !matchesGoal) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiration-asc') {
          return new Date(a.access_expiration_date).getTime() - new Date(b.access_expiration_date).getTime();
        }
        if (sortBy === 'expiration-desc') {
          return new Date(b.access_expiration_date).getTime() - new Date(a.access_expiration_date).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.full_name.localeCompare(b.full_name);
        }
        return 0;
      });
  }, [students, filterTab, sortBy, searchQuery]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const studentId = `student-${Date.now()}`;

    const newStudentData: Student = {
      id: studentId,
      trainer_id: 'trainer-001',
      full_name: formData.full_name,
      email: formData.email || `${formData.full_name.toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
      phone: formData.phone || '(11) 98765-4321',
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
      last_workout_name: 'Ficha Inicial Prescrita',
      password_set: false,
      invite_token: studentId,
      created_at: new Date().toISOString()
    };

    onAddStudent(newStudentData);

    const inviteUrl = generateStudentInviteUrl(newStudentData);

    // Generate WhatsApp welcome link with direct web app onboarding link
    const cleanPhone = getCleanWhatsAppDigits(formData.phone);
    const shareMessage = `Olá ${formData.full_name}! Seu acesso à consultoria TrainerPro foi liberado pelo seu treinador.\n\nAcesse pelo link abaixo para cadastrar sua senha e visualizar sua ficha de treino:\n🔗 ${inviteUrl}\n\n(Acesso válido até ${new Date(formData.access_expiration_date).toLocaleDateString('pt-BR')})\nBons treinos! 💪`;
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`;

    setCreatedStudentLink({
      name: formData.full_name,
      phone: formData.phone,
      link: waLink,
      inviteUrl: inviteUrl,
      studentId: studentId
    });
  };

  const handleQuickPresetDays = (days: number) => {
    const base = formData.start_date ? new Date(formData.start_date) : new Date();
    base.setDate(base.getDate() + days);
    setFormData((prev) => ({
      ...prev,
      access_expiration_date: base.toISOString().split('T')[0],
    }));
  };

  const openWhatsApp = (student: Student, customMsg?: string) => {
    const cleanPhone = getCleanWhatsAppDigits(student.phone);
    const access = getStudentAccessInfo(student);
    const defaultMsg = access.status === 'blocked'
      ? `Olá ${student.full_name}! Seu acesso ao aplicativo expirou em ${new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}. Vamos regularizar sua assinatura para liberar sua nova ficha de treinos?`
      : access.status === 'expiring'
      ? `Olá ${student.full_name}, seu plano vence em breve (${new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}). Vamos renovar para não interromper seus treinos?`
      : `Olá ${student.full_name}, tudo bem? Passando para saber como estão os treinos da semana!`;
    const msg = customMsg || defaultMsg;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Open Quick Renew modal for a student
  const handleOpenRenewModal = (student: Student) => {
    setRenewingStudent(student);
    setRenewDays(30);
    const curr = new Date(student.access_expiration_date);
    const baseDate = curr.getTime() > Date.now() ? curr : new Date();
    baseDate.setDate(baseDate.getDate() + 30);
    setRenewCustomDate(baseDate.toISOString().split('T')[0]);
  };

  const handleApplyRenewal = (sendWhatsApp: boolean = false) => {
    if (!renewingStudent) return;
    const newDate = renewCustomDate;

    onUpdateStudent(renewingStudent.id, {
      access_expiration_date: newDate,
      is_active: true,
    });

    if (sendWhatsApp) {
      const cleanPhone = getCleanWhatsAppDigits(renewingStudent.phone);
      const msg = `Olá ${renewingStudent.full_name}! Sua assinatura foi renovada com sucesso até ${new Date(newDate).toLocaleDateString('pt-BR')}! Seu acesso ao app e fichas está liberado. Bora treinar! 💪`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    setRenewingStudent(null);
  };

  const handleSelectRenewPreset = (days: number) => {
    if (!renewingStudent) return;
    setRenewDays(days);
    const curr = new Date(renewingStudent.access_expiration_date);
    const baseDate = curr.getTime() > Date.now() ? curr : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setRenewCustomDate(baseDate.toISOString().split('T')[0]);
  };

  const hasActiveFilters = filterTab !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      {/* 1. Header & Top Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#3c4a42]/30">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono-metric text-xs uppercase tracking-wider text-[#4edea3] font-bold bg-[#4edea3]/10 px-2.5 py-0.5 rounded-full border border-[#4edea3]/20">
              Painel de Alunos
            </span>
            <span className="text-xs text-[#86948a] font-mono-metric flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              {activeStudents} ativos agora
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">
            Gestão de Alunos
          </h1>
          <p className="text-sm text-[#bbcabf] mt-0.5">
            Acompanhe a vigência de planos, fichas de treino e envie notificações via WhatsApp com agilidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                ["Nome,Telefone,Plano,Vencimento,Status", ...students.map(s => `"${s.full_name}","${s.phone}","${s.plan_name}","${s.access_expiration_date}","${getStudentAccessInfo(s).status}"`)].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `alunos_${new Date().toISOString().slice(0,10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/50 transition-all shadow-sm"
            title="Exportar base de alunos em formato CSV"
          >
            <FileDown className="w-4 h-4 text-[#86948a]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setCreatedStudentLink(null);
              setIsNewStudentModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 h-10 px-5 bg-gradient-to-r from-[#10b981] to-[#4edea3] hover:brightness-110 text-[#003824] rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#10b981]/20 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Aluno</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Interactive KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total de Alunos */}
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group cursor-pointer ${
            filterTab === 'all'
              ? 'bg-[#1e273d] border-[#4edea3] shadow-md ring-1 ring-[#4edea3]/30'
              : 'bg-[#171f33] border-[#3c4a42]/40 hover:bg-[#222a3d]/70'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#bbcabf] tracking-wider font-semibold">
                Total de Alunos
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-2xl sm:text-3xl font-bold text-[#dae2fd]">
                  {totalStudents}
                </span>
                <span className="font-mono-metric text-xs text-[#86948a]">cadastrados</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0b1326] flex items-center justify-center text-[#4edea3] border border-[#3c4a42]/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#86948a] pt-2 border-t border-[#3c4a42]/30">
            <span>Ver todos</span>
            <span className="text-[#4edea3] font-mono-metric font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* KPI 2: Acessos Ativos */}
        <button
          type="button"
          onClick={() => setFilterTab('active')}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group cursor-pointer ${
            filterTab === 'active'
              ? 'bg-[#1e273d] border-[#10b981] shadow-md ring-1 ring-[#10b981]/30'
              : 'bg-[#171f33] border-[#3c4a42]/40 hover:bg-[#222a3d]/70'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#4edea3] tracking-wider font-semibold">
                Acessos em Dia
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-2xl sm:text-3xl font-bold text-[#4edea3]">
                  {activeStudents}
                </span>
                <span className="text-xs text-[#bbcabf]">
                  ({totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 flex items-center justify-center text-[#4edea3] border border-[#10b981]/30">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#86948a] pt-2 border-t border-[#3c4a42]/30">
            <span className="text-[#4edea3]">Fichas liberadas</span>
            <span className="text-[#4edea3] font-mono-metric font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* KPI 3: Vencendo em Breve */}
        <button
          type="button"
          onClick={() => setFilterTab('expiring')}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group cursor-pointer ${
            filterTab === 'expiring'
              ? 'bg-[#2a2215] border-[#ffb95f] shadow-md ring-1 ring-[#ffb95f]/30'
              : 'bg-[#171f33] border-[#3c4a42]/40 hover:bg-[#222a3d]/70'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#ffb95f] tracking-wider font-semibold">
                Vence em ≤ 5 Dias
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-2xl sm:text-3xl font-bold text-[#ffb95f]">
                  {expiringStudents}
                </span>
                <span className="text-xs text-[#86948a]">atenção</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#ffb95f]/15 flex items-center justify-center text-[#ffb95f] border border-[#ffb95f]/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#86948a] pt-2 border-t border-[#3c4a42]/30">
            <span className="text-[#ffb95f]">Renovar no WhatsApp</span>
            <span className="text-[#ffb95f] font-mono-metric font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* KPI 4: Acesso Bloqueado */}
        <button
          type="button"
          onClick={() => setFilterTab('blocked')}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group cursor-pointer ${
            filterTab === 'blocked'
              ? 'bg-[#2b1717] border-[#ffb4ab] shadow-md ring-1 ring-[#ffb4ab]/30'
              : 'bg-[#171f33] border-[#3c4a42]/40 hover:bg-[#222a3d]/70'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#ffb4ab] tracking-wider font-semibold">
                Acesso Bloqueado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-metric text-2xl sm:text-3xl font-bold text-[#ffb4ab]">
                  {blockedStudents}
                </span>
                <span className="text-xs text-[#86948a]">vencidos</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#93000a]/30 flex items-center justify-center text-[#ffb4ab] border border-[#ffb4ab]/30">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#86948a] pt-2 border-t border-[#3c4a42]/30">
            <span className="text-[#ffb4ab]">Reativar acesso</span>
            <span className="text-[#ffb4ab] font-mono-metric font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* 3. Filter & Control Toolbar */}
      <div className="bg-[#171f33] rounded-2xl p-3 border border-[#3c4a42]/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-md">
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0b1326] p-1.5 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-[#222a3d] text-[#dae2fd] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span>Todos</span>
            <span className="font-mono-metric text-[11px] px-1.5 py-0.2 rounded-full bg-[#171f33] text-[#bbcabf]">
              {totalStudents}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterTab === 'active'
                ? 'bg-[#10b981] text-[#003824] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
            <span>Ativos</span>
            <span className={`font-mono-metric text-[11px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'active' ? 'bg-[#003824]/20 text-[#003824]' : 'bg-[#171f33] text-[#4edea3]'
            }`}>
              {activeStudents}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterTab === 'expiring'
                ? 'bg-[#ffb95f] text-[#472a00] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]"></span>
            <span>A Vencer</span>
            <span className={`font-mono-metric text-[11px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'expiring' ? 'bg-[#472a00]/20 text-[#472a00]' : 'bg-[#171f33] text-[#ffb95f]'
            }`}>
              {expiringStudents}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('blocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterTab === 'blocked'
                ? 'bg-[#ba1a1a] text-[#ffffff] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Bloqueados</span>
            <span className={`font-mono-metric text-[11px] px-1.5 py-0.2 rounded-full ${
              filterTab === 'blocked' ? 'bg-black/30 text-white' : 'bg-[#171f33] text-[#ffb4ab]'
            }`}>
              {blockedStudents}
            </span>
          </button>
        </div>

        {/* Right: Dropdowns & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-[#0b1326] px-3 py-1 rounded-xl border border-[#3c4a42]/40">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#86948a]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 bg-transparent text-[#dae2fd] text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="expiration-asc" className="bg-[#171f33]">Vencimento Mais Próximo</option>
              <option value="expiration-desc" className="bg-[#171f33]">Vencimento Mais Distante</option>
              <option value="name-asc" className="bg-[#171f33]">Nome do Aluno (A - Z)</option>
            </select>
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex items-center bg-[#0b1326] p-1 rounded-xl border border-[#3c4a42]/40">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-[#171f33]/60 px-4 py-2 rounded-xl border border-[#3c4a42]/30 text-xs text-[#bbcabf]">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Filtros aplicados:</span>
            {filterTab !== 'all' && (
              <span className="font-mono-metric px-2 py-0.5 rounded-full bg-[#222a3d] text-[#dae2fd] border border-[#3c4a42]/40 flex items-center gap-1">
                Status: {filterTab === 'active' ? 'Ativos' : filterTab === 'expiring' ? 'A Vencer' : 'Bloqueados'}
                <button onClick={() => setFilterTab('all')} className="hover:text-[#ffb4ab]">×</button>
              </span>
            )}
            {searchQuery.trim().length > 0 && (
              <span className="font-mono-metric px-2 py-0.5 rounded-full bg-[#222a3d] text-[#dae2fd] border border-[#3c4a42]/40 flex items-center gap-1">
                Busca: "{searchQuery}"
              </span>
            )}
            <span className="text-[#86948a]">
              ({filteredStudents.length} de {totalStudents} alunos)
            </span>
          </div>
          <button
            onClick={() => {
              setFilterTab('all');
            }}
            className="text-xs text-[#4edea3] hover:underline font-semibold"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* 4. Student Listing View (Grid vs Table) */}
      {filteredStudents.length === 0 ? (
        <div className="bg-[#171f33] rounded-2xl p-12 text-center border border-[#3c4a42]/40 space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#0b1326] flex items-center justify-center text-[#86948a] mx-auto border border-[#3c4a42]/40">
            <Users className="w-7 h-7 opacity-40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#dae2fd]">Nenhum aluno encontrado</h3>
            <p className="text-xs text-[#86948a] max-w-sm mx-auto">
              Não encontramos alunos com os filtros ou termo de busca selecionados.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#222a3d] text-xs font-semibold text-[#4edea3] hover:bg-[#31394d] transition-colors"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= CARDS GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredStudents.map((student) => {
            const access = getStudentAccessInfo(student);
            const isBlocked = access.status === 'blocked';
            const isExpiring = access.status === 'expiring';
            const studentPlans = workoutPlans?.filter(p => p.student_id === student.id) || [];
            const hasPrescribedPlan = studentPlans.some(p => p.exercises && p.exercises.length > 0);

            return (
              <div
                key={student.id}
                className={`bg-[#171f33] rounded-2xl border transition-all hover:shadow-xl flex flex-col justify-between overflow-hidden group ${
                  isBlocked
                    ? 'border-[#ffb4ab]/30 hover:border-[#ffb4ab]/60'
                    : isExpiring
                    ? 'border-[#ffb95f]/40 hover:border-[#ffb95f]/70 bg-gradient-to-b from-[#171f33] to-[#251f15]'
                    : 'border-[#3c4a42]/40 hover:border-[#4edea3]/50'
                }`}
              >
                {/* Card Top: Avatar, Name, Phone & Status Badge */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#0b1326] border-2 border-[#3c4a42]/60">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.full_name}
                            className={`w-full h-full object-cover ${isBlocked ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#dae2fd]">
                            {student.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#171f33] ${
                            isBlocked ? 'bg-[#ffb4ab]' : isExpiring ? 'bg-[#ffb95f]' : 'bg-[#4edea3]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-bold truncate group-hover:text-[#4edea3] transition-colors ${
                          isBlocked ? 'text-[#ffb4ab] line-through' : 'text-[#dae2fd]'
                        }`}>
                          {student.full_name}
                        </h3>
                        
                        <button
                          type="button"
                          onClick={() => openWhatsApp(student)}
                          className="font-mono-metric text-xs text-[#86948a] hover:text-[#25D366] flex items-center gap-1.5 transition-colors group/phone mt-0.5"
                          title="Conversar no WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-[#25D366]" />
                          <span className="truncate">{student.phone}</span>
                        </button>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="flex-shrink-0 whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ba1a1a]/30 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono-metric text-[10px] font-bold whitespace-nowrap flex-shrink-0">
                          <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                          Bloqueado
                        </span>
                      ) : isExpiring ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] border border-[#ffb95f]/30 font-mono-metric text-[10px] font-bold whitespace-nowrap flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-ping flex-shrink-0" />
                          <span>Vence em {access.diffDays}d</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/30 font-mono-metric text-[10px] font-semibold whitespace-nowrap flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expiration Countdown Ribbon */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs whitespace-nowrap ${
                    isBlocked
                      ? 'bg-[#93000a]/20 border-[#ffb4ab]/20 text-[#ffb4ab]'
                      : isExpiring
                      ? 'bg-[#ffb95f]/10 border-[#ffb95f]/30 text-[#ffb95f]'
                      : 'bg-[#0b1326] border-[#3c4a42]/40 text-[#bbcabf]'
                  }`}>
                    <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                      <span className="text-[11px] font-medium whitespace-nowrap">Vencimento:</span>
                      <strong className="font-mono-metric text-xs font-semibold whitespace-nowrap">
                        {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
                      </strong>
                    </div>
                    
                    <span className="font-mono-metric text-[11px] font-bold whitespace-nowrap flex-shrink-0 ml-2">
                      {isBlocked
                        ? `Expirou há ${Math.abs(access.diffDays)}d`
                        : access.diffDays === 0
                        ? 'Vence hoje!'
                        : `${access.diffDays}d restantes`}
                    </span>
                  </div>

                  {/* Metadata Chips: Goal & Prescription */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#bbcabf]">
                      <Target className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                      <span className="truncate">{student.goal}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[#86948a] font-mono-metric text-[11px]">
                      <Dumbbell className="w-3.5 h-3.5 text-[#c0c1ff] flex-shrink-0" />
                      {hasPrescribedPlan ? (
                        <>
                          <span className="text-[#4edea3] font-semibold truncate">
                            {student.last_workout_name || 'Ficha Prescrita'}
                          </span>
                          <span className="text-[#86948a]">• {student.last_workout_date || 'Ativo'}</span>
                        </>
                      ) : (
                        <span className="text-[#ffb95f] font-semibold bg-[#ffb95f]/15 px-2 py-0.5 rounded-md border border-[#ffb95f]/30">
                          Aguardando Prescrição
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Action Toolbar */}
                <div className="p-3 bg-[#0b1326]/60 border-t border-[#3c4a42]/30 flex items-center justify-between gap-1.5">
                  {/* WhatsApp Direct Action Button */}
                  <button
                    type="button"
                    onClick={() => openWhatsApp(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black font-semibold text-xs transition-all shadow-sm group/wa"
                    title="Conversar / Enviar lembrete via WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 group-hover/wa:scale-110 transition-transform" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Copy Invite / Password Setup Link */}
                  <button
                    type="button"
                    onClick={(e) => copyStudentInviteLink(student, e)}
                    className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#4edea3] border border-[#3c4a42]/40 transition-colors"
                    title={copiedStudentId === student.id ? "Link copiado!" : "Copiar link de convite / criar senha"}
                  >
                    {copiedStudentId === student.id ? (
                      <Check className="w-4 h-4 text-[#10b981]" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                  </button>

                  {/* Quick Renew Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenRenewModal(student)}
                    className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/40 transition-colors"
                    title="Renovar ou Alterar Vencimento"
                  >
                    <RefreshCw className="w-3 h-3 text-[#4edea3]" />
                    <span className="hidden sm:inline">Renovar</span>
                  </button>

                  {/* Workout Builder */}
                  {hasPrescribedPlan ? (
                    <button
                      type="button"
                      onClick={() => onEditWorkout(student)}
                      className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#4edea3] border border-[#3c4a42]/40 transition-colors cursor-pointer"
                      title="Editar Ficha de Treino"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditWorkout(student)}
                      className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#ffb95f]/20 hover:bg-[#ffb95f]/30 text-[#ffb95f] border border-[#ffb95f]/40 font-semibold text-xs transition-colors cursor-pointer"
                      title="Montar Ficha de Treino agora"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Montar Ficha</span>
                    </button>
                  )}

                  {/* Analytics */}
                  <button
                    type="button"
                    onClick={() => onViewAnalytics(student)}
                    className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#c0c1ff] border border-[#3c4a42]/40 transition-colors"
                    title="Relatório Analítico de Cargas"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-[#171f33] rounded-2xl overflow-hidden border border-[#3c4a42]/40 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b1326]/90 text-[#86948a] font-mono-metric text-[11px] uppercase tracking-wider select-none border-b border-[#3c4a42]/40">
                  <th className="py-3.5 px-4 sm:px-6 font-semibold">Aluno & Contato</th>
                  <th className="py-3.5 px-4 font-semibold">Objetivo & Ficha</th>
                  <th className="py-3.5 px-4 font-semibold">Último Treino</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Vencimento</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 font-semibold text-right whitespace-nowrap">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c4a42]/30 text-sm">
                {filteredStudents.map((student) => {
                  const access = getStudentAccessInfo(student);
                  const isBlocked = access.status === 'blocked';
                  const isExpiring = access.status === 'expiring';
                  const studentPlans = workoutPlans?.filter(p => p.student_id === student.id) || [];
                  const hasPrescribedPlan = studentPlans.some(p => p.exercises && p.exercises.length > 0);

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
                            />
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
                            <button
                              type="button"
                              onClick={() => openWhatsApp(student)}
                              className="font-mono-metric text-xs text-[#86948a] hover:text-[#25D366] flex items-center gap-1 truncate text-left transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-[#25D366]" />
                              <span>{student.phone}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Goal & Plan */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-[#dae2fd] font-medium truncate max-w-[200px]">{student.goal}</span>
                          <span className="font-mono-metric text-[11px] text-[#86948a]">{student.plan_name}</span>
                        </div>
                      </td>

                      {/* Column 3: Last workout / Prescription */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              !hasPrescribedPlan
                                ? 'bg-[#ffb95f] animate-pulse'
                                : isBlocked
                                ? 'bg-[#ffb4ab]'
                                : 'bg-[#4edea3]'
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            {hasPrescribedPlan ? (
                              <>
                                <span className="text-xs text-[#dae2fd] font-medium">{student.last_workout_date}</span>
                                <span className="text-[11px] text-[#86948a] font-mono-metric truncate max-w-[150px]">
                                  {student.last_workout_name}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono-metric text-[11px] text-[#ffb95f] font-semibold">
                                Ficha Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Expiration Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col font-mono-metric whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold whitespace-nowrap ${
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
                            className={`text-[11px] font-medium whitespace-nowrap ${
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
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ba1a1a]/30 text-[#ffb4ab] font-mono-metric text-xs font-bold border border-[#ffb4ab]/20 whitespace-nowrap flex-shrink-0">
                            <Lock className="w-3 h-3 flex-shrink-0" />
                            Bloqueado
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] font-mono-metric text-xs font-bold border border-[#ffb95f]/30 whitespace-nowrap flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-ping flex-shrink-0" />
                            <span>Vence em {access.diffDays}d</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#4edea3] font-mono-metric text-xs font-semibold border border-[#4edea3]/30 whitespace-nowrap flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp */}
                          <button
                            onClick={() => openWhatsApp(student)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black font-semibold text-xs transition-all shadow-sm"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {/* Copy Invite Link */}
                          <button
                            onClick={(e) => copyStudentInviteLink(student, e)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#222a3d] transition-colors"
                            title={copiedStudentId === student.id ? "Link copiado!" : "Copiar link de convite do aluno"}
                          >
                            {copiedStudentId === student.id ? (
                              <Check className="w-4 h-4 text-[#10b981]" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>

                          {/* Quick Renew */}
                          <button
                            onClick={() => handleOpenRenewModal(student)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#222a3d] transition-colors"
                            title="Renovar / Alterar Vencimento"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Edit / Montar Workout */}
                          {hasPrescribedPlan ? (
                            <button
                              onClick={() => onEditWorkout(student)}
                              className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#222a3d] transition-colors cursor-pointer"
                              title="Editar Ficha de Treino"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onEditWorkout(student)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffb95f]/20 hover:bg-[#ffb95f]/30 text-[#ffb95f] border border-[#ffb95f]/30 text-xs font-semibold transition-colors cursor-pointer"
                              title="Montar Ficha de Treino"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Montar Ficha</span>
                            </button>
                          )}

                          {/* Analytics */}
                          <button
                            onClick={() => onViewAnalytics(student)}
                            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#c0c1ff] hover:bg-[#222a3d] transition-colors"
                            title="Relatório Analítico de Cargas"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3.5 bg-[#0b1326]/70 border-t border-[#3c4a42]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#86948a]">
            <span>
              Exibindo <strong className="text-[#dae2fd]">{filteredStudents.length}</strong> de{' '}
              <strong className="text-[#dae2fd]">{totalStudents}</strong> alunos cadastrados
            </span>
            <span className="font-mono-metric text-[11px] text-[#4edea3]">
              ● Sincronizado e pronto para prescrição
            </span>
          </div>
        </div>
      )}

      {/* 5. Quick Renewal Modal */}
      {renewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#171f33] rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-5 py-4 bg-[#222a3d] flex items-center justify-between border-b border-[#3c4a42]/40">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#4edea3]" />
                <h3 className="text-base font-bold text-[#dae2fd]">Renovação Rápida de Acesso</h3>
              </div>
              <button
                onClick={() => setRenewingStudent(null)}
                className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Student preview */}
              <div className="p-3 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2d3449] overflow-hidden flex-shrink-0">
                  {renewingStudent.avatar_url ? (
                    <img src={renewingStudent.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#dae2fd]">
                      {renewingStudent.full_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#dae2fd] truncate">{renewingStudent.full_name}</h4>
                  <p className="font-mono-metric text-[11px] text-[#86948a]">
                    Vencimento atual: {new Date(renewingStudent.access_expiration_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf]">Escolha o Período de Renovação:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '+30 dias', days: 30 },
                    { label: '+60 dias', days: 60 },
                    { label: '+90 dias', days: 90 },
                    { label: '+1 ano', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleSelectRenewPreset(preset.days)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        renewDays === preset.days
                          ? 'bg-[#10b981]/20 border-[#4edea3] text-[#4edea3]'
                          : 'bg-[#0b1326] border-[#3c4a42]/40 text-[#dae2fd] hover:border-[#4edea3]'
                      }`}
                    >
                      <span className="block text-xs font-bold">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* New Expiration Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex justify-between">
                  <span>Novo Vencimento</span>
                  <span className="font-mono-metric text-[11px] text-[#4edea3]">Calculado</span>
                </label>
                <input
                  type="date"
                  value={renewCustomDate}
                  onChange={(e) => setRenewCustomDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#4edea3] font-bold text-sm font-mono-metric border border-[#4edea3]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                />
              </div>

              {/* Confirm Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyRenewal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-semibold transition-all"
                >
                  Salvar Apenas
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRenewal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] hover:brightness-110 text-black text-xs font-bold transition-all shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Salvar & WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal for New Student Registration */}
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
                  <div className="flex items-center justify-between">
                    <span className="font-mono-metric text-[11px] uppercase text-[#86948a] font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#4edea3]" />
                      Link Direto de Ativação / Criar Senha
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(createdStudentLink.inviteUrl);
                          setCopiedSuccessModalLink(true);
                          setTimeout(() => setCopiedSuccessModalLink(false), 2500);
                        }
                      }}
                      className="text-xs font-semibold text-[#4edea3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSuccessModalLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#171f33] text-xs font-mono-metric text-[#4edea3] break-all border border-[#3c4a42]/30 flex items-center justify-between gap-2">
                    <span className="truncate">{createdStudentLink.inviteUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(createdStudentLink.inviteUrl);
                          setCopiedSuccessModalLink(true);
                          setTimeout(() => setCopiedSuccessModalLink(false), 2500);
                        }
                      }}
                      className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] transition-colors flex-shrink-0 cursor-pointer"
                      title="Copiar Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Ao abrir este link, o aluno cadastrará sua senha pessoal e terá acesso imediato à sua ficha de treino.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <a
                    href={createdStudentLink.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Acesso via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const target = students.find(s => s.id === createdStudentLink.studentId) || ({
                        id: createdStudentLink.studentId,
                        trainer_id: 'trainer-001',
                        full_name: createdStudentLink.name,
                        email: `${createdStudentLink.name.toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
                        phone: createdStudentLink.phone,
                        plan_tier: 'trimestral',
                        plan_name: 'Trimestral VIP',
                        goal: 'Hipertrofia',
                        cycle_info: 'Ciclo 1 • Início de Prescrição',
                        age: 28,
                        weight_kg: 75,
                        weight_diff_kg: 0,
                        access_expiration_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
                        is_active: true,
                        auto_lock: true,
                        last_workout_date: 'Aguardando 1º Treino',
                        last_workout_name: 'Ficha Prescrita',
                        created_at: new Date().toISOString(),
                        invite_token: createdStudentLink.studentId,
                        password_set: false
                      } as Student);

                      setIsNewStudentModalOpen(false);
                      setCreatedStudentLink(null);

                      try {
                        window.history.pushState({}, '', createdStudentLink.inviteUrl);
                      } catch (e) {}

                      if (onOpenInviteOnboarding) {
                        onOpenInviteOnboarding(target);
                      } else {
                        window.location.href = createdStudentLink.inviteUrl;
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-[#222a3d] hover:bg-[#31394d] text-[#c0c1ff] text-xs sm:text-sm font-semibold border border-[#3c4a42]/40 transition-colors cursor-pointer"
                    title="Testar tela de criação de senha do aluno"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Testar Link</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewStudentModalOpen(false);
                      setCreatedStudentLink(null);
                    }}
                    className="px-4 py-3 rounded-xl bg-[#222a3d] text-[#dae2fd] text-xs sm:text-sm font-semibold hover:bg-[#31394d] cursor-pointer"
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
                      onChange={(e) => setFormData({ ...formData, phone: formatWhatsAppPhone(e.target.value) })}
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

                {/* Goal & Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf]">Objetivo Principal</label>
                    <select
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                    >
                      <option value="Hipertrofia com Definição">Hipertrofia com Definição</option>
                      <option value="Emagrecimento & Queima Calórica">Emagrecimento & Queima Calórica</option>
                      <option value="Força & Powerlifting">Força & Powerlifting</option>
                      <option value="Condicionamento & Saúde">Condicionamento & Saúde</option>
                      <option value="Reabilitação & Postura">Reabilitação & Postura</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#bbcabf]">Peso Atual (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-sm font-mono-metric border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Manual Expiration & Quick Date Presets */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#bbcabf]">Validade do Acesso (Controle Manual)</label>
                    <span className="font-mono-metric text-[11px] text-[#4edea3] font-semibold">Atalhos</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '+30 dias', days: 30 },
                      { label: '+60 dias', days: 60 },
                      { label: '+90 dias', days: 90 },
                      { label: '+1 ano', days: 365 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleQuickPresetDays(preset.days)}
                        className="p-2.5 rounded-xl border border-[#3c4a42]/40 bg-[#0b1326] hover:border-[#4edea3] hover:bg-[#10b981]/10 text-center transition-all group"
                      >
                        <span className="block text-xs font-bold text-[#4edea3] group-hover:scale-105 transition-transform">{preset.label}</span>
                        <span className="font-mono-metric text-[10px] text-[#86948a] block mt-0.5">somar dias</span>
                      </button>
                    ))}
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
                      <span>Data de Vencimento Manual</span>
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
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all cursor-pointer"
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
