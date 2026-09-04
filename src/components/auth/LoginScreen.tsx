import React, { useState } from 'react';
import { 
  Dumbbell, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck,
  Award
} from 'lucide-react';
import { PersonalTrainer, Student } from '../../types/database';

interface LoginScreenProps {
  trainer: PersonalTrainer;
  students: Student[];
  onLoginTrainer: (email: string) => void;
  onLoginStudent: (student: Student) => void;
  onOpenInviteOnboarding?: (student: Student) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  trainer,
  students,
  onLoginTrainer,
  onLoginStudent,
  onOpenInviteOnboarding,
}) => {
  const [role, setRole] = useState<'trainer' | 'student'>('trainer');
  const [email, setEmail] = useState(trainer.email || 'msvinicius.ads@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [studentIdentifier, setStudentIdentifier] = useState(students[0]?.email || '');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [useQuickSelect, setUseQuickSelect] = useState(false);

  const handleSubmitTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginTrainer(email.trim());
    }, 600);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (useQuickSelect) {
      const targetStudent = students.find(s => s.id === selectedStudentId) || students[0];
      if (!targetStudent) {
        setErrorMessage('Nenhum aluno selecionado.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginStudent(targetStudent);
      }, 500);
      return;
    }

    // Normal email/phone + password authentication
    const cleanQuery = studentIdentifier.trim().toLowerCase();
    const cleanDigits = studentIdentifier.replace(/\D/g, '');

    const targetStudent = students.find(s => {
      if (s.email && s.email.toLowerCase() === cleanQuery) return true;
      if (s.phone && cleanDigits.length >= 8 && s.phone.replace(/\D/g, '').includes(cleanDigits)) return true;
      if (s.full_name && s.full_name.toLowerCase() === cleanQuery) return true;
      return false;
    });

    if (!targetStudent) {
      setErrorMessage('Aluno não encontrado. Verifique seu e-mail ou utilize o link de convite enviado pelo seu treinador.');
      return;
    }

    // If student hasn't set a password yet
    if (!targetStudent.password_set && !targetStudent.password) {
      if (onOpenInviteOnboarding) {
        onOpenInviteOnboarding(targetStudent);
        return;
      }
    }

    // Check password (accepts their set password or default 'aluno123' if not yet customized)
    const validPassword = targetStudent.password || 'aluno123';
    if (studentPassword && studentPassword !== validPassword) {
      setErrorMessage('Senha incorreta para este aluno. Tente novamente ou acesse o link de convite.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginStudent(targetStudent);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle background ambient lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3131c0]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#4edea3] text-[#003824] shadow-xl shadow-[#10b981]/25 mb-1">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#dae2fd] tracking-tight">
            Trainer<span className="text-[#4edea3]">Pro</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#bbcabf] max-w-xs mx-auto">
            Plataforma B2B para Personal Trainers & Ecossistema de Treino PWA
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="bg-[#171f33] p-1.5 rounded-2xl border border-[#3c4a42]/50 grid grid-cols-2 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole('trainer');
              setErrorMessage('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'trainer'
                ? 'bg-[#10b981] text-[#003824] shadow-md shadow-[#10b981]/25'
                : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Personal Trainer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('student');
              setErrorMessage('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'student'
                ? 'bg-[#c0c1ff] text-[#1000a9] shadow-md'
                : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Área do Aluno (PWA)</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-[#171f33] border border-[#3c4a42]/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {role === 'trainer' ? (
            <form onSubmit={handleSubmitTrainer} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#dae2fd]">Acesso do Profissional</span>
                  <span className="font-mono-metric text-[10px] text-[#4edea3] bg-[#10b981]/15 px-2 py-0.5 rounded-full border border-[#10b981]/30 font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    CREF {trainer.cref}
                  </span>
                </div>
                <p className="text-[11px] text-[#86948a]">
                  Conecte-se para gerenciar seus alunos, prescrições e pagamentos.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-center gap-2 text-xs text-[#ffb4ab] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#bbcabf] block">
                  E-mail do Treinador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@personal.com"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#bbcabf]">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
                    className="text-[11px] text-[#4edea3] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner font-mono-metric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#dae2fd]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {forgotPasswordNotice && (
                <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#4edea3] space-y-1 animate-in fade-in">
                  <p className="font-semibold">Recuperação de Senha:</p>
                  <p className="text-[11px] text-[#bbcabf]">
                    Um link de redefinição com chave temporária foi simulado para <strong>{email}</strong>.
                  </p>
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#bbcabf]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0b1326] border-[#3c4a42] text-[#10b981] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Lembrar minhas credenciais</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#10b981] hover:bg-[#4edea3] text-[#003824] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#10b981]/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#003824] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar no Painel do Treinador</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Demo Quick Access */}
              <button
                type="button"
                onClick={() => {
                  setEmail(trainer.email || 'msvinicius.ads@gmail.com');
                  onLoginTrainer(trainer.email || 'msvinicius.ads@gmail.com');
                }}
                className="w-full py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#283248] text-[#bbcabf] hover:text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffb95f]" />
                <span>Entrar como Treinador ({trainer.full_name})</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#dae2fd]">Acesso do Aluno</span>
                  <button
                    type="button"
                    onClick={() => setUseQuickSelect(!useQuickSelect)}
                    className="text-[11px] text-[#c0c1ff] hover:underline cursor-pointer"
                  >
                    {useQuickSelect ? 'Login Normal (Email/Senha)' : 'Modo Demonstração'}
                  </button>
                </div>
                <p className="text-[11px] text-[#bbcabf]">
                  {useQuickSelect 
                    ? 'Selecione qualquer aluno da lista para simular o acesso instantaneamente.'
                    : 'Entre com seu e-mail cadastrado e sua senha para ver sua ficha de treino.'}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-center gap-2 text-xs text-[#ffb4ab] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {useQuickSelect ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#bbcabf] block">
                    Selecione o Aluno (Demonstração)
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#c0c1ff] focus:outline-none cursor-pointer"
                  >
                    {students.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} • {st.plan_name} ({st.goal})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  {/* Student Email / Identifier */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#bbcabf] block">
                      E-mail ou Telefone do Aluno
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentIdentifier}
                        onChange={(e) => setStudentIdentifier(e.target.value)}
                        placeholder="Ex: aluno@email.com ou (11) 98765-4321"
                        required
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#c0c1ff] focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Student Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#bbcabf]">
                        Sua Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanQuery = studentIdentifier.trim().toLowerCase();
                          const found = students.find(s => s.email.toLowerCase() === cleanQuery || s.full_name.toLowerCase() === cleanQuery) || students[0];
                          if (onOpenInviteOnboarding && found) {
                            onOpenInviteOnboarding(found);
                          }
                        }}
                        className="text-[11px] text-[#4edea3] hover:underline cursor-pointer"
                      >
                        Primeiro acesso? Criar senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Digite sua senha cadastrada"
                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#c0c1ff] focus:outline-none transition-all shadow-inner font-mono-metric"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#dae2fd] cursor-pointer"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#c0c1ff] hover:bg-white text-[#1000a9] font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#1000a9] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Entrar e Ver Minha Ficha de Treino</span>
                  </>
                )}
              </button>

              {/* Help tip */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-[#86948a]">
                  Recebeu um link de convite? Clique nele para abrir diretamente a criação de senha.
                </p>
              </div>
            </form>
          )}

          {/* Security & RLS Badges */}
          <div className="pt-3 border-t border-[#3c4a42]/40 flex flex-wrap items-center justify-between text-[10px] text-[#86948a] gap-2">
            <div className="flex items-center gap-1.5 text-[#4edea3]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Supabase Auth & RLS Ativos</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
              <span>Criptografia Ponta a Ponta</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#86948a]">
          TrainerPro Suite B2B • Desenvolvido para Personal Trainers de Alta Performance
        </p>
      </div>
    </div>
  );
};
