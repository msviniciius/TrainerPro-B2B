import React, { useState } from 'react';
import { 
  Dumbbell, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Calendar,
  Target,
  ShieldCheck,
  User,
  Mail,
  Smartphone,
  Award,
  Flame,
  Check
} from 'lucide-react';
import { PersonalTrainer, Student } from '../../types/database';

interface StudentSetPasswordScreenProps {
  student: Student;
  trainer: PersonalTrainer;
  onComplete: (updatedStudent: Student, password: string) => void;
  onCancelOrLogin: () => void;
}

export const StudentSetPasswordScreen: React.FC<StudentSetPasswordScreenProps> = ({
  student,
  trainer,
  onComplete,
  onCancelOrLogin,
}) => {
  const [email, setEmail] = useState(student.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vazia', color: 'bg-[#3c4a42]' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Fraca (mínimo 6 dígitos)', color: 'bg-[#ffb4ab]' };
    if (score === 2) return { score: 2, label: 'Média', color: 'bg-[#ffb95f]' };
    return { score: 3, label: 'Forte e Segura', color: 'bg-[#10b981]' };
  };

  const strength = getPasswordStrength(password);
  const isMatch = password && confirmPassword && password === confirmPassword;
  const isDifferent = confirmPassword && password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setIsLoading(true);

    const updatedStudent: Student = {
      ...student,
      email: email.trim() || student.email,
      password: password,
      password_set: true,
      is_active: true,
    };

    setTimeout(() => {
      setIsLoading(false);
      onComplete(updatedStudent, password);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3131c0]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg space-y-5 relative z-10">
        {/* Brand & Trainer Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#4edea3] text-[#003824] shadow-xl shadow-[#10b981]/25 mb-1">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-metric text-xs uppercase tracking-wider text-[#4edea3] font-bold bg-[#4edea3]/10 px-2.5 py-0.5 rounded-full border border-[#4edea3]/20">
              Primeiro Acesso • Ativação de Conta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#dae2fd] tracking-tight">
            Olá, <span className="text-[#4edea3]">{student.full_name}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#bbcabf] max-w-sm mx-auto">
            Seu treinador <strong>{trainer.full_name}</strong> liberou sua ficha de treino. Crie sua senha para acessar o app web.
          </p>
        </div>

        {/* Workout Plan Preview Teaser Card */}
        <div className="bg-[#171f33] border border-[#3c4a42]/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#3c4a42]/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffb95f]" />
              <span className="text-xs font-bold text-[#dae2fd]">Sua Ficha de Treino está Pronta</span>
            </div>
            <span className="font-mono-metric text-[10px] text-[#4edea3] bg-[#10b981]/20 px-2 py-0.5 rounded-full font-bold">
              Prescrição Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40">
              <Target className="w-4 h-4 text-[#4edea3] flex-shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[#86948a] font-mono-metric uppercase">Objetivo</span>
                <span className="font-bold text-[#dae2fd] truncate block">{student.goal}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40">
              <Calendar className="w-4 h-4 text-[#c0c1ff] flex-shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[#86948a] font-mono-metric uppercase">Plano & Vigência</span>
                <span className="font-bold text-[#dae2fd] truncate block">
                  {student.plan_name} • Até {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#bbcabf] pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" />
            <span>Séries, cargas alvo, cadência e vídeos biomecânicos configurados</span>
          </div>
        </div>

        {/* Set Password Form */}
        <div className="bg-[#171f33] border border-[#3c4a42]/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-[#dae2fd]">
                Cadastre sua Senha de Acesso
              </h2>
              <p className="text-[11px] text-[#86948a]">
                Você utilizará seu e-mail e esta senha para entrar no app sempre que quiser treinar.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-center gap-2 text-xs text-[#ffb4ab] animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email field (Editable if student wishes to correct) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#bbcabf] flex justify-between">
                <span>E-mail de Login</span>
                <span className="text-[11px] text-[#86948a]">Cadastrado pelo treinador</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu.email@exemplo.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#bbcabf] block">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha segura"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner font-mono-metric"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#dae2fd] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[#bbcabf]">
                    <span>Segurança: <strong>{strength.label}</strong></span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 h-1.5">
                    <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-[#222a3d]'}`}></div>
                    <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-[#222a3d]'}`}></div>
                    <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-[#222a3d]'}`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#bbcabf] flex items-center justify-between">
                <span>Confirmar Nova Senha</span>
                {isMatch && (
                  <span className="text-[11px] text-[#4edea3] flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Senhas coincidem
                  </span>
                )}
                {isDifferent && (
                  <span className="text-[11px] text-[#ffb4ab]">
                    Não coincide
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className={`w-full h-11 pl-10 pr-10 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs sm:text-sm border ${
                    isMatch 
                      ? 'border-[#10b981]' 
                      : isDifferent 
                      ? 'border-[#ffb4ab]' 
                      : 'border-[#3c4a42]/60'
                  } focus:outline-none transition-all shadow-inner font-mono-metric`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#dae2fd] cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#bbcabf]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0b1326] border-[#3c4a42] text-[#10b981] focus:ring-0 cursor-pointer"
                />
                <span>Lembrar meu login neste dispositivo</span>
              </label>
            </div>

            {/* Action Button: Criar Senha e Ver Minha Ficha */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] hover:brightness-110 text-[#003824] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#10b981]/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#003824] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Criar Senha e Ver Minha Ficha de Treino</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Back to Login option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancelOrLogin}
                className="text-xs text-[#bbcabf] hover:text-[#4edea3] transition-colors underline cursor-pointer"
              >
                Já possui uma senha cadastrada? Fazer login direto
              </button>
            </div>
          </form>

          {/* Security details */}
          <div className="pt-3 border-t border-[#3c4a42]/40 flex flex-wrap items-center justify-between text-[10px] text-[#86948a] gap-2">
            <div className="flex items-center gap-1.5 text-[#4edea3]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acesso Criptografado & PWA Seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-[#ffb95f]" />
              <span>CREF {trainer.cref}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#86948a]">
          TrainerPro Suite B2B • App Oficial de Acompanhamento e Prescrição
        </p>
      </div>
    </div>
  );
};
