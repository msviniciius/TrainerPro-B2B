import React, { useState } from 'react';
import { 
  UserCheck, 
  Award, 
  Phone, 
  Mail, 
  Building, 
  Save, 
  CheckCircle2, 
  Instagram, 
  ShieldCheck, 
  Camera, 
  CreditCard,
  QrCode,
  Copy,
  Check,
  Percent,
  Lock,
  Plus,
  Flame,
  Zap,
  DollarSign,
  TrendingUp,
  Sparkles,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Eye,
  Sliders,
  CheckSquare,
  X,
  LogOut
} from 'lucide-react';
import { PersonalTrainer } from '../../types/database';
import { formatWhatsAppPhone } from '../../utils/formatters';

interface TrainerProfileSettingsProps {
  trainer: PersonalTrainer;
  onUpdateTrainer: (updated: PersonalTrainer) => void;
  onLogout?: () => void;
}

const DEFAULT_SPECIALTIES = [
  'Hipertrofia & Densidade Muscular',
  'Biomecânica & Prevenção de Lesões',
  'Emagrecimento & Recomposição',
  'Periodização de Força & Powerlifting',
  'Treinamento Feminino & Glúteos',
  'Reabilitação Postural & Coluna',
  'Condicionamento Físico & Mobilidade',
  'Preparação de Atletas de Alta Performance'
];

