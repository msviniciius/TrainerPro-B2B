import React, { useState, useEffect, useRef } from 'react';
import { Student, WorkoutPlan, WorkoutExercise, ExerciseLog, PersonalTrainer } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';
import { soundManager } from '../../utils/audio';
import { lockScreenManager } from '../../utils/lockScreenManager';
import { getExerciseGifUrl } from '../../utils/exerciseMedia';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { 
  Dumbbell, 
  Lock, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Brain, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  Info, 
  Trophy, 
  Volume2, 
  VolumeX, 
  X,
  History,
  Sparkles,
  Smartphone,
  Bell,
  BellRing,
  Copy,
  CreditCard,
  LogOut,
  ClipboardList,
  MessageCircle,
  Radio
} from 'lucide-react';

interface StudentPWAProps {
  student: Student;
  workoutPlans: WorkoutPlan[];
  onLogExerciseSet: (log: Partial<ExerciseLog>) => void;
  onExitPWA?: () => void;
  onLogout?: () => void;
  onUpdateStudent?: (id: string, updates: Partial<Student>) => void;
  trainer?: PersonalTrainer;
}

interface ActiveSetState {
  completed: boolean;
  actualReps: string | number;
  actualWeight: string | number;
}

export const StudentPWA: React.FC<StudentPWAProps> = ({
  student,
  workoutPlans,
  onLogExerciseSet,
  onExitPWA,
  onLogout,
  onUpdateStudent,
  trainer,
}) => {
  const [activeSplitDay, setActiveSplitDay] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedPix, setCopiedPix] = useState(false);

  // Active workout plan
  const currentPlan = workoutPlans.find(p => p.split_day === activeSplitDay) || workoutPlans[0];

  // Access Guard Evaluation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(student.access_expiration_date);
  expDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isBlocked = (isExpired && student.auto_lock) || !student.is_active;
  const isExpiring = !isBlocked && diffDays >= 0 && diffDays <= 5;

  // Local state for logged sets in current session: { [exerciseId-setIndex]: ActiveSetState }
  const [sessionSets, setSessionSets] = useState<Record<string, ActiveSetState>>({});

  // Sticky Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(60);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(0);
  const [lastFinishedTimer, setLastFinishedTimer] = useState(false);
  const [showManualTimerPresets, setShowManualTimerPresets] = useState(false);

  // Active Exercise Tracker for Lock Screen & UI
  const [currentActiveExercise, setCurrentActiveExercise] = useState<{
    id: string;
    name: string;
    target_sets: number;
    target_reps: string;
    target_weight: number;
    current_set?: number;
  } | null>(null);

  // Lock Screen & Notification Permissions
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    lockScreenManager.getNotificationPermission()
  );
  const [showLockScreenHelp, setShowLockScreenHelp] = useState(false);

  // Finished Session Modal
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [sessionRPE, setSessionRPE] = useState<number>(8.5);

  // Set action callbacks for Lock Screen controls (Play/Pause, +30s, -15s, Restart)
  useEffect(() => {
    lockScreenManager.setActionCallbacks({
      onPlay: () => setIsTimerPaused(false),
      onPause: () => setIsTimerPaused(true),
      onAddSeconds: (delta) => handleAdjustTimer(delta || 30),
      onSubtractSeconds: (delta) => handleAdjustTimer(-(delta || 15)),
      onRestart: () => handleRestartTimer(),
    });
  }, [timerTotalSeconds]);

  // Sync Lock Screen Media Widget with active exercise and rest timer
  useEffect(() => {
    if (currentPlan) {
      const defaultEx = currentPlan.exercises[0];
      const activeEx = currentActiveExercise || (defaultEx ? {
        id: defaultEx.exercise_id,
        name: defaultEx.exercise?.name || 'Exercício',
        target_sets: defaultEx.target_sets,
        target_reps: defaultEx.target_reps,
        target_weight: defaultEx.target_weight_kg || 0,
        current_set: 1,
      } : null);

      const exName = activeEx?.name || 'Exercício de Musculação';
      const artworkUrl = activeEx?.id ? getExerciseGifUrl(activeEx.id) : undefined;
      const setLabel = activeEx?.current_set
        ? `Série ${activeEx.current_set}/${activeEx.target_sets} (${activeEx.target_reps} reps • ${activeEx.target_weight}kg)`
        : `Alvo: ${activeEx?.target_sets || 4} séries • ${activeEx?.target_reps || '10-12'} reps`;

      if (timerActive || lastFinishedTimer) {
        lockScreenManager.updateLockScreen({
          exerciseName: exName,
          setInfo: lastFinishedTimer
            ? '✅ Descanso Concluído! Inicie a próxima série'
            : `⏱️ ${formatTime(timerSecondsRemaining)} • ${setLabel}`,
          planName: `Treino ${activeSplitDay} - ${currentPlan.name}`,
          artworkUrl,
          isResting: true,
          restSecondsRemaining: timerSecondsRemaining,
          restTotalSeconds: timerTotalSeconds,
          isPaused: isTimerPaused,
        });
      } else {
        lockScreenManager.updateLockScreen({
          exerciseName: exName,
          setInfo: `Pronto para iniciar • ${setLabel}`,
          planName: `Treino ${activeSplitDay} - ${currentPlan.name}`,
          artworkUrl,
          isResting: false,
          restSecondsRemaining: 0,
          restTotalSeconds: 0,
          isPaused: false,
        });
      }
    }
  }, [
    timerActive,
    timerSecondsRemaining,
    isTimerPaused,
    lastFinishedTimer,
    activeSplitDay,
    currentPlan,
    currentActiveExercise,
    timerTotalSeconds,
  ]);

  // Timer interval effect - robust countdown with lock screen notification at zero
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && !isTimerPaused) {
      interval = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            setTimerActive(false);
            setIsTimerPaused(false);
            setLastFinishedTimer(true);
            
            if (soundEnabled) {
              soundManager.playCompletionChime();
              soundManager.triggerVibration([200, 100, 200, 100, 300]);
            }

            // Trigger Lock Screen Notification
            const exName = currentActiveExercise?.name || 'Próximo Exercício';
            const nextSetNumber = (currentActiveExercise?.current_set || 1) + 1;
            const nextInfo = currentActiveExercise?.target_sets && nextSetNumber <= currentActiveExercise.target_sets
              ? `Próxima: Série ${nextSetNumber}/${currentActiveExercise.target_sets}`
              : 'Pronto para a próxima série';

            lockScreenManager.notifyRestCompleted(
              exName,
              `${nextInfo} • O tempo de descanso zerou!`
            );

            return 0;
          }

          // 3, 2, 1 warning beeps
          if (prev <= 4 && prev > 1 && soundEnabled) {
            soundManager.playCountdownBeep(prev === 2 ? 1046 : 880);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, isTimerPaused, soundEnabled, currentActiveExercise]);

  // Auto-dismiss finished timer banner after 8s if untouched
  useEffect(() => {
    if (lastFinishedTimer) {
      const dismissTimeout = setTimeout(() => {
        setLastFinishedTimer(false);
      }, 8000);
      return () => clearTimeout(dismissTimeout);
    }
  }, [lastFinishedTimer]);

  // Clean up lock screen media on unmount
  useEffect(() => {
    return () => {
      lockScreenManager.clearLockScreen();
    };
  }, []);

  // Start rest timer with a given duration
  const triggerRestTimer = (seconds: number) => {
    const validSec = Math.max(5, Number(seconds) || 60);
    setTimerTotalSeconds(validSec);
    setTimerSecondsRemaining(validSec);
    setIsTimerPaused(false);
    setTimerActive(true);
    setLastFinishedTimer(false);
    setShowManualTimerPresets(false);
  };

  // Adjust timer seconds (+30s / -15s)
  const handleAdjustTimer = (delta: number) => {
    setTimerSecondsRemaining(prev => {
      const next = Math.max(0, prev + delta);
      setTimerTotalSeconds(tot => Math.max(tot, next));
      if (next > 0 && !timerActive) {
        setTimerActive(true);
        setLastFinishedTimer(false);
      }
      return next;
    });
  };

  // Restart current timer
  const handleRestartTimer = () => {
    setTimerSecondsRemaining(timerTotalSeconds || 60);
    setIsTimerPaused(false);
    setTimerActive(true);
    setLastFinishedTimer(false);
  };

  // Handle Set Toggle
  const handleToggleSet = (workoutExercise: WorkoutExercise, setIndex: number, defaultReps: string, defaultWeight: number) => {
    const key = `${workoutExercise.id}-${setIndex}`;
    const current = sessionSets[key] || {
      completed: false,
      actualReps: defaultReps.split('-')[0].trim(),
      actualWeight: defaultWeight,
    };

    const nextCompleted = !current.completed;

    setSessionSets(prev => ({
      ...prev,
      [key]: {
        ...current,
        completed: nextCompleted,
      }
    }));

    if (nextCompleted) {
      // Track currently active exercise for Lock Screen & UI
      setCurrentActiveExercise({
        id: workoutExercise.exercise_id,
        name: workoutExercise.exercise?.name || 'Exercício',
        target_sets: workoutExercise.target_sets,
        target_reps: defaultReps,
        target_weight: defaultWeight,
        current_set: setIndex + 1,
      });

      // Log set
      onLogExerciseSet({
        student_id: student.id,
        workout_exercise_id: workoutExercise.id,
        exercise_id: workoutExercise.exercise_id,
        exercise_name: workoutExercise.exercise?.name || 'Exercício',
        split_day: activeSplitDay,
        set_number: setIndex + 1,
        actual_reps: Number(current.actualReps) || 10,
        actual_weight_kg: Number(current.actualWeight) || defaultWeight,
        previous_weight_kg: defaultWeight,
        rpe_rating: 8.0,
      });

      // Start sticky rest timer
      const restSec = workoutExercise.rest_seconds || 60;
      triggerRestTimer(restSec);
    }
  };

  // Update input reps/weight
  const handleUpdateSetInput = (workoutExerciseId: string, setIndex: number, field: 'actualReps' | 'actualWeight', value: string) => {
    const key = `${workoutExerciseId}-${setIndex}`;
    setSessionSets(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { completed: false, actualReps: 10, actualWeight: 20 }),
        [field]: value,
      }
    }));
  };

  // Compute completed sets in current plan
  const totalSetsInPlan = currentPlan?.exercises.reduce((sum, e) => sum + e.target_sets, 0) || 0;
  const completedSetsCount = Object.entries(sessionSets).filter(([k, v]) => {
    const setState = v as ActiveSetState;
    return setState.completed && currentPlan?.exercises.some(e => k.startsWith(e.id));
  }).length;

  const progressPercent = totalSetsInPlan > 0 ? Math.round((completedSetsCount / totalSetsInPlan) * 100) : 0;

  // Format timer MM:SS with strict safeguards
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const trainerName = trainer?.full_name || 'Rodrigo Fontes';
  const trainerCref = trainer?.cref || '041928-G/SP';
  const trainerPhone = trainer?.phone ? trainer.phone.replace(/\D/g, '') : '5511988776655';
  const trainerPix = trainer?.pix_key || 'rodrigo.fontes@treinador.com';

  // WhatsApp renew link
  const renewWhatsAppMessage = `Olá Professor ${trainerName.split(' ')[0]}! Meu acesso ao app venceu ou está prestes a vencer. Gostaria de renovar meu plano (${student.plan_name}) para continuar os treinos!`;
  const renewWhatsAppUrl = `https://wa.me/${trainerPhone}?text=${encodeURIComponent(renewWhatsAppMessage)}`;

  // -------------------------------------------------------------
  // RENDER: BLOCKED / EXPIRED ACCESS GUARD
  // -------------------------------------------------------------
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#93000a]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#3131c0]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Exit Preview pill if simulated in desktop */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {onExitPWA && (
            <button
              onClick={onExitPWA}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171f33] text-[#bbcabf] text-xs font-semibold border border-[#3c4a42]/50 hover:text-white"
            >
              ← Voltar ao Painel
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ba1a1a]/20 text-[#ffb4ab] text-xs font-semibold border border-[#ba1a1a]/40 hover:bg-[#ba1a1a] hover:text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair (Login)</span>
            </button>
          )}
        </div>

        <div className="w-full max-w-md bg-[#171f33] rounded-3xl p-6 sm:p-8 border border-[#93000a]/40 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-[#93000a]/30 text-[#ffb4ab] flex items-center justify-center mx-auto border border-[#ffb4ab]/30 shadow-lg shadow-[#93000a]/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="font-mono-metric text-[11px] uppercase font-bold text-[#ffb4ab] tracking-wider bg-[#93000a]/30 px-3 py-1 rounded-full border border-[#ffb4ab]/20">
              Acesso Temporariamente Suspenso
            </span>
            <h1 className="text-xl font-bold text-[#dae2fd]">
              Olá, {student.full_name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              O seu plano <strong className="text-[#dae2fd]">{student.plan_name}</strong> expirou em{' '}
              <strong className="text-[#ffb4ab]">
                {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
              </strong>
              . Renove sua assinatura com o Personal Trainer para reativar seu acesso.
            </p>
          </div>

          {/* Trainer Card */}
          <div className="p-3.5 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/50 text-left space-y-2">
            <div className="flex items-center gap-3">
              {trainer?.avatar_url ? (
                <img src={trainer.avatar_url} alt={trainerName} className="w-10 h-10 rounded-full object-cover border border-[#4edea3]/40" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center font-bold text-sm">
                  {trainerName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#dae2fd] block truncate">{trainerName}</span>
                <span className="font-mono-metric text-[11px] text-[#4edea3]">CREF {trainerCref}</span>
              </div>
            </div>

            {trainer?.pix_key && (
              <div className="pt-2 border-t border-[#3c4a42]/40 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono-metric text-[#86948a] block">Chave Pix ({trainer.pix_key_type || 'Email'})</span>
                  <span className="font-mono-metric text-xs text-[#dae2fd] truncate block font-medium">{trainer.pix_key}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(trainer.pix_key || '');
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-xs font-mono-metric text-[#4edea3] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>

          <a
            href={renewWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Falar com o Personal no WhatsApp</span>
          </a>

          {/* Trainer override demo button */}
          {onUpdateStudent && (
            <button
              onClick={() => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 90);
                onUpdateStudent(student.id, {
                  access_expiration_date: futureDate.toISOString().split('T')[0],
                  is_active: true,
                });
              }}
              className="text-xs text-[#86948a] hover:text-[#4edea3] underline font-mono-metric pt-1 block mx-auto"
            >
              [Demo Coach: Reativar +90 dias com 1 clique]
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PENDING WORKOUT PRESCRIPTION (NO PLAN PRESCRIBED YET)
  // -------------------------------------------------------------
  const hasExercisesInPlan = workoutPlans && workoutPlans.some(p => p.exercises && p.exercises.length > 0);
  if (!hasExercisesInPlan) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#3131c0]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar with back / logout */}
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#171f33] border border-[#3c4a42]/50 flex items-center justify-center text-[#4edea3]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#dae2fd] block">TrainerPro</span>
              <span className="font-mono-metric text-[10px] text-[#4edea3]">Consultoria de Treinamento</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExitPWA && (
              <button
                onClick={onExitPWA}
                className="px-2.5 py-1 rounded-xl bg-[#171f33] hover:bg-[#222a3d] text-[#c0c1ff] text-xs font-semibold border border-[#3c4a42]/40 transition-colors cursor-pointer"
              >
                Painel do Treinador
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#ba1a1a]/20 text-[#ffb4ab] hover:bg-[#ba1a1a] hover:text-white transition-all border border-[#ba1a1a]/30 cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pending Card */}
        <div className="w-full max-w-md bg-[#171f33] rounded-3xl p-6 sm:p-8 border border-[#3c4a42]/60 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-[#ffb95f]/15 text-[#ffb95f] flex items-center justify-center mx-auto border border-[#ffb95f]/30 shadow-lg shadow-[#ffb95f]/10">
            <ClipboardList className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono-metric text-[11px] uppercase font-bold text-[#ffb95f] tracking-wider bg-[#ffb95f]/15 px-3 py-1 rounded-full border border-[#ffb95f]/30 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffb95f] animate-pulse"></span>
              Ficha em Elaboração
            </span>
            <h1 className="text-xl font-bold text-[#dae2fd]">
              Olá, {student.full_name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Seu acesso à consultoria está <strong className="text-[#4edea3]">100% ativo</strong>. O Professor <strong className="text-[#dae2fd]">{trainerName}</strong> está elaborando sua periodização personalizada de treinos.
            </p>
            <p className="text-xs text-[#86948a] leading-relaxed">
              Assim que o seu treino for prescrito e liberado pelo treinador, sua ficha com exercícios, vídeos e séries aparecerá aqui automaticamente!
            </p>
          </div>

          {/* Student plan details */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40">
              <span className="text-[10px] uppercase font-mono-metric text-[#86948a] block">Objetivo</span>
              <span className="text-xs font-bold text-[#dae2fd] truncate block">{student.goal || 'Hipertrofia'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40">
              <span className="text-[10px] uppercase font-mono-metric text-[#86948a] block">Plano Contratado</span>
              <span className="text-xs font-bold text-[#4edea3] truncate block">{student.plan_name || 'Consultoria'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40">
              <span className="text-[10px] uppercase font-mono-metric text-[#86948a] block">Acesso Válido Até</span>
              <span className="text-xs font-bold text-[#dae2fd] truncate block">
                {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40">
              <span className="text-[10px] uppercase font-mono-metric text-[#86948a] block">Status da Ficha</span>
              <span className="text-xs font-bold text-[#ffb95f] truncate block">Aguardando Prescrição</span>
            </div>
          </div>

          {/* Coach info & direct contact */}
          <div className="p-3.5 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/50 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {trainer?.avatar_url ? (
                <img src={trainer.avatar_url} alt={trainerName} className="w-10 h-10 rounded-full object-cover border border-[#4edea3]/40 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {trainerName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#dae2fd] block truncate">{trainerName}</span>
                <span className="font-mono-metric text-[11px] text-[#4edea3]">CREF {trainerCref}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${trainerPhone}?text=${encodeURIComponent(`Olá Professor ${trainerName.split(' ')[0]}! Acabei de ativar meu acesso ao app do aluno e gostaria de falar sobre a montagem da minha ficha de treino.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#4edea3] text-xs font-bold flex items-center gap-1.5 border border-[#4edea3]/40 flex-shrink-0 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="pt-2">
            <PWAInstallButton studentName={student.full_name} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: ACTIVE PWA APP FOR STUDENT
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] pb-32 flex flex-col items-center">
      {/* Container simulating smartphone max-w */}
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-[#0f172a] shadow-2xl relative">
        
        {/* Top Floating App Bar */}
        <div className="sticky top-0 z-40 bg-[#171f33]/95 backdrop-blur-md px-4 py-3 border-b border-[#3c4a42]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#4edea3] flex items-center justify-center text-[#003824] font-bold shadow-md">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-[#dae2fd] leading-tight">
                TrainerPro
              </span>
              <span className="font-mono-metric text-[10px] text-[#4edea3] font-semibold">
                {student.full_name.split(' ')[0]} • Ciclo Ativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (notificationPermission !== 'granted') {
                  const perm = await lockScreenManager.requestNotificationPermission();
                  setNotificationPermission(perm);
                }
                setShowLockScreenHelp(true);
              }}
              className={`p-2 rounded-xl border transition-all ${
                notificationPermission === 'granted'
                  ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#4edea3]'
                  : 'bg-[#222a3d] border-[#3c4a42]/40 text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
              title="Widget de Tela de Bloqueio & Notificações"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd]"
              title={soundEnabled ? 'Som ativado' : 'Som mudo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#4edea3]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onExitPWA && (
              <button
                onClick={onExitPWA}
                className="px-2.5 py-1.5 rounded-xl bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] text-xs font-semibold border border-[#3c4a42]/40"
              >
                Coach View
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#ba1a1a]/20 text-[#ffb4ab] hover:bg-[#ba1a1a] hover:text-white transition-all border border-[#ba1a1a]/30"
                title="Sair (Ir para a tela de Login)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expiring Soon Banner (< 5 days) */}
        {isExpiring && (
          <div className="bg-gradient-to-r from-[#e29100]/20 via-[#ffb95f]/20 to-[#e29100]/20 border-b border-[#ffb95f]/40 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#ffb95f] flex-shrink-0" />
              <p className="text-xs text-[#ffb95f] font-medium truncate">
                Seu plano vence em <strong>{diffDays} dias</strong> ({new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}).
              </p>
            </div>
            <a
              href={renewWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-[#ffb95f] text-[#472a00] font-mono-metric text-[11px] font-bold hover:brightness-110 whitespace-nowrap"
            >
              Renovar
            </a>
          </div>
        )}

        {/* Workout Split Selector Pills (A, B, C, D) */}
        <div className="p-4 bg-[#131b2e] border-b border-[#3c4a42]/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-metric text-[11px] uppercase tracking-wider text-[#86948a] font-semibold">
              Selecione o Treino do Dia
            </span>
            <span className="font-mono-metric text-xs text-[#4edea3] font-bold">
              {progressPercent}% Concluído
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map(day => {
              const plan = workoutPlans.find(p => p.split_day === day);
              const isActive = activeSplitDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveSplitDay(day)}
                  className={`py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#10b981] text-[#003824] shadow-lg shadow-[#10b981]/20 font-bold'
                      : 'bg-[#1f293d] text-[#bbcabf] hover:bg-[#2d3748]'
                  }`}
                >
                  <span className="font-mono-metric text-sm font-bold">Treino {day}</span>
                  <span className="text-[10px] opacity-80 truncate max-w-[70px]">
                    {plan?.focus_muscle.split('&')[0] || `Divisão ${day}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Session Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-[#2d3449] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] to-[#4edea3] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Workout Plan Summary */}
        <div className="px-4 py-3 bg-[#171f33] border-b border-[#3c4a42]/30 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#dae2fd]">
              {currentPlan?.title || `Treino ${activeSplitDay}`}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#bbcabf] mt-0.5">
              <span className="flex items-center gap-1 font-mono-metric">
                <Clock className="w-3.5 h-3.5 text-[#86948a]" />
                {currentPlan?.estimated_duration_min || 50} min
              </span>
              <span>•</span>
              <span className="font-mono-metric text-[#ffb95f]">
                RPE Alvo: {currentPlan?.target_rpe || 8.5}/10
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFinishedModal(true)}
            disabled={completedSetsCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 shadow-md disabled:opacity-40 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar</span>
          </button>
        </div>

        {/* Exercise Cards Stack */}
        <div className="p-4 space-y-4 flex-1">
          {currentPlan?.exercises.map((workoutExercise, exIndex) => {
            const exercise = workoutExercise.exercise || EXERCISES_DATABASE.find(e => e.id === workoutExercise.exercise_id);
            const isFinishedAllSets = Array.from({ length: workoutExercise.target_sets }).every((_, i) => sessionSets[`${workoutExercise.id}-${i}`]?.completed);

            return (
              <div
                key={workoutExercise.id}
                className={`bg-[#171f33] rounded-2xl overflow-hidden border transition-all ${
                  isFinishedAllSets
                    ? 'border-[#10b981]/60 shadow-lg shadow-[#10b981]/5'
                    : 'border-[#3c4a42]/50 shadow-md'
                }`}
              >
                {/* Exercise Media Header */}
                <div className="relative w-full h-48 bg-[#0b1326] overflow-hidden">
                  {exercise && (
                    <ExerciseMedia
                      exerciseId={exercise.id}
                      name={exercise.name}
                      showBadges={false}
                      className="w-full h-full"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171f33] via-transparent to-black/40 pointer-events-none"></div>

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0b1326]/90 backdrop-blur-md text-[#4edea3] font-mono-metric font-bold text-xs flex items-center justify-center border border-[#3c4a42]/50">
                      #{exIndex + 1}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#0b1326]/90 backdrop-blur-md text-[#dae2fd] font-mono-metric text-xs font-semibold">
                      {exercise?.target_muscle}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => triggerRestTimer(workoutExercise.rest_seconds || 60)}
                      className="px-2.5 py-1 rounded-lg bg-[#0b1326]/90 backdrop-blur-md text-[#ffb95f] hover:text-[#4edea3] hover:bg-[#0b1326] border border-[#ffb95f]/30 hover:border-[#4edea3]/40 font-mono-metric text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="Clique para iniciar o cronômetro de descanso"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{workoutExercise.rest_seconds || 60}s descanso</span>
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="text-base font-bold text-[#dae2fd] drop-shadow-md">
                      {exercise?.name || 'Exercício'}
                    </h3>
                  </div>
                </div>

                {/* Coach Note / Cadence */}
                {workoutExercise.coach_notes && (
                  <div className="p-3 bg-[#131b2e] border-b border-[#3c4a42]/30 flex items-start gap-2.5 text-xs text-[#bbcabf]">
                    <Brain className="w-4 h-4 text-[#4edea3] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#4edea3] block font-mono-metric text-[10px] uppercase">
                        Dica do Coach Rodrigo:
                      </strong>
                      <span>{workoutExercise.coach_notes}</span>
                    </div>
                  </div>
                )}

                {/* Sets Table */}
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-mono-metric text-[#86948a] uppercase font-semibold px-2">
                    <span className="col-span-2">Série</span>
                    <span className="col-span-3 text-center">Anterior</span>
                    <span className="col-span-3 text-center">Carga kg</span>
                    <span className="col-span-2 text-center">Reps</span>
                    <span className="col-span-2 text-right">Feito</span>
                  </div>

                  {Array.from({ length: workoutExercise.target_sets }).map((_, setIdx) => {
                    const key = `${workoutExercise.id}-${setIdx}`;
                    const state = sessionSets[key] || {
                      completed: false,
                      actualReps: workoutExercise.target_reps.split('-')[0].trim(),
                      actualWeight: workoutExercise.target_weight_kg,
                    };

                    return (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all ${
                          state.completed
                            ? 'bg-[#10b981]/15 border border-[#10b981]/40'
                            : 'bg-[#0b1326] border border-[#3c4a42]/30'
                        }`}
                      >
                        {/* Set index */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className="font-mono-metric font-bold text-xs text-[#dae2fd]">
                            {setIdx + 1}ª
                          </span>
                        </div>

                        {/* Previous Load */}
                        <div className="col-span-3 text-center font-mono-metric text-xs text-[#86948a]">
                          {workoutExercise.target_weight_kg} kg
                        </div>

                        {/* Actual Weight input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={state.actualWeight}
                            onChange={(e) => handleUpdateSetInput(workoutExercise.id, setIdx, 'actualWeight', e.target.value)}
                            className="w-full h-8 rounded-lg bg-[#171f33] text-center font-mono-metric font-bold text-xs text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                          />
                        </div>

                        {/* Actual Reps input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={state.actualReps}
                            onChange={(e) => handleUpdateSetInput(workoutExercise.id, setIdx, 'actualReps', e.target.value)}
                            className="w-full h-8 rounded-lg bg-[#171f33] text-center font-mono-metric font-bold text-xs text-[#4edea3] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                          />
                        </div>

                        {/* Complete Checkbox Button */}
                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => handleToggleSet(workoutExercise, setIdx, workoutExercise.target_reps, workoutExercise.target_weight_kg)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              state.completed
                                ? 'bg-[#10b981] text-[#003824] shadow-md shadow-[#10b981]/30 font-bold'
                                : 'bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] hover:bg-[#31394d]'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. STICKY REST TIMER & MANUAL PRESETS */}
      {/* ------------------------------------------------------------- */}
      {timerActive || lastFinishedTimer ? (
        <div className="fixed bottom-4 left-3 right-3 max-w-lg mx-auto z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-[#171f33]/98 backdrop-blur-xl border border-[#3c4a42]/70 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Big Time Badge & Status */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`min-w-[80px] h-11 px-2.5 rounded-xl flex items-center justify-center font-mono-metric font-bold text-base sm:text-lg border flex-shrink-0 tracking-wider shadow-inner transition-colors ${
                    lastFinishedTimer
                      ? 'bg-[#10b981] text-[#003824] border-[#4edea3]'
                      : timerSecondsRemaining <= 3 && timerSecondsRemaining > 0
                      ? 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f] animate-pulse'
                      : isTimerPaused
                      ? 'bg-[#0b1326] text-[#bbcabf] border-[#3c4a42]/60'
                      : 'bg-[#0b1326] text-[#4edea3] border-[#3c4a42]/80'
                  }`}
                >
                  {lastFinishedTimer ? 'PRONTO!' : formatTime(timerSecondsRemaining)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-metric text-xs uppercase font-bold text-[#4edea3] truncate">
                      {lastFinishedTimer
                        ? 'Descanso Concluído!'
                        : isTimerPaused
                        ? 'Cronômetro Pausado'
                        : 'Descanso em Andamento'}
                    </span>
                    {!lastFinishedTimer && !isTimerPaused && (
                      <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#bbcabf] truncate">
                    {lastFinishedTimer
                      ? 'Inicie a próxima série de exercícios'
                      : 'Recuperação muscular em andamento'}
                  </p>
                </div>
              </div>

              {/* Right: Quick Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!lastFinishedTimer ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAdjustTimer(-15)}
                      className="px-2 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#dae2fd] text-xs font-mono-metric font-bold transition-colors cursor-pointer"
                      title="-15 segundos"
                    >
                      -15s
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustTimer(30)}
                      className="px-2 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#4edea3] text-xs font-mono-metric font-bold transition-colors cursor-pointer"
                      title="+30 segundos"
                    >
                      +30s
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTimerPaused(prev => !prev)}
                      className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] transition-colors cursor-pointer"
                      title={isTimerPaused ? 'Retomar' : 'Pausar'}
                    >
                      {isTimerPaused ? <Play className="w-4 h-4 text-[#4edea3]" /> : <Pause className="w-4 h-4 text-[#bbcabf]" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestartTimer}
                      className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#dae2fd] transition-colors cursor-pointer"
                      title="Reiniciar tempo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleRestartTimer}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#003824] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Repetir</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTimerActive(false);
                    setIsTimerPaused(false);
                    setLastFinishedTimer(false);
                  }}
                  className="p-1.5 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#86948a] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                  title="Fechar Cronômetro"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            {!lastFinishedTimer && (
              <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#10b981] to-[#4edea3] h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((timerTotalSeconds - timerSecondsRemaining) / (timerTotalSeconds || 1)) * 100
                      )
                    )}%`
                  }}
                ></div>
              </div>
            )}

            {/* Lock Screen Live Widget Indicator */}
            <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono-metric border-t border-[#3c4a42]/30">
              <div className="flex items-center gap-1.5 text-[#4edea3]">
                <Radio className="w-3 h-3 text-[#10b981] animate-pulse" />
                <span>Widget de Bloqueio Conectado</span>
              </div>
              <span className="text-[#86948a] truncate max-w-[150px]">
                {currentActiveExercise?.name || 'Exercício Atual'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Floating Quick Rest Timer Bar when idle */
        <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-40">
          {showManualTimerPresets ? (
            <div className="bg-[#171f33]/95 backdrop-blur-xl border border-[#3c4a42]/70 rounded-2xl p-2.5 shadow-2xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-mono-metric text-[11px] font-bold uppercase text-[#4edea3] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Iniciar Cronômetro de Descanso
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualTimerPresets(false)}
                  className="p-1 rounded-md text-[#86948a] hover:text-[#dae2fd]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[30, 45, 60, 90].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => triggerRestTimer(sec)}
                    className="py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#10b981] hover:text-[#003824] text-[#dae2fd] text-xs font-mono-metric font-bold transition-all cursor-pointer"
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowManualTimerPresets(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#171f33]/90 hover:bg-[#222a3d] backdrop-blur-md text-[#bbcabf] hover:text-[#4edea3] border border-[#3c4a42]/60 shadow-lg text-xs font-mono-metric font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Cronômetro de Descanso</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FINISHED WORKOUT CELEBRATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#171f33] rounded-3xl p-6 border border-[#3c4a42]/60 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center mx-auto border border-[#4edea3]/40 shadow-lg shadow-[#10b981]/20">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#dae2fd]">Treino Concluído!</h3>
              <p className="text-xs text-[#bbcabf]">
                Parabéns pelo empenho, <strong>{student.full_name.split(' ')[0]}</strong>! Sua evolução foi registrada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a]">Séries Feitas</span>
                <span className="font-mono-metric text-lg font-bold text-[#4edea3] block">{completedSetsCount} séries</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a]">Volume Total</span>
                <span className="font-mono-metric text-lg font-bold text-[#c0c1ff] block">7.840 kg</span>
              </div>
            </div>

            {/* RPE Selector */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-[#bbcabf] flex justify-between">
                <span>Percepção de Esforço (RPE):</span>
                <span className="font-mono-metric text-[#ffb95f] font-bold">{sessionRPE} / 10</span>
              </label>
              <input
                type="range"
                min="5"
                max="10"
                step="0.5"
                value={sessionRPE}
                onChange={(e) => setSessionRPE(Number(e.target.value))}
                className="w-full accent-[#10b981] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-metric text-[#86948a]">
                <span>5 (Leve)</span>
                <span>8.5 (Ideal)</span>
                <span>10 (Falha Máxima)</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowFinishedModal(false);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all active:scale-95"
            >
              Salvar & Fechar Sessão
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. LOCK SCREEN WIDGET & NOTIFICATIONS INFO MODAL */}
      {/* ------------------------------------------------------------- */}
      {showLockScreenHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#171f33] border border-[#3c4a42]/70 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#4edea3]/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#dae2fd]">Widget de Tela de Bloqueio</h3>
                  <span className="text-[10px] font-mono-metric text-[#4edea3]">Media Session API • Tempo Real</span>
                </div>
              </div>
              <button
                onClick={() => setShowLockScreenHelp(false)}
                className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#bbcabf]">
              <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#dae2fd]">
                  <Radio className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Reprodutor na Tela de Bloqueio</span>
                </div>
                <p className="text-[11px] text-[#86948a] leading-relaxed">
                  Quando você bloqueia o celular, o reprodutor do sistema (igual ao do Spotify) exibe o <strong>exercício atual</strong>, a <strong>série</strong> e a <strong>contagem regressiva de descanso</strong> sem precisar desbloquear.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] font-mono-metric text-[#4edea3]">
                  <span>• Pausar/Retomar</span>
                  <span>• +30s / -15s</span>
                  <span>• Barra de Progresso</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0b1326] border border-[#3c4a42]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#dae2fd]">
                  <BellRing className="w-3.5 h-3.5 text-[#ffb95f]" />
                  <span>Notificação & Vibração ao Zerar</span>
                </div>
                <p className="text-[11px] text-[#86948a] leading-relaxed">
                  Quando o descanso zerar, o celular vibra no seu bolso e dispara uma notificação avisando o início da próxima série.
                </p>
                {notificationPermission !== 'granted' ? (
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={async () => {
                        const perm = await lockScreenManager.requestNotificationPermission();
                        setNotificationPermission(perm);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] hover:brightness-110 text-[#003824] font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Solicitar Permissão de Notificação</span>
                    </button>
                    <p className="text-[10px] text-[#86948a] leading-tight">
                      💡 <strong>No iPhone (iOS)</strong>: As notificações de Web Push exigem que o app esteja instalado na Tela Inicial (Menu Compartilhar &gt; Adicionar à Tela de Início). O <strong>Widget do Cronômetro na Tela de Bloqueio (Media Session)</strong> funciona automaticamente ao iniciar o treino!
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#4edea3] text-[11px] font-semibold pt-0.5 bg-[#10b981]/10 p-2 rounded-xl border border-[#10b981]/30">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    <span>Notificações na Tela de Bloqueio ativadas!</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowLockScreenHelp(false)}
              className="w-full py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-bold transition-colors cursor-pointer"
            >
              OK, Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
