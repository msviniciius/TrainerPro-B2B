import React, { useState, useEffect, useRef } from 'react';
import { Student, WorkoutPlan, WorkoutExercise, ExerciseLog, PersonalTrainer } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';
import { soundManager } from '../../utils/audio';
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
  Copy,
  CreditCard
} from 'lucide-react';

interface StudentPWAProps {
  student: Student;
  workoutPlans: WorkoutPlan[];
  onLogExerciseSet: (log: Partial<ExerciseLog>) => void;
  onExitPWA?: () => void;
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
  const [sessionSets, setSessionSets] = useState<Record<string, ActiveSetState>>({
    // Initial sample default
    'we-001-0': { completed: true, actualReps: 10, actualWeight: 28 },
    'we-001-1': { completed: true, actualReps: 10, actualWeight: 28 },
  });

  // Sticky Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(60);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(0);
  const [lastFinishedTimer, setLastFinishedTimer] = useState(false);

  // Finished Session Modal
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [sessionRPE, setSessionRPE] = useState<number>(8.5);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            setTimerActive(false);
            setLastFinishedTimer(true);
            if (soundEnabled) {
              soundManager.playCompletionChime();
              soundManager.triggerVibration([200, 100, 200, 100, 300]);
            }
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
  }, [timerActive, timerSecondsRemaining, soundEnabled]);

  // Start rest timer
  const triggerRestTimer = (seconds: number) => {
    setTimerTotalSeconds(seconds);
    setTimerSecondsRemaining(seconds);
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

  // Format timer MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
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
        {onExitPWA && (
          <button
            onClick={onExitPWA}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171f33] text-[#bbcabf] text-xs font-semibold border border-[#3c4a42]/50 hover:text-white"
          >
            ← Voltar ao Dashboard do Coach
          </button>
        )}

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
                    <span className="px-2 py-1 rounded-lg bg-[#0b1326]/90 backdrop-blur-md text-[#ffb95f] font-mono-metric text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {workoutExercise.rest_seconds}s descanso
                    </span>
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
      {/* 3. STICKY REST TIMER (CRONÔMETRO FLUTUANTE DE DESCANSO) */}
      {/* ------------------------------------------------------------- */}
      {timerActive || lastFinishedTimer ? (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-[#171f33]/95 backdrop-blur-xl border border-[#3c4a42]/60 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono-metric font-bold text-lg border ${
                  timerSecondsRemaining <= 3 && timerSecondsRemaining > 0
                    ? 'bg-[#ffb95f]/30 text-[#ffb95f] border-[#ffb95f] animate-ping'
                    : lastFinishedTimer
                    ? 'bg-[#10b981] text-[#003824] border-[#4edea3]'
                    : 'bg-[#0b1326] text-[#4edea3] border-[#3c4a42]/50'
                }`}>
                  {lastFinishedTimer ? 'GO!' : formatTime(timerSecondsRemaining)}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-metric text-xs uppercase font-bold text-[#4edea3]">
                      {lastFinishedTimer ? 'Descanso Finalizado!' : 'Tempo de Descanso'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                  </div>
                  <p className="text-xs text-[#bbcabf]">
                    {lastFinishedTimer ? 'Inicie sua próxima série de treino' : 'Recuperação dos estoques de fosfocreatina'}
                  </p>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTimerSecondsRemaining(prev => Math.max(0, prev - 15))}
                  className="px-2 py-1.5 rounded-xl bg-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] text-xs font-mono-metric font-bold"
                  title="-15 segundos"
                >
                  -15s
                </button>

                <button
                  onClick={() => setTimerSecondsRemaining(prev => prev + 30)}
                  className="px-2 py-1.5 rounded-xl bg-[#222a3d] text-[#4edea3] hover:bg-[#31394d] text-xs font-mono-metric font-bold"
                  title="+30 segundos"
                >
                  +30s
                </button>

                <button
                  onClick={() => {
                    setTimerActive(false);
                    setLastFinishedTimer(false);
                  }}
                  className="p-1.5 rounded-xl bg-[#222a3d] text-[#86948a] hover:text-[#ffb4ab]"
                  title="Fechar Timer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {!lastFinishedTimer && (
              <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#10b981] to-[#4edea3] h-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((timerTotalSeconds - timerSecondsRemaining) / timerTotalSeconds) * 100))}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ) : null}

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
                alert('Sessão registrada com sucesso no banco de dados do Coach Rodrigo!');
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#10b981]/20 transition-all active:scale-95"
            >
              Salvar & Fechar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