export const TrainerProfileSettings: React.FC<TrainerProfileSettingsProps> = ({
  trainer,
  onUpdateTrainer,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'pix' | 'settings'>('profile');
  const [formData, setFormData] = useState<PersonalTrainer>({ ...trainer });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateTrainer(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleCopyRegistrationLink = () => {
    const link = `${window.location.origin}?ref_trainer=${formData.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddSpecialty = (specialty: string) => {
    if (!specialty.trim()) return;
    const current = formData.specialties || [];
    if (!current.includes(specialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...current, specialty.trim()]
      });
    }
    setNewSpecialtyInput('');
  };

  const handleRemoveSpecialty = (specialty: string) => {
    const current = formData.specialties || [];
    setFormData({
      ...formData,
      specialties: current.filter(s => s !== specialty)
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1360px] mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={formData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={formData.brand_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#10b981] shadow-lg shadow-[#10b981]/15"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#10b981] flex items-center justify-center text-[#003824]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono-metric text-[11px] uppercase text-[#4edea3] font-bold bg-[#10b981]/15 px-2.5 py-0.5 rounded-full border border-[#4edea3]/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                CREF {formData.cref}
              </span>
              <span className="font-mono-metric text-[11px] text-[#4edea3] bg-[#10b981]/10 px-2 py-0.5 rounded-full border border-[#10b981]/20 font-semibold">
                Consultoria Ativa
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#dae2fd] tracking-tight">
              {formData.full_name || formData.brand_name}
            </h1>
            <p className="text-xs text-[#bbcabf] flex items-center gap-2 mt-0.5">
              <span>{formData.brand_name}</span>
              <span>•</span>
              <span className="font-mono-metric text-[#86948a]">{formData.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end xl:self-auto">
          <button
            type="button"
            onClick={handleCopyRegistrationLink}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/50 transition-all shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#4edea3]" /> : <Copy className="w-4 h-4 text-[#ffb95f]" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Matrícula'}</span>
          </button>

          <button
            onClick={() => handleSave()}
            className="flex items-center gap-2 h-10 px-6 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] hover:brightness-110 text-[#003824] font-bold text-xs shadow-lg shadow-[#10b981]/25 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Perfil</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="absolute bottom-2 right-4 bg-[#10b981] text-[#003824] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dados do Personal salvos com sucesso!</span>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#3c4a42]/40 pb-2 overflow-x-auto">
        {[
          { id: 'profile', label: 'Dados Pessoais & Marca', icon: UserCheck },
          { id: 'pix', label: 'Chave Pix & Recebimentos', icon: CreditCard },
          { id: 'settings', label: 'Regras & Boas-Vindas', icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#10b981] text-[#003824] shadow-md shadow-[#10b981]/15'
                  : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#003824]' : 'text-[#86948a]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: DADOS PESSOAIS & MARCA */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info Form */}
          <div className="lg:col-span-8 bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#3c4a42]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#10b981]/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#dae2fd]">Identificação & Credencial Profissional</h2>
                  <p className="text-xs text-[#bbcabf]">Dados cadastrais exibidos nos relatórios e fichas emitidas para os alunos</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Nome Completo do Personal Trainer</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ex: Vinicius Silva"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Nome da Marca / Consultoria</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  placeholder="Ex: Vinicius Silva · Consultoria Esportiva"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Registro Profissional (CREF com UF)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.cref}
                  onChange={(e) => setFormData({ ...formData, cref: e.target.value })}
                  placeholder="Ex: 041928-G/SP"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] font-mono-metric text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>E-mail Profissional</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: contato@treinador.com"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>WhatsApp de Atendimento com DDD</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatWhatsAppPhone(e.target.value) })}
                  placeholder="(11) 98877-6655"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs font-mono-metric border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-[#c0c1ff]" />
                  <span>Instagram Profissional (@)</span>
                </label>
                <input
                  type="text"
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="Ex: @vinicius.personal"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#c0c1ff]" />
                  <span>URL da Foto de Perfil / Logo</span>
                </label>
                <input
                  type="url"
                  value={formData.avatar_url || ''}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf]">
                  Mini Bio / Apresentação Profissional (Exibida no perfil do aluno)
                </label>
                <textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Descreva sua formação acadêmica, pós-graduações e metodologia de treinamento..."
                  className="w-full p-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Specialties Section */}
            <div className="space-y-3 pt-3 border-t border-[#3c4a42]/40">
              <label className="text-xs font-bold text-[#dae2fd] uppercase font-mono-metric flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ffb95f]" />
                <span>Especialidades & Áreas de Domínio</span>
              </label>

              {/* Current Specialties Chips */}
              <div className="flex flex-wrap gap-2">
                {formData.specialties?.map((spec, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#4edea3] border border-[#4edea3]/30 text-xs font-medium"
                  >
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(spec)}
                      className="hover:text-[#ffb4ab]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Specialty */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialtyInput}
                  onChange={(e) => setNewSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty(newSpecialtyInput))}
                  placeholder="Adicionar especialidade personalizada..."
                  className="flex-1 h-9 px-3 rounded-lg bg-[#0b1326] text-xs text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddSpecialty(newSpecialtyInput)}
                  className="px-3 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-xs text-[#dae2fd] font-semibold flex items-center gap-1 border border-[#3c4a42]/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-[#86948a] mr-1 self-center font-mono-metric">Sugeridos:</span>
                {DEFAULT_SPECIALTIES.filter(s => !formData.specialties?.includes(s)).slice(0, 4).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddSpecialty(sug)}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#0b1326] text-[#bbcabf] hover:text-[#4edea3] hover:border-[#4edea3]/30 border border-[#3c4a42]/40 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Preview Card (Visual do Cartão de Visitas do Coach) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#3c4a42]/40 pb-3">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-bold">
                  Preview: Cartão do Aluno
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              </div>

              <div className="bg-gradient-to-br from-[#1f283d] to-[#0b1326] p-4 rounded-xl border border-[#3c4a42]/60 text-center space-y-3 shadow-inner">
                <img
                  src={formData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={formData.brand_name}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#10b981] shadow-md"
                />
                <div>
                  <h3 className="font-bold text-sm text-[#dae2fd]">{formData.full_name || 'Seu Nome'}</h3>
                  <p className="text-xs text-[#4edea3] font-medium">{formData.brand_name || 'Sua Consultoria'}</p>
                  <span className="font-mono-metric text-[10px] text-[#bbcabf] bg-[#171f33] px-2 py-0.5 rounded-full mt-1 inline-block">
                    CREF {formData.cref || '000000-G/UF'}
                  </span>
                </div>

                <p className="text-[11px] text-[#bbcabf] leading-relaxed line-clamp-3 italic">
                  "{formData.bio || 'Consultoria personalizada de alta performance.'}"
                </p>

                <div className="pt-2 border-t border-[#3c4a42]/40 flex items-center justify-center gap-3 text-xs text-[#bbcabf]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#10b981]" />
                    {formData.phone || '(00) 00000-0000'}
                  </span>
                  {formData.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-[#c0c1ff]" />
                      {formData.instagram}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#0b1326] rounded-xl border border-[#3c4a42]/40 text-xs text-[#bbcabf] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#dae2fd]">
                  <Sparkles className="w-3.5 h-3.5 text-[#ffb95f]" />
                  <span>Selo de Verificação CREF</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Seu registro profissional é carimbado em cada treino gerado e no relatório de evolução do aluno.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: CHAVE PIX & RECEBIMENTOS */}
      {activeTab === 'pix' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#3c4a42]/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#10b981]/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#dae2fd]">Recebimentos Diretos via Pix</h2>
                <p className="text-xs text-[#bbcabf]">Configure sua chave para os alunos pagarem mensalidades sem intermediários</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf]">Tipo de Chave Pix</label>
                <select
                  value={formData.pix_key_type || 'email'}
                  onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value as any })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Telefone / WhatsApp</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf]">Chave Pix Cadastrada</label>
                <input
                  type="text"
                  value={formData.pix_key || ''}
                  onChange={(e) => {
                    const val = formData.pix_key_type === 'telefone' ? formatWhatsAppPhone(e.target.value) : e.target.value;
                    setFormData({ ...formData, pix_key: val });
                  }}
                  placeholder={formData.pix_key_type === 'telefone' ? '(11) 98877-6655' : 'Informe sua chave pix...'}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] font-mono-metric text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ffb95f]">
                  <Zap className="w-4 h-4" />
                  <span>Como funciona para o aluno:</span>
                </div>
                <p className="text-xs text-[#bbcabf] leading-relaxed">
                  Quando o aluno atingir a data de expiração da ficha (3 dias antes do bloqueio), o App PWA exibe um banner de renovação com o botão "Copiar Chave Pix" e direciona o comprovante para o seu WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Pix QR Code Card */}
          <div className="md:col-span-5 bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ffb95f]/20 text-[#ffb95f] flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#dae2fd]">Chave Pix Pronta para Envio</h3>
              <p className="text-xs text-[#bbcabf] mt-1 font-mono-metric">
                {formData.pix_key || 'Nenhuma chave cadastrada'}
              </p>
            </div>

            <div className="p-3 bg-[#0b1326] rounded-xl border border-[#3c4a42]/50 w-full text-xs font-mono-metric text-[#4edea3] truncate">
              {formData.pix_key || 'chave_pix_exemplo@email.com'}
            </div>

            <button
              type="button"
              onClick={() => {
                if (formData.pix_key) {
                  navigator.clipboard.writeText(formData.pix_key);
                  alert('Chave Pix copiada para a área de transferência!');
                }
              }}
              className="w-full py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-bold transition-all border border-[#3c4a42]/50 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Chave Pix</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. TAB 4: REGRAS & BOAS-VINDAS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Automation & Security */}
          <div className="bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#3c4a42]/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#10b981]/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#dae2fd]">Automações de Acesso & Inadimplência</h2>
                <p className="text-xs text-[#bbcabf]">Regras de suspensão automática e controle do banco de dados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40">
                <div>
                  <h4 className="font-bold text-xs text-[#dae2fd]">Bloqueio Automático por Expiração (Auto-Lock)</h4>
                  <p className="text-[11px] text-[#bbcabf] mt-1 leading-relaxed">
                    Bloqueia a visualização da ficha no PWA 24h após a data de expiração, solicitando renovação.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_block_defaulters ?? true}
                  onChange={(e) => setFormData({ ...formData, auto_block_defaulters: e.target.checked })}
                  className="w-5 h-5 accent-[#10b981] rounded cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#bbcabf] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Limite do Roster de Alunos Ativos</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={formData.roster_capacity || 50}
                  onChange={(e) => setFormData({ ...formData, roster_capacity: Number(e.target.value) })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0b1326] text-[#dae2fd] font-mono-metric text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
                <span className="text-[11px] text-[#86948a]">
                  Alerta emitido quando o número de alunos ativos atingir 90% da capacidade.
                </span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#3c4a42]/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ffb95f]/20 text-[#ffb95f] flex items-center justify-center border border-[#ffb95f]/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#dae2fd]">Mensagem de Boas-Vindas no PWA</h2>
                <p className="text-xs text-[#bbcabf]">Texto exibido no topo da tela do aluno ao abrir o aplicativo</p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={formData.welcome_message || ''}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                placeholder="Escreva uma mensagem motivacional de boas-vindas..."
                className="w-full p-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none leading-relaxed"
              />
              <div className="p-3 bg-[#0b1326] rounded-xl border border-[#3c4a42]/40 text-[11px] text-[#bbcabf]">
                <strong>Dica:</strong> Mencione que as dúvidas podem ser tiradas no WhatsApp e reforce o compromisso com a constância nos treinos.
              </div>
            </div>
          </div>

          {/* Account & CREF Info */}
          <div className="bg-[#171f33] rounded-2xl p-6 border border-[#3c4a42]/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#3c4a42]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#10b981]/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#dae2fd]">Identificação do Personal</h2>
                  <p className="text-xs text-[#bbcabf]">Dados cadastrais do profissional responsável pela consultoria</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1326] border border-[#3c4a42]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-[#86948a] block font-mono-metric uppercase">Profissional Conectado:</span>
                <span className="text-sm font-bold text-[#dae2fd]">{formData.full_name} ({formData.brand_name})</span>
                <span className="text-xs text-[#4edea3] block font-mono-metric">E-mail: {formData.email} • CREF: {formData.cref}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2 rounded-xl bg-[#ba1a1a]/20 hover:bg-[#ba1a1a] text-[#ffb4ab] hover:text-white border border-[#ba1a1a]/40 text-xs font-bold transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
